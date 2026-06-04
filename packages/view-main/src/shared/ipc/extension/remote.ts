import { extensionEvent } from './event'

export default {
  async extensionEvent(action) {
    extensionEvent.emit(action)
  },
} satisfies Partial<AnyListen.IPC.ClientIPC>
