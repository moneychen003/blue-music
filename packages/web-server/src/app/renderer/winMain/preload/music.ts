import type { IPCSocket } from '@/preload/ws'

// 暴露给前端的方法
export const createClientMusic = (ipcSocket: IPCSocket) => {
  return {
    async getMusicUrl(id) {
      return ipcSocket.remote.getMusicUrl(id)
    },
    async getMusicUrlCount() {
      return ipcSocket.remote.getMusicUrlCount()
    },
    async clearMusicUrl() {
      return ipcSocket.remote.clearMusicUrl()
    },

    async getMusicPic(info) {
      return ipcSocket.remote.getMusicPic(info)
    },

    async getMusicLyric(id) {
      return ipcSocket.remote.getMusicLyric(id)
    },
    async setMusicLyric(id, info) {
      return ipcSocket.remote.setMusicLyric(id, info)
    },
    async removeMusicLyric(id) {
      return ipcSocket.remote.removeMusicLyric(id)
    },
    async getMusicLyricCount() {
      return ipcSocket.remote.getMusicLyricCount()
    },
    async clearMusicLyric() {
      return ipcSocket.remote.clearMusicLyric()
    },

    async createLocalMusicInfos(paths) {
      return ipcSocket.remote.createLocalMusicInfos(paths)
    },
  } satisfies Partial<AnyListen.IPC.ServerIPC>
}
