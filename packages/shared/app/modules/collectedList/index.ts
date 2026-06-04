import { workers } from '../worker'

/**
 * 获取收藏的专辑/歌单列表
 */
export const getCollectedLists = async () => {
  return workers.dbService.getCollectedLists()
}

/**
 * 收藏一个专辑/歌单(仅存元数据引用)
 */
export const collectResource = async (info: AnyListen.List.CollectedListInfo) => {
  return workers.dbService.collectResource(info)
}

/**
 * 取消收藏
 */
export const uncollectResource = async (id: string) => {
  return workers.dbService.uncollectResource(id)
}

/**
 * 检查是否已收藏
 */
export const checkCollected = async (id: string) => {
  return workers.dbService.checkCollected(id)
}
