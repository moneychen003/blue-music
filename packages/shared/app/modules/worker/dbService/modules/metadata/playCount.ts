import { dbPrepare } from '../../db'

/**
 * 获取播放统计
 * @returns 播放统计
 */
export const queryMetadataPlayCount = () => {
  const result = dbPrepare<
    [],
    { field_name: 'play_count'; field_value: string } | { field_name: 'play_time'; field_value: string }
  >(`
    SELECT "field_name", "field_value"
    FROM "main"."metadata"
    WHERE "field_name"='play_count' OR "field_name"='play_time'
  `).all() as [{ field_name: 'play_count'; field_value: string }, { field_name: 'play_time'; field_value: string }]
  const info = { count: 0, time: 0 }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  for (const { field_name, field_value } of result) {
    if (field_name == 'play_count') info.count = parseInt(field_value)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    else if (field_name == 'play_time') info.time = parseInt(field_value)
  }
  // console.log(info)
  return info
}
/**
 * 更新播放次数
 */
export const updateMetadataPlayCount = (count?: number) => {
  const result = dbPrepare<[], { field_value: string }>(`
      SELECT "field_value"
      FROM "main"."metadata"
      WHERE "field_name"='play_count'
    `).get() ?? { field_value: '0' }
  count ??= parseInt(result.field_value) + 1
  dbPrepare<[string]>(`
    UPDATE "main"."metadata"
    SET "field_value"=?
    WHERE "field_name"='play_count'
  `).run(String(count))
}
/**
 * 更新播放时长
 */
export const updateMetadataPlayTime = (time: number, isAdd = true) => {
  if (isAdd) {
    const result = dbPrepare<[], { field_value: string }>(`
      SELECT "field_value"
      FROM "main"."metadata"
      WHERE "field_name"='play_time'
    `).get() ?? { field_value: '0' }
    time = parseInt(result.field_value) + time
  }
  dbPrepare<string>(`
    UPDATE "main"."metadata"
    SET "field_value"=?
    WHERE "field_name"='play_time'
  `).run(String(time))
}
