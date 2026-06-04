// import { extensionAPIEvent, type ExtensionAPIEventType } from './event'

// const VERSION = '1.0.0'

// const events: {
//   on: ExtensionAPIEventType['on']
//   off: ExtensionAPIEventType['off']
// } = {
//   /** 监听事件 */
//   on(name, handler) {
//     return extensionAPIEvent.on(name, handler)
//   },
//   /** 注销事件监听 */
//   off(name, handler) {
//     extensionAPIEvent.off(name, handler)
//   },
// }

// const api = {
//   /** 环境相关信息 */
//   env: {
//     /** 扩展系统版本号 */
//     version: VERSION,
//     /** 运行平台 */
//     platform: process.platform,
//     /** 架构 */
//     arch: process.arch,
//     /** 语言 */
//     locale() {

//     },
//   },
//   /** APP、扩展生命周期事件钩子 */
//   events,
//   storage: {
//     getItem(key: string): void
//     setItem(key: string, value: string): void
//     removeItem(key: string): void
//     clearItem(): void
//   }
// }
