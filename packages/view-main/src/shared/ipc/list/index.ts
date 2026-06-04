import { ipc } from '../ipc'

export const getAllList: AnyListen.IPC.ServerIPC['getAllUserLists'] = async () => {
  return ipc.getAllUserLists()
}
export const getListMusics: AnyListen.IPC.ServerIPC['getListMusics'] = async (id) => {
  return ipc.getListMusics(id)
}
export const checkListExistMusic: AnyListen.IPC.ServerIPC['checkListExistMusic'] = async (id, musicId) => {
  return ipc.checkListExistMusic(id, musicId)
}
export const getListCover: AnyListen.IPC.ServerIPC['getListCover'] = async (listId) => {
  return ipc.getListCover(listId)
}
export const getMusicExistListIds: AnyListen.IPC.ServerIPC['getMusicExistListIds'] = async (id) => {
  return ipc.getMusicExistListIds(id)
}

export const sendListAction: AnyListen.IPC.ServerIPC['listAction'] = async (action) => {
  return ipc.listAction(action)
}

export const getListPrevSelectId: AnyListen.IPC.ServerIPC['getListPrevSelectId'] = async () => {
  return ipc.getListPrevSelectId()
}
export const saveListPrevSelectId: AnyListen.IPC.ServerIPC['saveListPrevSelectId'] = async (id) => {
  await ipc.saveListPrevSelectId(id)
}
export const getListScrollPosition: AnyListen.IPC.ServerIPC['getListScrollPosition'] = async () => {
  return ipc.getListScrollPosition()
}
export const saveListScrollPosition: AnyListen.IPC.ServerIPC['saveListScrollPosition'] = async (id, position) => {
  return ipc.saveListScrollPosition(id, position)
}

export const addFolderMusics: AnyListen.IPC.ServerIPC['addFolderMusics'] = async (listId, filePaths, onEnd) => {
  return ipc.addFolderMusics(listId, filePaths, onEnd)
}
export const cancelAddFolderMusics: AnyListen.IPC.ServerIPC['cancelAddFolderMusics'] = async (taskId) => {
  return ipc.cancelAddFolderMusics(taskId)
}

export const getDownloadList: AnyListen.IPC.ServerIPC['getDownloadList'] = async () => {
  return ipc.getDownloadList()
}
export const removeDownloadList: AnyListen.IPC.ServerIPC['removeDownloadList'] = async (ids) => {
  return ipc.removeDownloadList(ids)
}
export const clearDownloadList: AnyListen.IPC.ServerIPC['clearDownloadList'] = async () => {
  return ipc.clearDownloadList()
}
export const startDownload: AnyListen.IPC.ServerIPC['startDownload'] = async (musicInfo, quality) => {
  return ipc.startDownload(musicInfo, quality)
}
export const pauseDownload: AnyListen.IPC.ServerIPC['pauseDownload'] = async (id) => {
  return ipc.pauseDownload(id)
}
export const resumeDownload: AnyListen.IPC.ServerIPC['resumeDownload'] = async (id) => {
  return ipc.resumeDownload(id)
}
export const cancelDownload: AnyListen.IPC.ServerIPC['cancelDownload'] = async (id) => {
  return ipc.cancelDownload(id)
}
export const getCollectedLists: AnyListen.IPC.ServerIPC['getCollectedLists'] = async () => {
  return ipc.getCollectedLists()
}
export const collectResource: AnyListen.IPC.ServerIPC['collectResource'] = async (info) => {
  return ipc.collectResource(info)
}
export const uncollectResource: AnyListen.IPC.ServerIPC['uncollectResource'] = async (id) => {
  return ipc.uncollectResource(id)
}
export const checkCollected: AnyListen.IPC.ServerIPC['checkCollected'] = async (id) => {
  return ipc.checkCollected(id)
}
export const importPlaylistFile: AnyListen.IPC.ServerIPC['importPlaylistFile'] = async (listId, filePath) => {
  return ipc.importPlaylistFile(listId, filePath)
}
export const exportPlaylistFile: AnyListen.IPC.ServerIPC['exportPlaylistFile'] = async (options) => {
  return ipc.exportPlaylistFile(options)
}

export const syncUserList: AnyListen.IPC.ServerIPC['syncUserList'] = async (id) => {
  return ipc.syncUserList(id)
}

export const parseMusicMetadata: AnyListen.IPC.ServerIPC['parseMusicMetadata'] = async (listId, musicInfo) => {
  return ipc.parseMusicMetadata(listId, musicInfo)
}

export const sortListMusics: AnyListen.IPC.ServerIPC['sortListMusics'] = async (id, list, type) => {
  return ipc.sortListMusics(id, list, type)
}

// export const importLocalFile: AnyListen.IPC.ServerIPC['importLocalFile'] = async(listId) => {
//   return ipc.importLocalFile(listId)
// }
