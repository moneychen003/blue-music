import type { ClientCall, ExposeFunctions, MainCall } from '.'

// 暴露给后端的方法
export const createExposeDislike = (client: ClientCall) => {
  return {
    async dislikeAction(event, action) {
      return client.dislikeAction(action)
    },
  } satisfies Partial<ExposeFunctions>
}

// 暴露给前端的方法
export const createClientDislike = (main: MainCall) => {
  return {
    async getDislikeInfo() {
      return main.getDislikeInfo()
    },
    async dislikeAction(action) {
      return main.dislikeAction(action)
    },
  } satisfies Partial<AnyListen.IPC.ServerIPC>
}
