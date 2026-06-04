import defaultSetting from '@/app/shared/defaultSetting'

export const appState: {
  machineId: string
  envParams: AnyListen.EnvParams
  staticPath: string
  dataPath: string
  cacheDataPath: string
  tempDataPath: string
  version: AnyListen.CurrentVersionInfo
  appSetting: AnyListen.AppSetting
  shouldUseDarkColors: boolean
  proxy: {
    host: string
    port: string
    mode: 'direct' | 'fixed'
  }
} = {
  machineId: '',
  envParams: {
    cmdParams: {},
  },
  proxy: {
    host: '',
    port: '',
    mode: 'direct',
  },
  staticPath: '',
  dataPath: '',
  version: {
    version: '',
    commit: '',
    commitDate: 0,
    newVersion: null,
    isUnknown: false,
    isLatest: false,
    reCheck: false,
    status: 'idle',
    ignoreVersion: null,
    progress: null,
  },
  cacheDataPath: '',
  tempDataPath: '',
  appSetting: defaultSetting,
  shouldUseDarkColors: false,
}
