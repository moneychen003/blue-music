import { proxyRequest } from '@any-listen/app/modules/proxyServer'
import { PROXY_SERVER_PATH } from '@any-listen/common/constants'
import type Router from '@koa/router'

export const registerProxyRouter = (router: Router<unknown, AnyListen.RequestContext>) => {
  router.get(`${PROXY_SERVER_PATH}/:name`, async (ctx, next) => {
    const result = await proxyRequest(ctx.params.name, ctx.headers.range)
    if (!result) {
      ctx.status = 404
      ctx.body = 'Not Found'
      return
    }
    ctx.status = result.statusCode
    for (const [k, v] of Object.entries(result.headers)) {
      ctx.set(k, v)
    }
    ctx.body = result.body
  })
}
