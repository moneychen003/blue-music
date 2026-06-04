import { settingEvent } from '../setting/store/event'
import { settingState } from '../setting/store/state'
import { setDisabledAutoPause } from './lyric'

export const initMacStatusBarLyric = () => {
  const handleEnable = (enable: boolean) => {
    setDisabledAutoPause(enable, 'statusBarLyric')
  }
  if (settingState.setting['player.isShowStatusBarLyric']) {
    handleEnable(true)
  }

  return settingEvent.on('updated', (keys, settings) => {
    if (keys.includes('player.isShowStatusBarLyric')) {
      handleEnable(settings['player.isShowStatusBarLyric']!)
    }
  })
}
