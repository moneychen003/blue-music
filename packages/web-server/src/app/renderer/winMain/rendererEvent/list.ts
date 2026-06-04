/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {
  clearDownloadList,
  getDownloadList,
  removeDownloadList,
} from '@any-listen/app/modules/downloadList'
import { checkCollected, collectResource, getCollectedLists, uncollectResource } from '@any-listen/app/modules/collectedList'
import {
  addFolderMusics,
  cancelAddFolderMusics,
  checkListExistMusic,
  getAllUserLists,
  getListMusics,
  getListScrollInfo,
  getMusicExistListIds,
  importPlaylistFile,
  onMusicListAction,
  parseMusicMetadata,
  saveListScrollPosition,
  sendMusicListAction,
  sortListMusics,
  syncUserList,
  exportPlaylistFile,
} from '@any-listen/app/modules/musicList'

import { getListsCover } from '@/app/modules/musicList'
import { broadcast } from '@/modules/ipc/websocket'

import type { ExposeClientFunctions, ExposeServerFunctions } from '.'

// 暴露给前端的方法
export const createExposeList = () => {
  return {
    async getAllUserLists(event) {
      return getAllUserLists()
    },
    async getListMusics(event, listId) {
      return getListMusics(listId)
    },
    async getListCover(event, listId) {
      return (await getListsCover([listId]))[listId]
    },
    async getMusicExistListIds(event, musicId) {
      return getMusicExistListIds(musicId)
    },
    async checkListExistMusic(event, listId, musicId) {
      return checkListExistMusic(listId, musicId)
    },
    async listAction(event, action) {
      return sendMusicListAction(action)
    },
    async getListScrollPosition(event) {
      return getListScrollInfo()
    },
    async saveListScrollPosition(event, id, position) {
      return saveListScrollPosition(id, position)
    },
    async addFolderMusics(event, listId, filePaths, onEnd) {
      return addFolderMusics(listId, filePaths, onEnd)
    },
    async cancelAddFolderMusics(event, taskId) {
      return cancelAddFolderMusics(taskId)
    },
    async getDownloadList(event) {
      return getDownloadList()
    },
    async removeDownloadList(event, ids) {
      return removeDownloadList(ids)
    },
    async clearDownloadList(event) {
      return clearDownloadList()
    },
    // 网页版无本地文件写入能力,下载仅 desktop 客户端支持
    async startDownload() {
      throw new Error('Download is only supported in the desktop client')
    },
    async pauseDownload() {},
    async resumeDownload() {},
    async cancelDownload() {},
    async getCollectedLists(event) {
      return getCollectedLists()
    },
    async collectResource(event, info) {
      return collectResource(info)
    },
    async uncollectResource(event, id) {
      return uncollectResource(id)
    },
    async checkCollected(event, id) {
      return checkCollected(id)
    },
    async importPlaylistFile(event, listId, filePath) {
      return importPlaylistFile(listId, filePath)
    },
    async exportPlaylistFile(event, options) {
      return exportPlaylistFile(options)
    },
    async syncUserList(event, id) {
      return syncUserList(id)
    },
    async parseMusicMetadata(event, listId, musicInfo) {
      return parseMusicMetadata(listId, musicInfo)
    },
    async sortListMusics(event, id, list, type) {
      return sortListMusics(id, list, type)
    },
  } satisfies Partial<ExposeClientFunctions>
}

// 暴露给后端的方法
export const createServerList = () => {
  const actions = {
    async listAction(action) {
      broadcast((socket) => {
        if (socket.winType != 'main' || !socket.isInited) return
        void socket.remoteQueueList.listAction(action)
      })
    },
  } satisfies Partial<ExposeServerFunctions>

  // eslint-disable-next-line @typescript-eslint/unbound-method
  onMusicListAction(actions.listAction)

  return actions
}
