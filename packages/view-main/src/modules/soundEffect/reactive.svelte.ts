import { initUserConvolutionPresetList, initUserEQPresetList } from './store/actions'
import { soundEffectEvent } from './store/event'
import { soundEffectState } from './store/state'

export const useUserEqPresetList = () => {
  let list = $state.raw<AnyListen.SoundEffect.EQPreset[]>([])

  $effect(() => {
    void initUserEQPresetList().then(() => {
      list = soundEffectState.userEqPresetList!
    })
    return soundEffectEvent.on('userEqPresetListUpdated', (l) => {
      list = l
    })
  })

  return {
    get val() {
      return list
    },
  }
}

export const useUserConvolutionPresetList = () => {
  let list = $state.raw<AnyListen.SoundEffect.ConvolutionPreset[]>([])

  $effect(() => {
    void initUserConvolutionPresetList().then(() => {
      list = soundEffectState.userConvolutionPresetList!
    })
    return soundEffectEvent.on('userConvolutionPresetListUpdated', (l) => {
      list = l
    })
  })

  return {
    get val() {
      return list
    },
  }
}
