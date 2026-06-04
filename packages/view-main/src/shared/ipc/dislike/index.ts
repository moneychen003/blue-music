import { ipc } from '../ipc'

export const getInfo: AnyListen.IPC.ServerIPC['getDislikeInfo'] = async () => {
  return ipc.getDislikeInfo()
}

export const sendAction: AnyListen.IPC.ServerIPC['dislikeAction'] = async (action) => {
  return ipc.dislikeAction(action)
}
