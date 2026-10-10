import { contextBridge, ipcRenderer } from 'electron'

// Keep the native port in preload until the page has installed its DOM listener.
let pendingPort: unknown = null
let portReady = false
const pageWindow = globalThis as unknown as { postMessage: (data: object, targetOrigin: string, transfer: unknown[]) => void }
const deliverPort = () => {
  if (!portReady || !pendingPort) return
  const port = pendingPort
  pendingPort = null
  pageWindow.postMessage({ source: 'anylisten-lyric-preload', type: 'port' }, '*', [port])
}
ipcRenderer.on('desktop-lyric-port', (event) => {
  pendingPort = event.ports[0] ?? null
  deliverPort()
})

let lockState: boolean | undefined
let lockListener: ((locked: boolean) => void) | null = null
ipcRenderer.on('desktop-lyric-lock-state', (_event, locked: boolean) => {
  if (typeof locked !== 'boolean') return
  lockState = locked
  lockListener?.(locked)
})

contextBridge.exposeInMainWorld('__lyricWin', {
  ready: (onLock: (locked: boolean) => void) => {
    lockListener = onLock
    portReady = true
    if (lockState !== undefined) onLock(lockState)
    deliverPort()
  },
  setIgnoreMouse: (ignore: boolean) => {
    if (typeof ignore === 'boolean') ipcRenderer.send('desktop-lyric-ignore-mouse', ignore)
  },
  setLock: (lock: boolean) => {
    if (typeof lock === 'boolean') ipcRenderer.send('desktop-lyric-set-lock', lock)
  },
})
