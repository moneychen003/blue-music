import type { IPCSocket } from '@/preload/ws'

// // 暴露给后端的方法
// export const createExposeDislike = () => {
//   return {
//     async dislikeAction(event, action) {
//       ipcPreloadEvent.dislikeAction(action)
//     },
//   } satisfies Partial<ExposeFunctions>
// }

// 暴露给前端的方法
export const createClientSoundEffect = (ipcSocket: IPCSocket) => {
  return {
    async getUserSoundEffectEQPresetList() {
      return ipcSocket.remote.getUserSoundEffectEQPresetList()
    },
    async saveUserSoundEffectEQPresetList(list) {
      return ipcSocket.remote.saveUserSoundEffectEQPresetList(list)
    },
    async getUserSoundEffectConvolutionPresetList() {
      return ipcSocket.remote.getUserSoundEffectConvolutionPresetList()
    },
    async saveUserSoundEffectConvolutionPresetList(list) {
      return ipcSocket.remote.saveUserSoundEffectConvolutionPresetList(list)
    },
  } satisfies Partial<AnyListen.IPC.ServerIPC>
}
