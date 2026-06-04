import { queryCollectedList, insertCollectedList, deleteCollectedList, checkCollectedList } from './dbHelper'
import type { CollectedListRecord } from './statements'

let list: AnyListen.List.CollectedListInfo[]

const initCollectedList = () => {
  list = queryCollectedList()
}

const toRecord = (info: AnyListen.List.CollectedListInfo, position: number): CollectedListRecord => {
  return {
    id: info.id,
    type: info.type,
    name: info.name,
    pic: info.pic ?? null,
    author: info.author ?? null,
    desc: info.desc ?? null,
    play_count: info.playCount ?? null,
    total: info.total ?? null,
    extension_id: info.extensionId,
    source: info.source,
    sync_id: info.syncId,
    create_time: info.createTime,
    position,
  }
}

/**
 * 获取收藏的专辑/歌单列表
 */
export const getCollectedLists = (): AnyListen.List.CollectedListInfo[] => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!list) initCollectedList()
  return list
}

/**
 * 收藏一个专辑/歌单(新的排最前)
 */
export const collectResource = (info: AnyListen.List.CollectedListInfo): AnyListen.List.CollectedListInfo[] => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!list) initCollectedList()
  if (checkCollectedList(info.id)) return list
  const newInfo = { ...info, createTime: info.createTime || Date.now() }
  const newList = [newInfo, ...list]
  insertCollectedList(
    toRecord(newInfo, 0),
    newList.slice(1).map((i, index) => ({ id: i.id, position: index + 1 }))
  )
  list = newList
  return list
}

/**
 * 取消收藏
 */
export const uncollectResource = (id: string): AnyListen.List.CollectedListInfo[] => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!list) initCollectedList()
  deleteCollectedList(id)
  list = list.filter((i) => i.id !== id)
  return list
}

/**
 * 检查是否已收藏
 */
export const checkCollected = (id: string): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!list) initCollectedList()
  return list.some((i) => i.id === id)
}
