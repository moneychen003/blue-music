import '@any-listen/types/types/extension'
import '@any-listen/types/types/extension_vm'

declare global {
  namespace AnyListen {
    // type HostFuncs = WarpPromiseRecord<Record<string, (...args: any[]) => any>>
    type HostFuncs = WarpPromiseRecord<IPCExtension.PreloadIPCActions>
  }
}
