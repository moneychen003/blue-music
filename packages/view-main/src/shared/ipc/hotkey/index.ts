import { ipc } from '../ipc'

export const getHotKey: AnyListen.IPC.ServerIPC['getHotKey'] = async () => {
  return ipc.getHotKey()
}

export const getHotkeyStatus: AnyListen.IPC.ServerIPC['getHotkeyStatus'] = async () => {
  return ipc.getHotkeyStatus()
}
export const hotkeyConfigAction: AnyListen.IPC.ServerIPC['hotkeyConfigAction'] = async (action) => {
  return ipc.hotkeyConfigAction(action)
}
