import { dislikeActionEvent } from './event'

export default {
  async dislikeAction(action) {
    dislikeActionEvent.emit(action)
  },
} satisfies Partial<AnyListen.IPC.ClientIPC>
