import path from 'node:path'

import { app } from 'electron'

import {
  cancelDownload,
  clearDownloadList,
  getDownloadList,
  pauseDownload,
  removeDownloadList,
  resumeDownload,
  startDownloadMusic,
} from '@any-listen/app/modules/downloadList'
import { checkCollected, collectResource, getCollectedLists, uncollectResource } from '@any-listen/app/modules/collectedList'
import { appState } from '@/app'
import {
  addFolderMusics,
  cancelAddFolderMusics,
  checkListExistMusic,
  getAllUserLists,
  getListMusics,
  getListScrollInfo,
  getMusicExistListIds,
  importPlaylistFile,
  parseMusicMetadata,
  saveListScrollPosition,
  sendMusicListAction,
  sortListMusics,
  syncUserList,
  exportPlaylistFile,
} from '@any-listen/app/modules/musicList'

import { getListsCover } from '@/modules/musicList'

import type { ExposeFunctions } from '.'

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
    async startDownload(event, musicInfo, quality) {
      // 默认下载到 系统下载目录/music,startDownloadMusic 再按歌手分子目录
      const savePath = appState.appSetting['download.savePath'] || path.join(app.getPath('downloads'), 'music')
      return startDownloadMusic(
        musicInfo,
        quality,
        savePath,
        appState.appSetting['download.fileName'],
        appState.appSetting['list.addMusicLocationType']
      )
    },
    async pauseDownload(event, id) {
      return pauseDownload(id)
    },
    async resumeDownload(event, id) {
      return resumeDownload(id)
    },
    async cancelDownload(event, id) {
      return cancelDownload(id)
    },
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
  } satisfies Partial<ExposeFunctions>
}
