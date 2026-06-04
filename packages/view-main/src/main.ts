// import '@common/utils/rendererError'
import { mount } from 'svelte'

import 'virtual:svg-icons-register'
import './app.less'

const root = document.getElementById('root')!
// 桌面歌词窗口:复用同一份 bundle,但只动态加载歌词 UI,
// 绝不静态 import 完整 app(App/modules/worker 在模块加载阶段会依赖完整 IPC,歌词窗没有 → 会抛错)
const isLyricWindow = location.href.includes('window=lyric')

if (isLyricWindow) {
  void import('./views/DesktopLyric/LyricWindow.svelte').then(({ default: LyricWindow }) => {
    root.style.display = ''
    mount(LyricWindow, { target: root })
  })
} else {
  void Promise.all([
    import('./App.svelte'),
    import('./components/apis/notify'),
    import('./components/apis/tooltips/global'),
    import('./modules'),
    import('./worker'),
    import('./shared/ipc/app/event'),
  ]).then(([{ default: App }, { initNotify }, { initTooltips }, { connectIPC, registerModules }, { initWorkers }, { createDesktopLyricProcessEvent }]) => {
    // desktop 主进程通过 webContents.postMessage 把歌词窗 MessagePort 直传过来
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__onDesktopLyricPort = (ports: MessagePort[]) => {
      createDesktopLyricProcessEvent.emit(ports)
    }

    void initWorkers()

    mount(App, {
      target: root,
    })
    initNotify()

    registerModules()
    connectIPC()
    initTooltips()
  })
}
