import type { IPCSocket } from '@/preload/ws'

// 暴露给前端的方法
export const createClientResource = (ipcSocket: IPCSocket) => {
  return {
    async tipSearch(info) {
      return ipcSocket.remote.tipSearch(info)
    },
    async hotSearch(info) {
      return ipcSocket.remote.hotSearch(info)
    },
    async musicSearch(info) {
      return ipcSocket.remote.musicSearch(info)
    },
    async musicPicSearch(info) {
      return ipcSocket.remote.musicPicSearch(info)
    },
    async lyricSearch(info) {
      return ipcSocket.remote.lyricSearch(info)
    },
    async lyricDetail(info) {
      return ipcSocket.remote.lyricDetail(info)
    },
    async songlistSearch(info) {
      return ipcSocket.remote.songlistSearch(info)
    },
    async songlistSorts(info) {
      return ipcSocket.remote.songlistSorts(info)
    },
    async songlistTags(info) {
      return ipcSocket.remote.songlistTags(info)
    },
    async songlist(info) {
      return ipcSocket.remote.songlist(info)
    },
    async songlistDetail(info) {
      return ipcSocket.remote.songlistDetail(info)
    },
    async topSongs(info) {
      return ipcSocket.remote.topSongs(info)
    },
    async topSongsDate(info) {
      return ipcSocket.remote.topSongsDate(info)
    },
    async topSongsDetail(info) {
      return ipcSocket.remote.topSongsDetail(info)
    },
    async findMusic(info) {
      return ipcSocket.remote.findMusic(info)
    },
    async musicComment(info) {
      return ipcSocket.remote.musicComment(info)
    },
  } satisfies Partial<AnyListen.IPC.ServerIPC>
}
