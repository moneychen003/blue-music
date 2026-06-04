import { listActionEvent } from './event'

export default {
  async listAction(action) {
    listActionEvent.emit(action)
  },
} satisfies Partial<AnyListen.IPC.ClientIPC>
