import { dbPrepare } from '../../db'

interface PlayListInfo {
  listId: null | string
  source: AnyListen.Player.SourceType
}
let playListInfo: PlayListInfo
const initPlayListInfo = () => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (playListInfo !== undefined) return
  const result = dbPrepare<[], { field_value: string }>(`
    SELECT "field_value"
    FROM "main"."metadata"
    WHERE "field_name"='play_list_id'
  `).get()
  const data = result?.field_value
  if (data) {
    try {
      const result = JSON.parse(data) as PlayListInfo
      if (typeof result != 'object') throw new Error('not object')
      if ((result as unknown as { isOnline: boolean }).isOnline) {
        // 兼容旧版本，在线列表不再保存 source 字段
        result.source = (result as unknown as { isOnline: boolean }).isOnline ? 'songlist' : 'local'
        delete (result as unknown as { isOnline?: boolean }).isOnline
      }
      playListInfo = result
      return
    } catch {}
  }
  playListInfo = {
    listId: null,
    source: 'local',
  }
}
/**
 * 获取播放列表id
 */
export const queryMetadataPlayListInfo = () => {
  initPlayListInfo()
  return playListInfo
}
/**
 * 保存播放列表id
 * @param id
 */
export const saveMetadataPlayListInfo = (id: string | null, source: AnyListen.Player.SourceType) => {
  if (playListInfo.listId == id) return
  playListInfo.listId = id
  playListInfo.source = source
  dbPrepare<string>(
    `
    INSERT INTO "main"."metadata" ("field_name", "field_value")
    VALUES ('play_list_id', ?)
  `
  ).run(JSON.stringify(playListInfo))
}
