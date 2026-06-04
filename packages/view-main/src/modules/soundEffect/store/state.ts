export interface InitState {
  userEqPresetList: AnyListen.SoundEffect.EQPreset[] | null
  userConvolutionPresetList: AnyListen.SoundEffect.ConvolutionPreset[] | null
}

export const soundEffectState: InitState = {
  userEqPresetList: null,
  userConvolutionPresetList: null,
}
