import { httpLog } from '@/shared/log4js'
// console.log('load http log module.')

export default async (ctx: AnyListen.RequestContext, next: AnyListen.Next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  httpLog.trace(`${ctx.method} - ${ctx.status} - ${ctx.userIp} - ${ms}ms - ${ctx.url}\n${ctx.headers['user-agent']}\n`)
}
