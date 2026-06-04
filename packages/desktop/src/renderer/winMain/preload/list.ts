import { createProxyCallback } from 'message2call'

import type { ClientCall, ExposeFunctions, MainCall } from '.'

// 暴露给后端的方法
export const createExposeList = (client: ClientCall) => {
  return {
    async listAction(event, action) {
      return client.listAction(action)
    },
  } satisfies Partial<ExposeFunctions>
}

// 暴露给前端的方法
export const createClientList = (main: MainCall) => {
  return {
    async getAllUserLists() {
      return main.getAllUserLists()
    },
    async getListMusics(id) {
      return main.getListMusics(id)
    },
    async getListCover(listId) {
      return main.getListCover(listId)
    },
    async getMusicExistListIds(listId) {
      return main.getMusicExistListIds(listId)
    },
    async checkListExistMusic(listId, musicId) {
      return main.checkListExistMusic(listId, musicId)
    },
    async listAction(action) {
      return main.listAction(action)
    },
    async getListScrollPosition() {
      return main.getListScrollPosition()
    },
    async saveListScrollPosition(id, position) {
      return main.saveListScrollPosition(id, position)
    },
    async addFolderMusics(listId, filePaths, onEnd) {
      const proxyCallback = createProxyCallback((errorMessage?: string | null) => {
        proxyCallback.releaseProxy()
        onEnd(errorMessage)
      })
      return main.addFolderMusics(listId, filePaths, proxyCallback)
    },
    async cancelAddFolderMusics(taskId) {
      return main.cancelAddFolderMusics(taskId)
    },
    async getDownloadList() {
      return main.getDownloadList()
    },
    async removeDownloadList(ids) {
      return main.removeDownloadList(ids)
    },
    async clearDownloadList() {
      return main.clearDownloadList()
    },
    async startDownload(musicInfo, quality) {
      return main.startDownload(musicInfo, quality)
    },
    async pauseDownload(id) {
      return main.pauseDownload(id)
    },
    async resumeDownload(id) {
      return main.resumeDownload(id)
    },
    async cancelDownload(id) {
      return main.cancelDownload(id)
    },
    async getCollectedLists() {
      return main.getCollectedLists()
    },
    async collectResource(info) {
      return main.collectResource(info)
    },
    async uncollectResource(id) {
      return main.uncollectResource(id)
    },
    async checkCollected(id) {
      return main.checkCollected(id)
    },
    async importPlaylistFile(listId, filePath) {
      return main.importPlaylistFile(listId, filePath)
    },
    async exportPlaylistFile(options) {
      return main.exportPlaylistFile(options)
    },
    async syncUserList(id) {
      return main.syncUserList(id)
    },
    async parseMusicMetadata(listId, musicInfo) {
      return main.parseMusicMetadata(listId, musicInfo)
    },
    async sortListMusics(id, list, type) {
      return main.sortListMusics(id, list, type)
    },
  } satisfies Partial<AnyListen.IPC.ServerIPC>
}
