import { getDB } from '../../db'
import {
  createQueryStatement,
  createInsertStatement,
  createDeleteStatement,
  createCheckStatement,
  createUpdatePositionStatement,
} from './statements'
import type { CollectedListRecord } from './statements'

/**
 * 查询收藏列表
 */
export const queryCollectedList = () => {
  const queryStatement = createQueryStatement()
  return queryStatement.all() as AnyListen.List.CollectedListInfo[]
}

/**
 * 插入一条收藏并刷新顺序
 */
export const insertCollectedList = (info: CollectedListRecord, positions: Array<{ id: string; position: number }>) => {
  const db = getDB()
  const insertStatement = createInsertStatement()
  const updatePositionStatement = createUpdatePositionStatement()
  db.transaction(() => {
    insertStatement.run(info)
    for (const p of positions) updatePositionStatement.run(p)
  })()
}

/**
 * 删除一条收藏
 */
export const deleteCollectedList = (id: string) => {
  const deleteStatement = createDeleteStatement()
  deleteStatement.run(id)
}

/**
 * 检查是否已收藏
 */
export const checkCollectedList = (id: string) => {
  const checkStatement = createCheckStatement()
  return checkStatement.get(id) != null
}
