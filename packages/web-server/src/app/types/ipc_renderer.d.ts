declare namespace AnyListen {
  interface IpcRendererEvent {
    event: Electron.IpcRendererEvent
  }
  interface IpcRendererEventParams<T> {
    event: Electron.IpcRendererEvent
    params: T
  }
  type IpcRendererEventListener = (params: AnyListen.IpcRendererEvent) => any
  type IpcRendererEventListenerParams<T> = (params: AnyListen.IpcRendererEventParams<T>) => any
}
