import '@any-listen/types/types/extension'
import '@any-listen/types/types/extension_vm'

declare global {
  namespace AnyListen {
    type PreloadFuncs = WarpPromiseRecord<IPCExtension.ExtensionIPCActions>
  }
}
