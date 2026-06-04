import { existTimeExp } from '@any-listen/app/modules/music/utils'

import { appState } from '@/app'
import { checkAndCreateDir, joinPath, tmpdir } from '@/shared/utils'
import { workers } from '@/worker'

export const getTempDir = async () => {
  const tempDir = joinPath(tmpdir(), 'anylisten_temp')
  await checkAndCreateDir(tempDir)
  return tempDir
}

export const getCachedLyricInfo = async (musicInfo: AnyListen.Music.MusicInfo): Promise<AnyListen.Music.LyricInfo | null> => {
  let lrcInfo = await workers.dbService.getPlayerLyric(musicInfo.id)
  // lrcInfo = {} as unknown as AnyListen.Player.LyricInfo
  if (existTimeExp.test(lrcInfo.lyric)) {
    return lrcInfo
  }
  return null
}

export const saveLyricInfo = async (musicInfo: AnyListen.Music.MusicInfo, info: AnyListen.Music.LyricInfo) => {
  await workers.dbService.rawLyricSave(musicInfo.id, info)
}

export const buildLyricInfo = async (lyricInfo: AnyListen.Music.LyricInfo): Promise<AnyListen.Music.LyricInfo> => {
  if (appState.appSetting['player.isS2t']) {
    return workers.utilService.lyricS2T(lyricInfo)
  }
  return lyricInfo
}
