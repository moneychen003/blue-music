import { getDB } from '../../db'
import {
  type ListMusicInfo,
  type MusicInfo,
  type PlayedInfo,
  type PositionInfo,
  createClearStatement,
  createDeleteStatement,
  createInsertStatement,
  createQueryStatement,
  createUpdatePlayedStatement,
  createUpdatePositionStatement,
  createUpdateStatement,
} from './statements'

/**
 * 查询
 */
export const queryList = () => {
  const queryStatement = createQueryStatement()
  return queryStatement.all()
}

/**
 * 覆盖插入
 * @param list 列表
 */
export const overrideList = (list: ListMusicInfo[]) => {
  const db = getDB()
  const insertStatement = createInsertStatement()
  const clearStatement = createClearStatement()
  db.transaction((list: ListMusicInfo[]) => {
    clearStatement.run()
    for (const info of list) insertStatement.run(info)
  })(list)
}

/**
 * 批量插入
 * @param list 列表
 */
export const inertInfo = (list: ListMusicInfo[]) => {
  const db = getDB()
  const insertStatement = createInsertStatement()
  db.transaction((list: ListMusicInfo[]) => {
    for (const info of list) insertStatement.run(info)
  })(list)
}

/**
 * 批量删除
 * @param ids 列表
 */
export const deleteInfo = (ids: string[]) => {
  const db = getDB()
  const deleteStatement = createDeleteStatement()
  db.transaction((ids: string[]) => {
    for (const id of ids) deleteStatement.run(id)
  })(ids)
}

/**
 * 批量更新
 * @param list 列表
 */
export const updateInfo = (list: MusicInfo[]) => {
  const db = getDB()
  const updateStatement = createUpdateStatement()
  db.transaction((list: MusicInfo[]) => {
    for (const info of list) updateStatement.run(info)
  })(list)
}

/**
 * 批量播放状态更新
 * @param list 列表
 */
export const updatePlayedInfo = (list: PlayedInfo[]) => {
  const db = getDB()
  const updateStatement = createUpdatePlayedStatement()
  db.transaction((list: PlayedInfo[]) => {
    for (const info of list) updateStatement.run(info)
  })(list)
}

/**
 * 批量位置更新
 * @param list 列表
 */
export const updatePositionInfo = (list: PositionInfo[]) => {
  const db = getDB()
  const updateStatement = createUpdatePositionStatement()
  db.transaction((list: PositionInfo[]) => {
    for (const info of list) updateStatement.run(info)
  })(list)
}

/**
 * 清空
 */
export const clearList = () => {
  const clearStatement = createClearStatement()
  clearStatement.run()
}
