import { themeChangedEvent, themeListChangedEvent } from './event'

export default {
  async themeChanged(setting) {
    themeChangedEvent.emit(setting)
  },
  async themeListChanged(list) {
    themeListChangedEvent.emit(list)
  },
} satisfies Partial<AnyListen.IPC.ClientIPC>
