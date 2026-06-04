import type { IPCSocket } from '@/preload/ws'

import type { ClientCall, ExposeFunctions } from '.'

// 暴露给后端的方法
export const createExposeExtension = (client: ClientCall) => {
  return {
    async extensionEvent(event, action) {
      return client.extensionEvent(action)
    },
  } satisfies Partial<ExposeFunctions>
}

// 暴露给前端的方法
export const createClientExtension = (ipcSocket: IPCSocket) => {
  return {
    async getExtensionErrorMessage() {
      return ipcSocket.remoteExtension.getExtensionErrorMessage()
    },
    async getExtensionList() {
      return ipcSocket.remoteExtension.getExtensionList()
    },
    async getOnlineExtensionList(options) {
      return ipcSocket.remoteExtension.getOnlineExtensionList(options)
    },
    async getOnlineExtensionDetail(id) {
      return ipcSocket.remoteExtension.getOnlineExtensionDetail(id)
    },
    async getOnlineCategories() {
      return ipcSocket.remoteExtension.getOnlineCategories()
    },
    async getOnlineTags() {
      return ipcSocket.remoteExtension.getOnlineTags()
    },
    async downloadAndParseExtension(url, manifest) {
      return ipcSocket.remoteExtension.downloadAndParseExtension(url, manifest)
    },
    async installExtension(tempExtension) {
      return ipcSocket.remoteExtension.installExtension(tempExtension)
    },
    async updateExtension(tempExtension) {
      return ipcSocket.remoteExtension.updateExtension(tempExtension)
    },
    async startExtension(extension) {
      return ipcSocket.remoteExtension.startExtension(extension)
    },
    async enableExtension(id) {
      return ipcSocket.remoteExtension.enableExtension(id)
    },
    async disableExtension(id) {
      return ipcSocket.remoteExtension.disableExtension(id)
    },
    async restartExtension(id) {
      return ipcSocket.remoteExtension.restartExtension(id)
    },
    async uninstallExtension(id) {
      return ipcSocket.remoteExtension.uninstallExtension(id)
    },
    async restartExtensionHost() {
      return ipcSocket.remoteExtension.restartExtensionHost()
    },
    async getResourceList() {
      return ipcSocket.remoteExtension.getResourceList()
    },
    async getNewVersionInfo() {
      return ipcSocket.remoteExtension.getNewVersionInfo()
    },
    async getExtensionLastLogs(extId) {
      return ipcSocket.remoteExtension.getExtensionLastLogs(extId)
    },
    async clearExtensionLogs(extId) {
      return ipcSocket.remoteExtension.clearExtensionLogs(extId)
    },
    async getAllExtensionSettings() {
      return ipcSocket.remoteExtension.getAllExtensionSettings()
    },
    async getExtensionConfigValues(extId, fields) {
      return ipcSocket.remoteExtension.getExtensionConfigValues(extId, fields)
    },
    async updateExtensionSettings(extId, config) {
      return ipcSocket.remoteExtension.updateExtensionSettings(extId, config)
    },
    async listProviderAction<T extends keyof AnyListen.IPCExtension.ListProviderAction>(
      action: T,
      params: Parameters<AnyListen.IPCExtension.ListProviderAction[T]>[0]
    ): Promise<Awaited<ReturnType<AnyListen.IPCExtension.ListProviderAction[T]>>> {
      return ipcSocket.remoteExtension.listProviderAction(action, params)
    },
    async executeCommand(commandName: string, args: any[]) {
      return ipcSocket.remoteExtension.executeCommand(commandName, args)
    },
  } satisfies Partial<AnyListen.IPC.ServerIPC>
}
