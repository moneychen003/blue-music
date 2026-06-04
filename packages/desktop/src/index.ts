import path from 'node:path'

import { isLinux } from '@any-listen/nodejs/index'
import { app } from 'electron'

import { appState, initAppEnv, sendInitedEvent } from '@/app'

import './shared/error'
import './shared/log'
// import registerModules from '@/modules'
import { initI18n } from './i18n'
import { initModules } from './modules'
import { initRenderers } from './renderer'
import { startCommonWorkers, startExtensionServiceWorker } from './worker'

let initedCount = 0
const handleInited = () => {
  initedCount++
  if (initedCount < 3) return
  sendInitedEvent()
}
// 初始化应用
const init = async () => {
  console.log('init')
  await initAppEnv()
  initI18n()
  await startCommonWorkers(appState.dataPath)
  void startExtensionServiceWorker()
  void initModules().finally(handleInited)
  await initRenderers()

  // registerModules()
  handleInited()
}

void app.whenReady().then(() => {
  // dev 模式 dock 默认是 Electron 图标;显式设置成 app 图标(网易云)
  if (process.platform === 'darwin') {
    const staticPath = import.meta.env.DEV ? __STATIC_PATH__ : path.join(__dirname, '../static')
    try {
      app.dock?.setIcon(path.join(staticPath, 'dock-icon.png'))
    } catch {}
  }
  // https://github.com/electron/electron/issues/16809
  if (isLinux) {
    setTimeout(() => {
      handleInited()
    }, 300)
  } else handleInited()
})

void init()
