import { playerActionEvent, playHistoryListActionEvent, playListActionEvent } from './event'

export default {
  async playerAction(action) {
    playerActionEvent.emit(action)
  },
  async playListAction(action) {
    playListActionEvent.emit(action)
  },
  async playHistoryListAction(action) {
    playHistoryListActionEvent.emit(action)
  },
} satisfies Partial<AnyListen.IPC.ClientIPC>
