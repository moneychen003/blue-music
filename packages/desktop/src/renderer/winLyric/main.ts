import path from 'node:path'

import { DEV_SERVER_PORTS } from '@any-listen/common/constants'
import { getPlatform } from '@any-listen/nodejs/index'
import { BrowserWindow, MessageChannelMain, ipcMain, screen } from 'electron'

import { appState, updateSetting } from '@/app'
import { encodePath } from '@/shared/electron'
import { throttle } from '@/shared/utils'

import { getWebContents } from '../winMain/main'

let lyricWindow: Electron.BrowserWindow | null = null

let ipcRegistered = false
// 歌词窗渲染器 → 主进程的控制通道(只注册一次)
const registerLyricIpc = () => {
  if (ipcRegistered) return
  ipcRegistered = true
  // 锁定时整窗鼠标穿透;hover 解锁按钮时渲染器临时设 false 让点击落地
  ipcMain.on('desktop-lyric-ignore-mouse', (_e, ignore: boolean) => {
    lyricWindow?.setIgnoreMouseEvents(!!ignore, { forward: true })
  })
  // 切换锁定并持久化(updateSetting 会触发 updated_config → applyLock)
  ipcMain.on('desktop-lyric-set-lock', (_e, lock: boolean) => {
    updateSetting({ 'desktopLyric.isLock': !!lock })
  })
}

const getSetting = () => appState.appSetting

const saveBounds = throttle(() => {
  if (!lyricWindow) return
  const [x, y] = lyricWindow.getPosition()
  const [w, h] = lyricWindow.getSize()
  updateSetting({
    'desktopLyric.x': x,
    'desktopLyric.y': y,
    'desktopLyric.width': w,
    'desktopLyric.height': h,
  })
}, 1000)

const bridgePorts = () => {
  const mainWC = getWebContents()
  if (!mainWC || !lyricWindow) return
  const { port1, port2 } = new MessageChannelMain()
  // port1 → 主窗口(它生成歌词并往这个口发);port2 → 歌词窗(渲染)
  mainWC.postMessage('create-desktop-lyric-process', null, [port1])
  lyricWindow.webContents.postMessage('desktop-lyric-port', null, [port2])
}

export const createLyricWindow = () => {
  if (lyricWindow) {
    showLyricWindow()
    return
  }
  const setting = getSetting()
  const preloadUrl = path.join(encodePath(__dirname), './view-lyric.preload.js')

  let width = setting['desktopLyric.width'] || 800
  let height = setting['desktopLyric.height'] || 180
  let x = setting['desktopLyric.x']
  let y = setting['desktopLyric.y']
  // x/y 为 -1 表示首次:底部居中
  if (x < 0 || y < 0) {
    const area = screen.getPrimaryDisplay().workAreaSize
    x = Math.round((area.width - width) / 2)
    y = area.height - height - 40
  }

  const options: Electron.BrowserWindowConstructorOptions = {
    width,
    height,
    x,
    y,
    minWidth: 300,
    minHeight: 80,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: true,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: !setting['desktopLyric.isShowTaskbar'],
    show: false,
    webPreferences: {
      preload: preloadUrl,
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
      spellcheck: false,
    },
  }
  registerLyricIpc()
  lyricWindow = new BrowserWindow(options)
  lyricWindow.setAlwaysOnTop(setting['desktopLyric.isAlwaysOnTop'], 'screen-saver')
  applyLock(setting['desktopLyric.isLock'])

  const winURL = import.meta.env.DEV
    ? `http://localhost:${DEV_SERVER_PORTS['view-main']}`
    : `file://${path.join(encodePath(__dirname), '../view-main/index.html')}`
  void lyricWindow.loadURL(`${winURL}?os=${getPlatform()}&window=lyric`)

  lyricWindow.once('ready-to-show', () => {
    lyricWindow?.show()
  })
  lyricWindow.webContents.once('did-finish-load', () => {
    bridgePorts()
    lyricWindow?.webContents.send('desktop-lyric-lock-state', getSetting()['desktopLyric.isLock'])
  })
  lyricWindow.on('moved', saveBounds)
  lyricWindow.on('resized', saveBounds)
  lyricWindow.on('closed', () => {
    lyricWindow = null
  })
}

const applyLock = (lock: boolean) => {
  if (!lyricWindow) return
  lyricWindow.setIgnoreMouseEvents(lock, { forward: true })
}

export const showLyricWindow = () => {
  if (!lyricWindow) {
    createLyricWindow()
    return
  }
  if (!lyricWindow.isVisible()) lyricWindow.show()
}

export const closeLyricWindow = () => {
  if (!lyricWindow) return
  lyricWindow.close()
  lyricWindow = null
}

export const isLyricWindowExist = () => !!lyricWindow

export const updateLyricWindowConfig = (keys: Array<keyof AnyListen.AppSetting>) => {
  if (!lyricWindow) return
  const setting = getSetting()
  if (keys.includes('desktopLyric.isAlwaysOnTop')) {
    lyricWindow.setAlwaysOnTop(setting['desktopLyric.isAlwaysOnTop'], 'screen-saver')
  }
  if (keys.includes('desktopLyric.isLock')) {
    applyLock(setting['desktopLyric.isLock'])
  }
  if (keys.includes('desktopLyric.isShowTaskbar')) {
    lyricWindow.setSkipTaskbar(!setting['desktopLyric.isShowTaskbar'])
  }
}
