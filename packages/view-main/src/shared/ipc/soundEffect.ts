import { ipc } from './ipc'

export const getUserEQPresetList = async () => {
  return ipc.getUserSoundEffectEQPresetList()
}
export const saveUserSoundEffectEQPresetList: AnyListen.IPC.ServerIPC['saveUserSoundEffectEQPresetList'] = async (list) => {
  return ipc.saveUserSoundEffectEQPresetList(list)
}

export const getUserSoundEffectConvolutionPresetList = async () => {
  return ipc.getUserSoundEffectConvolutionPresetList()
}
export const saveUserSoundEffectConvolutionPresetList: AnyListen.IPC.ServerIPC['saveUserSoundEffectConvolutionPresetList'] =
  async (list) => {
    return ipc.saveUserSoundEffectConvolutionPresetList(list)
  }
