import { getDB } from '../../db'
import {
  type MusicInfoOtherSource,
  createCountStatement,
  createMusicInfoClearStatement,
  createMusicInfoDeleteStatement,
  createMusicInfoInsertStatement,
  createMusicInfoQueryStatement,
} from './statements'

/**
 * 查询歌曲信息
 * @param id 歌曲id
 * @returns 歌曲信息
 */
export const queryMusicInfo = (id: string) => {
  const musicInfoQueryStatement = createMusicInfoQueryStatement()
  return musicInfoQueryStatement.all(id)
}

/**
 * 批量插入歌曲信息
 * @param musicInfos 列表
 */
export const inertMusicInfo = (musicInfos: MusicInfoOtherSource[]) => {
  const db = getDB()
  const musicInfoInsertStatement = createMusicInfoInsertStatement()
  db.transaction((musicInfos: MusicInfoOtherSource[]) => {
    for (const info of musicInfos) musicInfoInsertStatement.run(info)
  })(musicInfos)
}

/**
 * 批量删除歌曲信息
 * @param ids 列表
 */
export const deleteMusicInfo = (ids: string[]) => {
  const db = getDB()
  const musicInfoDeleteStatement = createMusicInfoDeleteStatement()
  db.transaction((ids: string[]) => {
    for (const id of ids) musicInfoDeleteStatement.run(id)
  })(ids)
}

/**
 * 清空歌曲信息
 */
export const clearMusicInfo = () => {
  const musicInfoClearStatement = createMusicInfoClearStatement()
  musicInfoClearStatement.run()
}

/**
 * 统计歌曲信息数量
 */
export const countMusicInfo = () => {
  const countStatement = createCountStatement()
  return countStatement.get()!.count
}
