import { getDB } from '../../db'
import type { Lyricnfo } from './statements'
import {
  createEditedLyricClearStatement,
  createEditedLyricCountStatement,
  createEditedLyricDeleteStatement,
  createEditedLyricInsertStatement,
  createEditedLyricQueryStatement,
  createEditedLyricUpdateStatement,
  createLyricQueryStatement,
  createRawLyricClearStatement,
  createRawLyricCountStatement,
  createRawLyricDeleteStatement,
  createRawLyricInsertStatement,
  createRawLyricQueryStatement,
  createRawLyricUpdateStatement,
} from './statements'

/**
 * 查询原始歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const queryLyric = (id: string) => {
  const lyricQueryStatement = createLyricQueryStatement()
  return lyricQueryStatement.all(id)
}

/**
 * 查询原始歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const queryRawLyric = (id: string) => {
  const rawLyricQueryStatement = createRawLyricQueryStatement()
  return rawLyricQueryStatement.get(id)
}

/**
 * 插入原始歌词
 * @param lyric 列表
 */
export const inertRawLyric = (lyric: Lyricnfo) => {
  const db = getDB()
  const rawLyricInsertStatement = createRawLyricInsertStatement()
  const rawLyricDeleteStatement = createRawLyricDeleteStatement()
  db.transaction((lyric: Lyricnfo) => {
    rawLyricDeleteStatement.run(lyric.id)
    rawLyricInsertStatement.run(lyric)
  })(lyric)
}

/**
 * 批量删除原始歌词
 * @param ids 列表
 */
export const deleteRawLyric = (ids: string[]) => {
  const db = getDB()
  const rawLyricDeleteStatement = createRawLyricDeleteStatement()
  db.transaction((ids: string[]) => {
    for (const id of ids) rawLyricDeleteStatement.run(id)
  })(ids)
}

/**
 * 更新原始歌词
 * @param lyric 列表
 */
export const updateRawLyric = (lyric: Lyricnfo) => {
  const db = getDB()
  const rawLyricUpdateStatement = createRawLyricUpdateStatement()
  db.transaction((lyric: Lyricnfo) => {
    rawLyricUpdateStatement.run(lyric)
  })(lyric)
}

/**
 * 清空原始歌词
 */
export const clearRawLyric = () => {
  const rawLyricClearStatement = createRawLyricClearStatement()
  rawLyricClearStatement.run()
}

/**
 * 统计已编辑歌词数量
 */
export const countRawLyric = () => {
  const countStatement = createRawLyricCountStatement()
  return countStatement.get()!.count
}

/**
 * 查询已编辑歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const queryEditedLyric = (id: string) => {
  const rawLyricQueryStatement = createEditedLyricQueryStatement()
  return rawLyricQueryStatement.get(id)
}

/**
 * 批量插入已编辑歌词
 * @param lyric 列表
 */
export const inertEditedLyric = (lyric: Lyricnfo) => {
  const db = getDB()
  const rawLyricInsertStatement = createEditedLyricInsertStatement()
  const rawLyricDeleteStatement = createEditedLyricDeleteStatement()
  db.transaction((lyric: Lyricnfo) => {
    rawLyricDeleteStatement.run(lyric.id)
    rawLyricInsertStatement.run(lyric)
  })(lyric)
}

/**
 * 批量删除已编辑歌词
 * @param ids 列表
 */
export const deleteEditedLyric = (ids: string[]) => {
  const db = getDB()
  const rawLyricDeleteStatement = createEditedLyricDeleteStatement()
  db.transaction((ids: string[]) => {
    for (const id of ids) rawLyricDeleteStatement.run(id)
  })(ids)
}

/**
 * 批量更新已编辑歌词
 * @param lyric 列表
 */
export const updateEditedLyric = (lyric: Lyricnfo) => {
  const db = getDB()
  const rawLyricUpdateStatement = createEditedLyricUpdateStatement()
  db.transaction((lyric: Lyricnfo) => {
    rawLyricUpdateStatement.run(lyric)
  })(lyric)
}

/**
 * 清空已编辑歌词
 */
export const clearEditedLyric = () => {
  const rawLyricClearStatement = createEditedLyricClearStatement()
  rawLyricClearStatement.run()
}

/**
 * 统计已编辑歌词数量
 */
export const countEditedLyric = () => {
  const countStatement = createEditedLyricCountStatement()
  return countStatement.get()!.count
}
