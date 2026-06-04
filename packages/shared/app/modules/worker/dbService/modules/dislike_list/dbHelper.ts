// import type Database from 'better-sqlite3'
import { getDB } from '../../db'
import {
  // createDeleteStatement,
  // createUpdateStatement,
  createClearStatement,
  createInsertStatement,
  createQueryStatement,
  type DislikeInfo,
} from './statements'

/**
 * 查询不喜欢歌曲列表
 */
export const queryDislikeList = () => {
  const queryStatement = createQueryStatement()
  return queryStatement.all()
}

/**
 * 批量插入不喜欢歌曲并刷新顺序
 * @param infos 列表
 */
export const inertDislikeList = async (infos: DislikeInfo[]) => {
  const db = getDB()
  const insertStatement = createInsertStatement()
  db.transaction((infos: DislikeInfo[]) => {
    for (const info of infos) insertStatement.run(info)
  })(infos)
}

/**
 * 覆盖并批量插入不喜欢歌曲并刷新顺序
 * @param infos 列表
 */
export const overwirteDislikeList = async (infos: DislikeInfo[]) => {
  const db = getDB()
  const clearStatement = createClearStatement()
  const insertStatement = createInsertStatement()
  db.transaction((infos: DislikeInfo[]) => {
    clearStatement.run()
    for (const info of infos) insertStatement.run(info)
  })(infos)
}

// /**
//  * 批量删除不喜欢歌曲
//  * @param ids 列表
//  */
// export const deleteDislikeList = (ids: string[]) => {
//   const db = getDB()
//   const deleteStatement = createDeleteStatement()
//   db.transaction((ids: string[]) => {
//     for (const id of ids) deleteStatement.run(BigInt(id))
//   })(ids)
// }

// /**
//  * 批量更新不喜欢歌曲
//  * @param urlInfo 列表
//  */
// export const updateDislikeList = async(infos: DislikeInfo[]) => {
//   const db = getDB()
//   const updateStatement = createUpdateStatement()
//   db.transaction((infos: DislikeInfo[]) => {
//     for (const info of infos) updateStatement.run(info)
//   })(infos)
// }

// /**
//  * 清空不喜欢歌曲列表
//  */
// export const clearDislikeList = () => {
//   const clearStatement = createClearStatement()
//   clearStatement.run()
// }
