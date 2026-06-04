import { appEvent } from '@/app'
import { appState } from '@/app'

import { createLyricWindow, closeLyricWindow, updateLyricWindowConfig } from './main'

export const initWinLyric = () => {
  appEvent.on('inited', () => {
    if (appState.appSetting['desktopLyric.enable']) createLyricWindow()
  })
  appEvent.on('updated_config', (keys) => {
    if (keys.includes('desktopLyric.enable')) {
      if (appState.appSetting['desktopLyric.enable']) createLyricWindow()
      else closeLyricWindow()
      return
    }
    if (keys.some((k) => k.startsWith('desktopLyric.'))) {
      updateLyricWindowConfig(keys)
    }
  })
}
