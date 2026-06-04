import { ipc } from './ipc'

export const tipSearch: AnyListen.IPC.ServerIPC['tipSearch'] = async (info) => {
  return ipc.tipSearch(info)
}
export const hotSearch: AnyListen.IPC.ServerIPC['hotSearch'] = async (info) => {
  return ipc.hotSearch(info)
}

export const musicSearch: AnyListen.IPC.ServerIPC['musicSearch'] = async (info) => {
  return ipc.musicSearch(info)
}

export const musicPicSearch: AnyListen.IPC.ServerIPC['musicPicSearch'] = async (info) => {
  return ipc.musicPicSearch(info)
}

export const lyricSearch: AnyListen.IPC.ServerIPC['lyricSearch'] = async (info) => {
  return ipc.lyricSearch(info)
}
export const lyricDetail: AnyListen.IPC.ServerIPC['lyricDetail'] = async (info) => {
  return ipc.lyricDetail(info)
}

export const songlistSearch: AnyListen.IPC.ServerIPC['songlistSearch'] = async (info) => {
  return ipc.songlistSearch(info)
}
export const songlistSorts: AnyListen.IPC.ServerIPC['songlistSorts'] = async (info) => {
  return ipc.songlistSorts(info)
}
export const songlistTags: AnyListen.IPC.ServerIPC['songlistTags'] = async (info) => {
  return ipc.songlistTags(info)
}
export const songlist: AnyListen.IPC.ServerIPC['songlist'] = async (info) => {
  return ipc.songlist(info)
}
export const songlistDetail: AnyListen.IPC.ServerIPC['songlistDetail'] = async (info) => {
  return ipc.songlistDetail(info)
}

export const topSongs: AnyListen.IPC.ServerIPC['topSongs'] = async (info) => {
  return ipc.topSongs(info)
}
export const topSongsDate: AnyListen.IPC.ServerIPC['topSongsDate'] = async (info) => {
  return ipc.topSongsDate(info)
}
export const topSongsDetail: AnyListen.IPC.ServerIPC['topSongsDetail'] = async (info) => {
  return ipc.topSongsDetail(info)
}

export const findMusic: AnyListen.IPC.ServerIPC['findMusic'] = async (info) => {
  return ipc.findMusic(info)
}

export const musicComment: AnyListen.IPC.ServerIPC['musicComment'] = async (info) => {
  return ipc.musicComment(info)
}
