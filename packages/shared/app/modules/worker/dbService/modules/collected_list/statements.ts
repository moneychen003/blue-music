import { getDB } from '../../db'

export interface CollectedListRecord {
  id: string
  type: AnyListen.List.CollectedType
  name: string
  pic: string | null
  author: string | null
  desc: string | null
  play_count: string | null
  total: number | null
  extension_id: string
  source: string
  sync_id: string
  create_time: number
  position: number
}

/**
 * 创建收藏列表查询语句
 */
export const createQueryStatement = () => {
  const db = getDB()
  return db.prepare<[]>(`
    SELECT
      "id",
      "type",
      "name",
      "pic",
      "author",
      "desc",
      "play_count" AS "playCount",
      "total",
      "extension_id" AS "extensionId",
      "source",
      "sync_id" AS "syncId",
      "create_time" AS "createTime"
    FROM my_collected_list
    ORDER BY "position" ASC
  `)
}

/**
 * 创建收藏插入语句
 */
export const createInsertStatement = () => {
  const db = getDB()
  return db.prepare<[CollectedListRecord]>(`
    INSERT INTO "main"."my_collected_list" ("id", "type", "name", "pic", "author", "desc", "play_count", "total", "extension_id", "source", "sync_id", "create_time", "position")
    VALUES (@id, @type, @name, @pic, @author, @desc, @play_count, @total, @extension_id, @source, @sync_id, @create_time, @position)`)
}

/**
 * 创建收藏删除语句
 */
export const createDeleteStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    DELETE FROM "main"."my_collected_list"
    WHERE "id"=?
  `)
}

/**
 * 创建收藏存在性检查语句
 */
export const createCheckStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    SELECT 1 FROM "main"."my_collected_list" WHERE "id"=? LIMIT 1
  `)
}

/**
 * 创建收藏顺序更新语句
 */
export const createUpdatePositionStatement = () => {
  const db = getDB()
  return db.prepare<[{ id: string; position: number }]>(`
    UPDATE "main"."my_collected_list"
    SET "position"=@position
    WHERE "id"=@id`)
}
