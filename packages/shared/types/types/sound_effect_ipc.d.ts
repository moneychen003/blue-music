declare namespace AnyListen {
  namespace IPCSoundEffect {
    type ServerActions = WarpPromiseRecord<{
      /** 获取均衡器预设 */
      getUserSoundEffectEQPresetList: () => SoundEffect.EQPreset[]
      /** 保存均衡器预设 */
      saveUserSoundEffectEQPresetList: (list: SoundEffect.EQPreset[]) => void
      /** 获取环境音效预设 */
      getUserSoundEffectConvolutionPresetList: () => SoundEffect.ConvolutionPreset[]
      /** 保存环境音效预设 */
      saveUserSoundEffectConvolutionPresetList: (list: SoundEffect.ConvolutionPreset[]) => void
    }>
    type ServerIPCActions<Socket = undefined> = IPC.WarpIPCHandlerActions<Socket, ServerActions>
  }
}
