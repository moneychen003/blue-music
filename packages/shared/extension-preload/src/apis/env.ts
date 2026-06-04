import { localeEvent } from '@/event'
import { hostContext } from '@/host/state'

export const env: AnyListen_API.Env = {
  /** 客户端类型 */
  get clientType() {
    return hostContext.clientType
  },
  /** 扩展系统版本号 */
  get version() {
    return hostContext.version
  },
  /** 运行平台 */
  get platform() {
    return hostContext.platform
  },
  /** 架构 */
  get arch() {
    return hostContext.arch
  },
  /** 语言 */
  get locale() {
    return hostContext.locale
  },
  get publicKey() {
    return hostContext.extension.publicKey
  },
  get extensionVersion() {
    return hostContext.extension.version
  },
  onLocaleChanged: localeEvent.on.bind(localeEvent),
  // extensionInfo: {
  //   name: '',
  //   description: '',
  //   version: '',
  //   author: '',
  //   homepage: '',
  //   rawScript: '',
  // },
} as const
