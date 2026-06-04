import { createProxyCallback } from 'message2call'

import type { IPCSocket } from '@/preload/ws'

import type { ClientCall, ExposeFunctions } from '.'

// 暴露给后端的方法
export const createExposeList = (client: ClientCall) => {
  return {
    async listAction(socket, action) {
      return client.listAction(action)
    },
  } satisfies Partial<ExposeFunctions>
}

// 暴露给前端的方法
export const createClientList = (ipcSocket: IPCSocket) => {
  return {
    async getAllUserLists() {
      return ipcSocket.remoteQueueList.getAllUserLists()
    },
    async getListMusics(id) {
      return ipcSocket.remoteQueueList.getListMusics(id)
    },
    async getListCover(listId) {
      return ipcSocket.remoteQueueList.getListCover(listId)
    },
    async getMusicExistListIds(musicId) {
      return ipcSocket.remoteQueueList.getMusicExistListIds(musicId)
    },
    async checkListExistMusic(listId, musicId) {
      return ipcSocket.remoteQueueList.checkListExistMusic(listId, musicId)
    },
    async listAction(action) {
      return ipcSocket.remoteQueueList.listAction(action)
    },
    async getListScrollPosition() {
      return ipcSocket.remoteQueueList.getListScrollPosition()
    },
    async saveListScrollPosition(id, position) {
      return ipcSocket.remoteQueueList.saveListScrollPosition(id, position)
    },
    async addFolderMusics(listId, filePaths, onEnd) {
      const proxyCallback = createProxyCallback((errorMessage?: string | null) => {
        proxyCallback.releaseProxy()
        onEnd(errorMessage)
      })
      return ipcSocket.remoteQueueList.addFolderMusics(listId, filePaths, proxyCallback)
    },
    async cancelAddFolderMusics(taskId) {
      return ipcSocket.remoteQueueList.cancelAddFolderMusics(taskId)
    },
    async getDownloadList() {
      return ipcSocket.remoteQueueList.getDownloadList()
    },
    async removeDownloadList(ids) {
      return ipcSocket.remoteQueueList.removeDownloadList(ids)
    },
    async clearDownloadList() {
      return ipcSocket.remoteQueueList.clearDownloadList()
    },
    async getCollectedLists() {
      return ipcSocket.remoteQueueList.getCollectedLists()
    },
    async collectResource(info) {
      return ipcSocket.remoteQueueList.collectResource(info)
    },
    async uncollectResource(id) {
      return ipcSocket.remoteQueueList.uncollectResource(id)
    },
    async checkCollected(id) {
      return ipcSocket.remoteQueueList.checkCollected(id)
    },
    async importPlaylistFile(listId, filePath) {
      return ipcSocket.remoteQueueList.importPlaylistFile(listId, filePath)
    },
    async exportPlaylistFile(options) {
      return ipcSocket.remoteQueueList.exportPlaylistFile(options)
    },
    async syncUserList(id) {
      return ipcSocket.remoteQueueList.syncUserList(id)
    },
    async parseMusicMetadata(listId, musicInfo) {
      return ipcSocket.remoteQueueList.parseMusicMetadata(listId, musicInfo)
    },
    async sortListMusics(id, list, type) {
      return ipcSocket.remoteQueueList.sortListMusics(id, list, type)
    },
  } satisfies Partial<AnyListen.IPC.ServerIPC>
}
