import { contextBridge, ipcRenderer } from 'electron'

const callbacks = new Map<number, () => void>()
let nextTimerId = 0
ipcRenderer.on('anylisten-background-timer-fired', (_event, id: number) => {
  const callback = callbacks.get(id)
  if (!callback) return
  callbacks.delete(id)
  callback()
})
const nodeTimeout = (callback: () => void, delay?: number) => {
  if (callbacks.size >= 2048) throw new Error('Too many background timers')
  const id = ++nextTimerId
  callbacks.set(id, callback)
  ipcRenderer.send('anylisten-background-timer-set', id, delay ?? 0)
  return id
}

const nodeClearTimeout = (id: number) => {
  callbacks.delete(id)
  ipcRenderer.send('anylisten-background-timer-clear', id)
}

const env = Object.freeze<AnyListen.IPC.NodeEnv>({
  setTimeout: nodeTimeout,
  clearTimeout: nodeClearTimeout,
})

contextBridge.exposeInMainWorld('__anylisten_node_env__', env)
