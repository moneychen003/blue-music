import type { ExtensionHostContext, Logcat } from '../type'

const logcat = {} as unknown as Logcat
const hostContext = {} as unknown as ExtensionHostContext
export const initHostContext = (_hostContext: ExtensionHostContext) => {
  Object.assign(logcat, _hostContext.logcat)
  Object.assign(hostContext, _hostContext)
}

export { hostContext, logcat }
