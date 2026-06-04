import type { ExtensionContext, Logcat } from './extensions/type'

export interface ExtensionState {
  extension: AnyListen.Extension.Extension
  context: ExtensionContext
  logcat: Logcat
}

export const internalExtensionContextState = {
  contexts: new Map<string, ExtensionState>(),
}
