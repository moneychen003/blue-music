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
    // Preload uses DOM postMessage only to transfer the native MessagePort;
    // renderer callbacks stay in the main world under contextIsolation.
    window.addEventListener('message', (event) => {
      const data: unknown = event.data
      if (!data || typeof data !== 'object' || !('source' in data) || !('type' in data)) return
      if (event.source !== window || data.source !== 'anylisten-preload' || data.type !== 'desktop-lyric-port') return
      if (event.ports.length !== 1) return
      createDesktopLyricProcessEvent.emit([event.ports[0]])
    })
    window.__anylisten_desktop_lyric_bridge__?.ready()

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
