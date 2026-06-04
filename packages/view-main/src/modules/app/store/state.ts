export interface InitState {
  machineId: string
  rootOffsetX: number
  rootOffsetY: number
  isShowPact: boolean
  isShowChangeLog: boolean
  isFullscreen: boolean
  proxy: {
    enable: boolean
    host: string
    port: string
    username: string
    password: string

    envProxy?: {
      host: string
      port: string
    }
  }
  workerInitPromiseMain: Promise<void>
  os: 'windows' | 'linux' | 'mac'
}

export const appState: InitState = {
  machineId: '',
  rootOffsetX: window.dt ? 0 : 8,
  rootOffsetY: window.dt ? 0 : 8,
  isShowPact: false,
  isShowChangeLog: false,
  isFullscreen: false,
  proxy: {
    enable: false,
    host: '',
    port: '',
    username: '',
    password: '',
  },
  workerInitPromiseMain: Promise.resolve(),
  os: window.os,
}
