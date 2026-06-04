// import { registerDevRouter } from './dev'
import { API_PREFIX } from '@any-listen/common/constants'
import Router from '@koa/router'

import { registerIpcRouter } from './ipc'
import { registerJobsRouter } from './jobs'
import { registerProxyRouter } from './proxyServer'
import { registerSubsonicRouter } from './subsonic'

const router = new Router<unknown, AnyListen.RequestContext>()

router.prefix(API_PREFIX)

// if (import.meta.env.DEV) registerDevRouter(router)

registerIpcRouter(router)
registerProxyRouter(router)
registerSubsonicRouter(router)
registerJobsRouter(router)

export default router
