import { ipcRenderer } from 'electron'

// 桌面歌词窗口的轻量 preload:接收主进程直传的 MessagePort + 暴露窗口控制(锁定/鼠标穿透)
ipcRenderer.on('desktop-lyric-port', (event) => {
  const port = event.ports[0]
  // contextIsolation 为 false,preload 与渲染器共享 window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (w.__onLyricPort) w.__onLyricPort(port)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  else w.__pendingLyricPort = port
})

// 主进程告知初始锁定状态
ipcRenderer.on('desktop-lyric-lock-state', (_event, locked: boolean) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (w.__onLyricLockState) w.__onLyricLockState(locked)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  else w.__pendingLyricLock = locked
})

// 暴露给歌词窗渲染器的控制接口
// eslint-disable-next-line @typescript-eslint/no-extra-semi, @typescript-eslint/no-explicit-any
;(window as any).__lyricWin = {
  // 锁定时整窗鼠标穿透;hover 到解锁按钮上时临时设 false 让点击生效
  setIgnoreMouse: (ignore: boolean) => ipcRenderer.send('desktop-lyric-ignore-mouse', ignore),
  // 切换锁定(持久化到设置)
  setLock: (lock: boolean) => ipcRenderer.send('desktop-lyric-set-lock', lock),
}
