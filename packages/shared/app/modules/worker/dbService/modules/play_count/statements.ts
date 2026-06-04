import { dbPrepare } from '../../db'

export interface PlayCountKey {
  name: string
  singer: string
}
export interface PlayCountAll extends PlayCountKey {
  count: number
  time: number
}
export interface PlayCount extends PlayCountKey {
  count: number
}
export interface PlayTime extends PlayCountKey {
  time: number
}

/**
 * 创建播放统计查询语句
 * @returns 查询语句
 */
export const createQueryStatement = () => {
  return dbPrepare<PlayCountKey, { count: number; time: number }>(`
    SELECT "count", "time"
    FROM "main"."play_count"
    WHERE "name"=@name AND "singer"=@singer
    `)
}

/**
 * 创建播放统计插入语句
 * @returns 插入语句
 */
export const createInsertStatement = () => {
  return dbPrepare<PlayCountAll>(`
    INSERT INTO "main"."play_count" ("name", "singer", "count", "time")
    VALUES (@name, @singer, @count, @time)`)
}

/**
 * 创建播放统计清空语句
 * @returns 清空语句
 */
export const createClearStatement = () => {
  return dbPrepare(`
    DELETE FROM "main"."play_count"
  `)
}

/**
 * 创建播放统计删除语句
 * @returns 删除语句
 */
export const createDeleteStatement = () => {
  return dbPrepare<PlayCountKey>(`
    DELETE FROM "main"."play_count"
    WHERE "name"=@name AND "singer"=@singer
  `)
}

/**
 * 创建播放次数更新语句
 * @returns 更新语句
 */
export const createCountUpdateStatement = () => {
  return dbPrepare<PlayCount>(`
    UPDATE "main"."play_count"
    SET "count"=@count
    WHERE "name"=@name AND "singer"=@singer`)
}

/**
 * 创建播放时间更新语句
 * @returns 更新语句
 */
export const createTimeUpdateStatement = () => {
  return dbPrepare<PlayTime>(`
    UPDATE "main"."play_count"
    SET "time"=@time
    WHERE "name"=@name AND "singer"=@singer`)
}

/**
 * 创建数量统计语句
 * @returns 统计语句
 */
export const createCountStatement = () => {
  return dbPrepare<[], { count: number }>('SELECT COUNT(*) as count FROM "main"."play_count"')
}
