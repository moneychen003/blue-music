declare namespace AnyListen {
  interface IpcMainEvent {
    event: Electron.IpcMainEvent
  }
  interface IpcMainEventParams<T> {
    event: Electron.IpcMainEvent
    params: T
  }
  type IpcMainEventListener = (params: AnyListen.IpcMainEvent) => void
  type IpcMainEventListenerParams<T> = (params: AnyListen.IpcMainEventParams<T>) => void

  interface IpcMainInvokeEvent {
    event: Electron.IpcMainInvokeEvent
  }
  interface IpcMainInvokeEventParams<T> {
    event: Electron.IpcMainInvokeEvent
    params: T
  }

  type IpcMainInvokeEventListener = (params: AnyListen.IpcMainInvokeEvent) => Promise<void>
  type IpcMainInvokeEventListenerParams<T> = (params: AnyListen.IpcMainInvokeEventParams<T>) => Promise<void>
  type IpcMainInvokeEventListenerValue<V> = (params: AnyListen.IpcMainInvokeEvent) => Promise<V>
  type IpcMainInvokeEventListenerParamsValue<T, V> = (params: AnyListen.IpcMainInvokeEventParams<T>) => Promise<V>
}
