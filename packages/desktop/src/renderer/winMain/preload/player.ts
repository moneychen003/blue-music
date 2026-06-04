import type { ClientCall, ExposeFunctions, MainCall } from '.'

// 暴露给后端的方法
export const createExposePlayer = (client: ClientCall) => {
  return {
    async playerAction(event, action) {
      return client.playerAction(action)
    },
    async playListAction(event, action) {
      return client.playListAction(action)
    },
    async playHistoryListAction(event, action) {
      return client.playHistoryListAction(action)
    },
  } satisfies Partial<ExposeFunctions>
}

// 暴露给前端的方法
export const createClientPlayer = (main: MainCall) => {
  return {
    async getPlayInfo() {
      return main.getPlayInfo()
    },
    async playerEvent(event) {
      return main.playerEvent(event)
    },
    async playListAction(action) {
      return main.playListAction(action)
    },
    async playHistoryListAction(action) {
      return main.playHistoryListAction(action)
    },
  } satisfies Partial<AnyListen.IPC.ServerIPC>
}
