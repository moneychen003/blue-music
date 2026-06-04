export default () => {
  const proxyHeaderKey = global.anylisten.config['upstreamProxy.enabled'] && global.anylisten.config['upstreamProxy.header']

  return async (ctx: AnyListen.RequestContext, next: AnyListen.Next): Promise<unknown> => {
    ctx.userIp = (proxyHeaderKey && (ctx.headers[proxyHeaderKey] as string | undefined)) || ctx.ip
    ctx.now = Date.now()
    return next()
  }
}
