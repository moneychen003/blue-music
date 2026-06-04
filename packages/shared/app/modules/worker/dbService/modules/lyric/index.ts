import { SPLIT_CHAR } from '@any-listen/common/constants'

import {
  clearEditedLyric,
  clearRawLyric,
  countEditedLyric,
  countRawLyric,
  deleteEditedLyric,
  deleteRawLyric,
  inertEditedLyric,
  inertRawLyric,
  queryEditedLyric,
  queryLyric,
  queryRawLyric,
  updateEditedLyric,
} from './dbHelper'
import type { Lyricnfo } from './statements'

const toDBLyric = (id: string, type: Lyricnfo['type'], lyricInfo: AnyListen.Music.LyricInfo): Lyricnfo => {
  const lyrics: string[] = [JSON.stringify(lyricInfo.lyric)]
  if (lyricInfo.tlyric) lyrics.push(`tlyric${SPLIT_CHAR.LYRIC_TYPE}${JSON.stringify(lyricInfo.tlyric)}`)
  if (lyricInfo.rlyric) lyrics.push(`rlyric${SPLIT_CHAR.LYRIC_TYPE}${JSON.stringify(lyricInfo.rlyric)}`)
  if (lyricInfo.awlyric) lyrics.push(`awlyric${SPLIT_CHAR.LYRIC_TYPE}${JSON.stringify(lyricInfo.awlyric)}`)
  return {
    id,
    type,
    name: lyricInfo.name,
    singer: lyricInfo.singer,
    interval: lyricInfo.interval,
    lyric: lyrics.join('\n'),
  }
}

const toLyricInfo = (id: string, type: Lyricnfo['type'], info: Lyricnfo | undefined): AnyListen.Music.LyricInfo => {
  if (!info) {
    return {
      name: '',
      singer: '',
      interval: '',
      lyric: '',
    }
  }
  let lyricInfo: AnyListen.Music.LyricInfo = {
    name: info.name,
    singer: info.singer,
    interval: info.interval,
    lyric: '',
  }

  const lyrics = info.lyric.split('\n')
  lyricInfo.lyric = JSON.parse(lyrics.shift()!)
  for (const lrc of lyrics) {
    const idx = lrc.indexOf(SPLIT_CHAR.LYRIC_TYPE)
    const type = lrc.substring(0, idx) as 'tlyric' | 'rlyric' | 'awlyric'
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!type) continue
    lyricInfo[type] = JSON.parse(lrc.substring(idx + 1))
  }
  return lyricInfo
}

/**
 * 获取歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const getPlayerLyric = (id: string): AnyListen.Music.LyricInfo => {
  const lyrics = queryLyric(id)

  let lyricInfo: AnyListen.Music.LyricInfo = {
    name: '',
    singer: '',
    interval: '',
    lyric: '',
  }
  let rawLyricInfo: AnyListen.Music.LyricInfo = {
    name: '',
    singer: '',
    interval: '',
    lyric: '',
  }
  for (const lyric of lyrics) {
    switch (lyric.type) {
      case 'edited':
        lyricInfo = toLyricInfo(id, 'edited', lyric)
        break
      default:
        rawLyricInfo = toLyricInfo(id, 'raw', lyric)
        break
    }
  }

  return lyricInfo.lyric
    ? {
        ...lyricInfo,
        rawlrcInfo: {
          lyric: rawLyricInfo.lyric,
          tlyric: rawLyricInfo.tlyric,
          rlyric: rawLyricInfo.rlyric,
          awlyric: rawLyricInfo.awlyric,
        },
      }
    : rawLyricInfo
}

/**
 * 获取原始歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const getRawLyric = (id: string): AnyListen.Music.LyricInfo => {
  const info = queryRawLyric(id)
  return toLyricInfo(id, 'raw', info)
}

/**
 * 保存原始歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const rawLyricSave = (id: string, lyricInfo: AnyListen.Music.LyricInfo) => {
  inertRawLyric(toDBLyric(id, 'raw', lyricInfo))
}

/**
 * 删除原始歌词信息
 * @param ids 歌曲id
 */
export const rawLyricRemove = (ids: string[]) => {
  deleteRawLyric(ids)
}

/**
 * 更新原始歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
// export const rawLyricUpdate = (id: string, lyricInfo: AnyListen.Music.LyricInfo) => {
//   updateRawLyric(toDBLyric(id, 'raw', lyricInfo))
// }

/**
 * 清空原始歌词信息
 */
export const rawLyricClear = () => {
  clearRawLyric()
}

/**
 * 统计原始歌词数量
 */
export const rawLyricCount = () => {
  return countRawLyric()
}

/**
 * 获取已编辑歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const getEditedLyric = (id: string): AnyListen.Music.LyricInfo => {
  const info = queryEditedLyric(id)
  return toLyricInfo(id, 'edited', info)
}

/**
 * 保存已编辑歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const editedLyricSave = (id: string, lyricInfo: AnyListen.Music.LyricInfo) => {
  inertEditedLyric(toDBLyric(id, 'edited', lyricInfo))
}

/**
 * 删除已编辑歌词信息
 * @param ids 歌曲id
 */
export const editedLyricRemove = (ids: string[]) => {
  deleteEditedLyric(ids)
}

/**
 * 更新已编辑歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const editedLyricUpdate = (id: string, lyricInfo: AnyListen.Music.LyricInfo) => {
  updateEditedLyric(toDBLyric(id, 'edited', lyricInfo))
}

/**
 * 清空已编辑歌词信息
 */
export const editedLyricClear = () => {
  clearEditedLyric()
}

/**
 * 新增或更新已编辑歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const editedLyricUpdateAddAndUpdate = (id: string, lyricInfo: AnyListen.Music.LyricInfo) => {
  const info = queryEditedLyric(id)
  if (info) updateEditedLyric(toDBLyric(id, 'edited', lyricInfo))
  else inertEditedLyric(toDBLyric(id, 'edited', lyricInfo))
}

/**
 * 统计已编辑歌词数量
 */
export const editedLyricCount = () => {
  return countEditedLyric()
}
