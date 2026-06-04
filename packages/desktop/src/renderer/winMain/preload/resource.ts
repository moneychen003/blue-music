import type { MainCall } from '.'

// 暴露给前端的方法
export const createClientResource = (main: MainCall) => {
  return {
    async tipSearch(info) {
      return main.tipSearch(info)
    },
    async hotSearch(info) {
      return main.hotSearch(info)
    },
    async musicSearch(info) {
      return main.musicSearch(info)
    },
    async musicPicSearch(info) {
      return main.musicPicSearch(info)
    },
    async lyricSearch(info) {
      return main.lyricSearch(info)
    },
    async lyricDetail(info) {
      return main.lyricDetail(info)
    },
    async songlistSearch(info) {
      return main.songlistSearch(info)
    },
    async songlistSorts(info) {
      return main.songlistSorts(info)
    },
    async songlistTags(info) {
      return main.songlistTags(info)
    },
    async songlist(info) {
      return main.songlist(info)
    },
    async songlistDetail(info) {
      return main.songlistDetail(info)
    },
    async topSongs(info) {
      return main.topSongs(info)
    },
    async topSongsDate(info) {
      return main.topSongsDate(info)
    },
    async topSongsDetail(info) {
      return main.topSongsDetail(info)
    },
    async findMusic(info) {
      return main.findMusic(info)
    },
    async musicComment(info) {
      return main.musicComment(info)
    },
  } satisfies Partial<AnyListen.IPC.ServerIPC>
}
