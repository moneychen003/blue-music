import { soundEffectEvent } from './event'
import { soundEffectState } from './state'

export const setUserEqPresetList = (list: AnyListen.SoundEffect.EQPreset[]) => {
  soundEffectState.userEqPresetList = list
  soundEffectEvent.userEqPresetListUpdated(list)
}
export const updateUserEqPresetList = (preset: AnyListen.SoundEffect.EQPreset) => {
  const target = soundEffectState.userEqPresetList!.find((p) => p.id == preset.id)
  if (target) Object.assign(target, preset)
  else soundEffectState.userEqPresetList!.push(preset)
  soundEffectEvent.userEqPresetListUpdated([...soundEffectState.userEqPresetList!])
}
export const removeUserEqPresetList = (id: string) => {
  const index = soundEffectState.userEqPresetList!.findIndex((p) => p.id == id)
  if (index < 0) return
  soundEffectState.userEqPresetList!.splice(index, 1)
  soundEffectEvent.userEqPresetListUpdated([...soundEffectState.userEqPresetList!])
}

export const setUserConvolutionPresetList = (list: AnyListen.SoundEffect.ConvolutionPreset[]) => {
  soundEffectState.userConvolutionPresetList = list
  soundEffectEvent.userConvolutionPresetListUpdated(list)
}
export const updateUserConvolutionPresetList = (preset: AnyListen.SoundEffect.ConvolutionPreset) => {
  const target = soundEffectState.userConvolutionPresetList!.find((p) => p.id == preset.id)
  if (target) Object.assign(target, preset)
  else soundEffectState.userConvolutionPresetList!.push(preset)
  soundEffectEvent.userConvolutionPresetListUpdated([...soundEffectState.userConvolutionPresetList!])
}
export const removeUserConvolutionPresetList = (id: string) => {
  const index = soundEffectState.userConvolutionPresetList!.findIndex((p) => p.id == id)
  if (index < 0) return
  soundEffectState.userConvolutionPresetList!.splice(index, 1)
  soundEffectEvent.userConvolutionPresetListUpdated([...soundEffectState.userConvolutionPresetList!])
}
