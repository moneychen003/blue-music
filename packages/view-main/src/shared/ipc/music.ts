import { ipc } from './ipc'

export const getMusicUrl: AnyListen.IPC.ServerIPC['getMusicUrl'] = async (id) => {
  return ipc.getMusicUrl(id)
}
export const getMusicUrlCount: AnyListen.IPC.ServerIPC['getMusicUrlCount'] = async () => {
  return ipc.getMusicUrlCount()
}
export const clearMusicUrl: AnyListen.IPC.ServerIPC['clearMusicUrl'] = async () => {
  return ipc.clearMusicUrl()
}

export const getMusicPic: AnyListen.IPC.ServerIPC['getMusicPic'] = async (id) => {
  return ipc.getMusicPic(id)
}

export const getMusicLyric: AnyListen.IPC.ServerIPC['getMusicLyric'] = async (id) => {
  return ipc.getMusicLyric(id)
}
export const setMusicLyric: AnyListen.IPC.ServerIPC['setMusicLyric'] = async (id, info) => {
  await ipc.setMusicLyric(id, info)
}
export const removeMusicLyric: AnyListen.IPC.ServerIPC['removeMusicLyric'] = async (id) => {
  await ipc.removeMusicLyric(id)
}
export const getMusicLyricCount: AnyListen.IPC.ServerIPC['getMusicLyricCount'] = async () => {
  return ipc.getMusicLyricCount()
}
export const clearMusicLyric: AnyListen.IPC.ServerIPC['clearMusicLyric'] = async () => {
  return ipc.clearMusicLyric()
}

export const createLocalMusicInfos: AnyListen.IPC.ServerIPC['createLocalMusicInfos'] = async (paths) => {
  return ipc.createLocalMusicInfos(paths)
}
