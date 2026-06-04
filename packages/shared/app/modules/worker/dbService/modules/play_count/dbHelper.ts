import { getDB } from '../../db'
import {
  type PlayCount,
  type PlayCountAll,
  type PlayCountKey,
  type PlayTime,
  createClearStatement,
  createCountStatement,
  createCountUpdateStatement,
  createDeleteStatement,
  createInsertStatement,
  createQueryStatement,
  createTimeUpdateStatement,
} from './statements'

/**
 * 查询播放统计
 * @returns url
 */
export const queryPlayCount = (key: PlayCountKey) => {
  const queryStatement = createQueryStatement()
  return queryStatement.get(key)
}

/**
 * 批量插入播放统计
 */
export const insertPlayCount = (list: PlayCountAll[]) => {
  const db = getDB()
  const insertStatement = createInsertStatement()
  db.transaction((list: PlayCountAll[]) => {
    for (const info of list) insertStatement.run(info)
  })(list)
}

/**
 * 批量删除播放统计
 * @param ids 列表
 */
export const deletePlayCount = (ids: PlayCountKey[]) => {
  const db = getDB()
  const deleteStatement = createDeleteStatement()
  db.transaction((ids: PlayCountKey[]) => {
    for (const id of ids) deleteStatement.run(id)
  })(ids)
}

/**
 * 批量更新播放次数
 */
export const updatePlayCount = (info: PlayCount) => {
  const updateStatement = createCountUpdateStatement()
  updateStatement.run(info)
}

/**
 * 批量更新播放时间
 */
export const updatePlayTime = (info: PlayTime) => {
  const updateStatement = createTimeUpdateStatement()
  updateStatement.run(info)
}

/**
 * 清空播放统计
 */
export const clearPlayCount = () => {
  const clearStatement = createClearStatement()
  clearStatement.run()
}

/**
 * 统计歌曲信息数量
 */
export const countPlayCount = () => {
  const countStatement = createCountStatement()
  return countStatement.get()!.count
}
