import { ipc } from '../ipc'

export const getPlayInfo = async () => {
  return ipc.getPlayInfo()
}
export const sendPlayerEvent = async (event: AnyListen.IPCPlayer.PlayerEvent) => {
  return ipc.playerEvent(event)
}

export const sendPlayListAction = async (action: AnyListen.IPCPlayer.PlayListAction) => {
  return ipc.playListAction(action)
}
export const sendPlayHistoryListAction = async (action: AnyListen.IPCPlayer.PlayHistoryListAction) => {
  return ipc.playHistoryListAction(action)
}
