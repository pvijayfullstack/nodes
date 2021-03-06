export default async ({ __deps__, __imports__ }) => {
  const { Box, TextInput, Button, Keyboard, Anchor } = __imports__.grommet
  const { React, lodash: _, icons } = __imports__.utils
  const { NodeLink } = __imports__.nodehub
  const { napi, NodeView, iconSize, viewer } = __deps__

  const view = ({ node }) => {
    // const value = _.get(node, 'sides.web.src', defaultSrc)
    const [messages, setMessages] = React.useState([])
    const [message, setMessage] = React.useState('')
    console.log('VIEWER', viewer)
    const getOrCreateChatNode = async () => {
      let chatNode = await napi.findNode({ parentId: node.id, name: '.chat' })
      if (chatNode.status === 'error') {
        chatNode = await napi.createNode(null, { parentId: node.id, name: '.chat' })
      }
      return chatNode
    }

    React.useEffect(() => {
      const getInitialMessages = async () => {
        const chatNode = await getOrCreateChatNode()
        console.log('chat node', chatNode)
        const messageNodes = await napi.getNodeChildren(chatNode)
        console.log('message nodes', messageNodes)
        const _messages = await Promise.all(messageNodes.items.map(async msgNode => ({ id: msgNode.id, text: msgNode.name, author: await napi.getNode(msgNode.sides.users.filter(u => u.role === 'admin')[0].id) })))
        // setMessages(messageNodes.items.map(msgNode => ({ id: msgNode.id, text: msgNode.name, author: msgNode.sides.users[0] })))
        setMessages(_messages)
      }
      getInitialMessages()
    }, [])

    React.useEffect(() => {
      const callback = async ({ type, node }) => {
        console.log('chat update!', type, node)
        const author = await napi.getNode(node.sides.users.filter(u => u.role === 'admin')[0].id)
        console.log('author', author)
        if (type === 'add') {
          setMessages([...messages, { id: messages.length + 1, text: node.name, author }])
        }
      }
      const subscribe = async () => {
        const chatNode = await getOrCreateChatNode()
        napi.subscribeToNodeChildrenUpdates(chatNode.id, callback)
      }
      const unsubscribe = async () => {
        const chatNode = await getOrCreateChatNode()
        napi.unsubscribeFromNodeChildrenUpdates(chatNode.id, callback)
      }
      subscribe()
      return () => {
        unsubscribe()
      }
    })

    const sendMessage = async () => {
      console.log('in submit', message)
      if (message !== '') {
        const chatNode = await getOrCreateChatNode()
        const newMessageNode = await napi.createNode(null, { parentId: chatNode.id, name: message, sides: { users: [{ id: viewer.node, role: 'admin' }] } })
        console.log('new message node', newMessageNode)
        // setMessages([...messages, { id: messages.length + 1, text: message }])
        setMessage('')
      }
    }
    return (
      <Box fill align='center' justify='center'>
        <Box overflow='scroll' fill align='center' background={{ color: 'black', opacity: 'medium' }} pad='small'>
          {messages.map(message => {
            return (
              <Box key={message.id} fill='horizontal' height={{ min: 'xsmall', max: 'xsmall' }} background={{ color: 'black', opacity: 'medium' }} pad='small'>
                {message.author.name}: <NodeLink node={message.id}><Anchor>{message.text}</Anchor></NodeLink>
              </Box>
            )
          })}
        </Box>
        <Box direction='row' fill='horizontal' pad='small' background={{ color: 'black', opacity: 'medium' }} gap='xsmall'>
          <Keyboard onEnter={e => sendMessage()}><TextInput autoFocus value={message} onChange={event => setMessage(event.target.value)} /></Keyboard>
          <Button label='Send' onClick={() => sendMessage()} />
        </Box>
      </Box>
    )
  }

  const edit = view

  const icon = ({ node }) => <Box fill align='center' justify='center'><icons.Chat size={iconSize} /></Box>
  const preview = icon

  return {
    modes: {
      icon,
      preview,
      view,
      edit
    }
  }
}
