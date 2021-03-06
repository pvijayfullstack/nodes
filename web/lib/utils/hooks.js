import React from 'react'
import { useRouter } from 'next/router'

export const usePageState = napi => {
  const router = useRouter()
  const [state, setState] = React.useState({ node: null, view: null, viewer: null })
  const { node: nodeId, parent: parentId } = router.query
  React.useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const nodeId = query.get('node')
    const parentId = query.get('parent')
    const _view = query.get(`${nodeId}-view`)
    const plain = router.query[`${nodeId}-plain`] || nodeId === '__login__' || !nodeId
    const view = plain ? _view : 'ui'
    const getPageState = async () => {
      const viewer = await napi.login()
      console.log('getPageState viewer', viewer)
      if (viewer === null && nodeId !== '__login__') {
        return router.push({ pathname: router.pathname, query: nodeId ? { node: '__login__', parent: nodeId } : { node: '__login__' } })
      }
      if (viewer && (!nodeId || nodeId === '__login__')) {
        return router.push({ pathname: router.pathname, query: { node: (!nodeId || nodeId === '__login__') ? viewer.node : nodeId } })
      }
      // const node = nodeId ? await napi.getNode(nodeId, parentId) : null
      // new experimental node creation from url:
      let node
      if (nodeId) {
        if (nodeId.startsWith('http')) {
          node = await napi.createNode(null, { parentId: parentId || viewer.node, name: query.get('title') || nodeId, sides: { link: { url: nodeId } } })
          return router.push({ pathname: router.pathname, query: { node: node.id } })
        } else {
          node = await napi.getNode(nodeId, parentId)
        }
      }
      setState({ node, viewer, view })
    }
    // NOTE: hack to overcome how next.js handle prerendering, when on first load router.query is empty, while actual query is not.
    if (nodeId === (router.query.node || null)) {
      getPageState()
    }
  }, [nodeId, parentId])
  return state
}
