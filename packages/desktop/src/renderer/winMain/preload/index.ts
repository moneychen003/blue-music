import { ipcRenderer } from 'electron'

import { IPC_NAMES } from '@/shared/ipc/names'
import { createMainCall } from '@/shared/ipc/renderer'

import { createClientApp, createExposeApp } from './app'
import { createClientData } from './data'
import { createClientDislike, createExposeDislike } from './dislike'
import { createClientExtension, createExposeExtension } from './extension'
import { createClientHotkey, createExposeHotkey } from './hotkey'
import { createClientList, createExposeList } from './list'
import { createClientMusic } from './music'
import { createClientPlayer, createExposePlayer } from './player'
import { createClientResource } from './resource'
import { createClientSoundEffect } from './soundEffect'
import { createClientTheme, createExposeTheme } from './theme'
import './env'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

export type ExposeFunctions = AnyListen.IPC.ClientIPCActions<Electron.IpcRendererEvent>
export type ExposeServerFunctions = Omit<
  AnyListen.IPC.ServerIPC,
  'fileSystemAction' | 'getLoginDevices' | 'removeLoginDevice' | 'logout' | 'setSystemThemeMode'
>
export type MainCall = AnyListen.IPC.ServerIPC
export type ClientCall = AnyListen.IPC.ClientIPC

console.log('preload')

const connectIPCService: AnyListen.IPC.ConnectIPCSrivice = ({ onConnected, clientCall }) => {
  const exposeObj: ExposeFunctions = {
    ...createExposeApp(clientCall),
    ...createExposePlayer(clientCall),
    ...createExposeHotkey(clientCall),
    ...createExposeList(clientCall),
    ...createExposeDislike(clientCall),
    ...createExposeTheme(clientCall),
    ...createExposeExtension(clientCall),
  }
  const mainCallUtil = createMainCall<AnyListen.IPC.ServerIPC>(IPC_NAMES.VIEW_MAIN, exposeObj)
  const mainCall = mainCallUtil.remote

  const ipc: ExposeServerFunctions = {
    ...createClientApp(mainCall),
    ...createClientPlayer(mainCall),
    ...createClientData(mainCall),
    ...createClientHotkey(mainCall),
    ...createClientList(mainCall),
    ...createClientMusic(mainCall),
    ...createClientResource(mainCall),
    ...createClientDislike(mainCall),
    ...createClientTheme(mainCall),
    ...createClientExtension(mainCall),
    ...createClientSoundEffect(mainCall),
  }
  onConnected(ipc as AnyListen.IPC.ServerIPC)
}

// @ts-expect-error
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
window.__anylisten_ipc_init__ = connectIPCService

// 桌面歌词:主进程通过 webContents.postMessage 直传歌词窗 MessagePort
ipcRenderer.on('create-desktop-lyric-process', (event) => {
  // contextIsolation 为 false,preload 与渲染器共享 window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const hook = (window as any).__onDesktopLyricPort
  if (hook) hook(event.ports)
})
