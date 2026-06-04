import { dbPrepare } from '../../db'

// TODO: 完善歌词读存

export interface Lyricnfo {
  id: string
  name: string
  singer: string
  interval: string | null
  lyric: string
  type: 'raw' | 'edited'
}

const RAW_LYRIC: Lyricnfo['type'] = 'raw'
const EDITED_LYRIC: Lyricnfo['type'] = 'edited'

/**
 * 创建歌词查询语句
 * @returns 查询语句
 */
export const createLyricQueryStatement = () => {
  return dbPrepare<string, Lyricnfo>(`
    SELECT "name", "singer", "interval", "lyric", "type"
    FROM "main"."lyric"
    WHERE "id"=?
    `)
}

/**
 * 创建原始歌词查询语句
 * @returns 查询语句
 */
export const createRawLyricQueryStatement = () => {
  return dbPrepare<string, Lyricnfo>(`
    SELECT "name", "singer", "interval", "lyric"
    FROM "main"."lyric"
    WHERE "id"=? AND "type"='${RAW_LYRIC}'
    `)
}

/**
 * 创建原始歌词插入语句
 * @returns 插入语句
 */
export const createRawLyricInsertStatement = () => {
  return dbPrepare<Lyricnfo>(`
    INSERT INTO "main"."lyric" ("id", "name", "singer", "interval", "lyric", "type")
    VALUES (@id, @name, @singer, @interval, @lyric, '${RAW_LYRIC}')`)
}

/**
 * 创建原始歌词清空语句
 * @returns 清空语句
 */
export const createRawLyricClearStatement = () => {
  return dbPrepare(`
    DELETE FROM "main"."lyric"
    WHERE "type"='${RAW_LYRIC}'
  `)
}

/**
 * 创建原始歌词删除语句
 * @returns 删除语句
 */
export const createRawLyricDeleteStatement = () => {
  return dbPrepare<string>(`
    DELETE FROM "main"."lyric"
    WHERE "id"=? AND "type"='${RAW_LYRIC}'
  `)
}

/**
 * 创建原始歌词更新语句
 * @returns 更新语句
 */
export const createRawLyricUpdateStatement = () => {
  return dbPrepare<Lyricnfo>(`
    UPDATE "main"."lyric"
    SET "text"=@text, "name"=@name, "singer"=@singer, "interval"=@interval
    WHERE "id"=@id AND "type"='${RAW_LYRIC}'`)
}

/**
 * 创建原始歌词数量统计语句
 * @returns 统计语句
 */
export const createRawLyricCountStatement = () => {
  return dbPrepare<[], { count: number }>(`SELECT COUNT(*) as count FROM "main"."lyric" WHERE "type"='${RAW_LYRIC}'`)
}

/**
 * 创建已编辑歌词查询语句
 * @returns 查询语句
 */
export const createEditedLyricQueryStatement = () => {
  return dbPrepare<string, Lyricnfo>(`
    SELECT "name", "singer", "interval", "lyric"
    FROM "main"."lyric"
    WHERE "id"=? AND "type"='${EDITED_LYRIC}'
    `)
}

/**
 * 创建已编辑歌词插入语句
 * @returns 插入语句
 */
export const createEditedLyricInsertStatement = () => {
  return dbPrepare<Lyricnfo>(`
    INSERT INTO "main"."lyric" ("id", "name", "singer", "interval", "lyric", "type")
    VALUES (@id, @name, @singer, @interval, @lyric, '${EDITED_LYRIC}')`)
}

/**
 * 创建已编辑歌词清空语句
 * @returns 清空语句
 */
export const createEditedLyricClearStatement = () => {
  return dbPrepare(`
    DELETE FROM "main"."lyric"
    WHERE "type"='${EDITED_LYRIC}'
  `)
}

/**
 * 创建已编辑歌词删除语句
 * @returns 删除语句
 */
export const createEditedLyricDeleteStatement = () => {
  return dbPrepare<string>(`
    DELETE FROM "main"."lyric"
    WHERE "id"=? AND "type"='${EDITED_LYRIC}'
  `)
}

/**
 * 创建已编辑歌词更新语句
 * @returns 更新语句
 */
export const createEditedLyricUpdateStatement = () => {
  return dbPrepare<Lyricnfo>(`
    UPDATE "main"."lyric"
    SET "text"=@text, "name"=@name, "singer"=@singer, "interval"=@interval
    WHERE "id"=@id AND "type"='${EDITED_LYRIC}'`)
}

/**
 * 创建已编辑歌词数量统计语句
 * @returns 统计语句
 */
export const createEditedLyricCountStatement = () => {
  return dbPrepare<[], { count: number }>(`SELECT COUNT(*) as count FROM "main"."lyric" WHERE "type"='${EDITED_LYRIC}'`)
}
