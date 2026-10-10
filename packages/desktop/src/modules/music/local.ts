import fs from 'node:fs/promises'
import path from 'node:path'

import { getLocalFilePath } from '@any-listen/app/modules/music/utils'
import { writeProxyCache } from '@any-listen/app/modules/proxyServer'
import { verifyResourceBoolean } from '@any-listen/nodejs/request'

import { appState } from '@/app'
import { workers } from '@/worker'
import { registerLocalAudioFile } from '../proxyServer'

import { buildLyricInfo, getCachedLyricInfo } from './shared'

const canonicalFilePath = async (filePath: unknown) => {
  if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) return null
  try {
    return await fs.realpath(filePath)
  } catch {
    return null
  }
}

// A renderer-provided MusicInfo is only a lookup key. The path must match a
// current, main-process library or play-queue record after symlink resolution.
const getAuthorizedLocalPath = async (musicInfo: AnyListen.Music.MusicInfoLocal) => {
  const incoming = musicInfo as unknown as { id?: unknown; meta?: { filePath?: unknown } }
  if (typeof incoming.id !== 'string' || !incoming.id) return null
  const requestedPath = await canonicalFilePath(incoming.meta?.filePath)
  if (!requestedPath) return null
  const matches = async (record: AnyListen.Music.MusicInfo) =>
    record.isLocal && record.id === musicInfo.id && (await canonicalFilePath(record.meta.filePath)) === requestedPath

  const playList = await workers.dbService.getPlayList()
  for (const entry of playList) {
    if (await matches(entry.musicInfo)) return requestedPath
  }

  const listIds = await workers.dbService.getMusicExistListIds(musicInfo.id)
  for (const listId of new Set(listIds)) {
    let records = await workers.dbService.getListMusicsByIds(listId, [musicInfo.id])
    // getListMusicsByIds uses the worker's in-memory cache; load only this
    // indexed list on a cold start, never enumerate every user list or file.
    if (!records.length) {
      await workers.dbService.getListMusics(listId)
      records = await workers.dbService.getListMusicsByIds(listId, [musicInfo.id])
    }
    for (const record of records) {
      if (await matches(record)) return requestedPath
    }
  }
  return null
}

export const getMusicUrl = async ({
  musicInfo,
  quality,
  isRefresh = false,
}: {
  musicInfo: AnyListen.Music.MusicInfoLocal
  isRefresh?: boolean
  quality?: string
}): Promise<AnyListen.IPCMusic.MusicUrlInfo | null> => {
  if (!isRefresh) {
    const path = await getLocalFilePath(musicInfo)
    if (path) {
      const authorizedPath = await getAuthorizedLocalPath(musicInfo)
      if (!authorizedPath) throw new Error('Local audio path is not authorized')
      return {
        url: await registerLocalAudioFile(authorizedPath),
        // toggleSource: false,
        // quality: (musicInfo.meta.bitrateLabel as AnyListen.Music.Quality | null) ?? '128k',
        quality: '128k',
        isFromCache: false,
      }
    }
  }
  return null
}

export const getMusicPicUrl = async ({
  musicInfo,
  isRefresh = false,
  listId,
}: {
  musicInfo: AnyListen.Music.MusicInfoLocal
  listId?: string | null
  isRefresh?: boolean
}): Promise<AnyListen.IPCMusic.MusicPicInfo | null> => {
  if (isRefresh && (!musicInfo.meta.picUrl || !(await verifyResourceBoolean(musicInfo.meta.picUrl)))) {
    isRefresh = false
  }
  if (!isRefresh) {
    let pic = await workers.utilService.getMusicFilePic(musicInfo.meta.filePath)
    if (pic) {
      if (typeof pic == 'string') {
        return {
          url: pic,
          isFromCache: true,
          // toggleSource: false,
        }
      }
      return {
        url: await writeProxyCache(`${musicInfo.meta.filePath}.${pic.format}`, pic.data),
        isFromCache: false,
      }
    }

    if (musicInfo.meta.picUrl) {
      return {
        url: musicInfo.meta.picUrl,
        isFromCache: true,
        // toggleSource: false,
      }
    }
  }
  return null
}

export const getLyricInfo = async ({
  musicInfo,
  isRefresh = false,
}: {
  musicInfo: AnyListen.Music.MusicInfoLocal
  isRefresh?: boolean
}): Promise<AnyListen.IPCMusic.MusicLyricInfo | null> => {
  if (!isRefresh) {
    const [lyricInfo, fileLyricInfo] = await Promise.all([
      getCachedLyricInfo(musicInfo),
      appState.appSetting['player.ignoreLocalLyrics']
        ? Promise.resolve(null)
        : workers.utilService.getMusicFileLyric(musicInfo.meta.filePath),
    ])
    if (lyricInfo?.lyric && lyricInfo.rawlrcInfo) {
      // 存在已编辑歌词
      return {
        info: await buildLyricInfo({ ...lyricInfo, rawlrcInfo: fileLyricInfo ?? lyricInfo.rawlrcInfo }),
        isFromCache: true,
      }
    }

    if (fileLyricInfo) {
      return {
        info: await buildLyricInfo({
          ...fileLyricInfo,
          name: musicInfo.name,
          singer: musicInfo.singer,
          interval: musicInfo.interval,
        }),
        isFromCache: true,
      }
    }
    if (lyricInfo?.lyric) {
      return {
        info: await buildLyricInfo(lyricInfo),
        isFromCache: true,
      }
    }
  }
  return null
}
