import { updateMusicPic } from '@any-listen/app/modules/musicList'
import {
  getMusicLyricByExtensionSource,
  getMusicLyric as getMusicLyricResource,
  getMusicPicByExtensionSource,
  getMusicPic as getMusicPicResource,
  getMusicUrlByExtensionSource,
  getMusicUrl as getMusicUrlResource,
} from '@any-listen/app/modules/resources'
import { buildMusicCacheId, getFileType } from '@any-listen/common/tools'

import { appState } from '@/app'
import { workers } from '@/worker'

import { buildLyricInfo, getCachedLyricInfo, saveLyricInfo } from './shared'

export const getMusicUrlByExtSource = async ({
  musicInfo,
  quality,
  isRefresh = false,
  extensionId,
  source,
}: {
  musicInfo: AnyListen.Music.MusicInfoOnline
  extensionId: string
  source: string
  isRefresh?: boolean
  quality?: string
}): Promise<AnyListen.IPCMusic.MusicUrlInfo> => {
  const targetQuality = quality ?? appState.appSetting['player.playQuality']
  const cachedUrl = await workers.dbService.getMusicUrl(buildMusicCacheId(musicInfo, targetQuality))
  if (cachedUrl && !isRefresh) return { isFromCache: true, quality: targetQuality, url: cachedUrl }
  const info = await getMusicUrlByExtensionSource({
    musicInfo,
    quality: targetQuality,
    type: getFileType(targetQuality),
    extensionId,
    source,
  })
  return {
    quality: info.quality,
    url: info.url,
    isFromCache: false,
  }
}

export const getMusicUrl = async ({
  musicInfo,
  quality,
  isRefresh = false,
}: {
  musicInfo: AnyListen.Music.MusicInfo
  isRefresh?: boolean
  quality?: string
}): Promise<AnyListen.IPCMusic.MusicUrlInfo> => {
  const targetQuality = quality ?? appState.appSetting['player.playQuality']
  const id = buildMusicCacheId(musicInfo, targetQuality)
  const cachedUrl = await workers.dbService.getMusicUrl(id)
  if (cachedUrl && !isRefresh) return { isFromCache: true, quality: targetQuality, url: cachedUrl }

  // 读优先:若此前已记住可用的"备用源",优先用它解析,避免再撞已失效的原源
  let resolveInfo: AnyListen.Music.MusicInfo = musicInfo
  let rememberedSource: string | undefined
  if (!musicInfo.isLocal) {
    try {
      const others = await workers.dbService.getMusicInfoOtherSource(musicInfo.id)
      if (others?.length) {
        resolveInfo = others[0]
        rememberedSource = others[0].meta?.source
      }
    } catch (err) {
      console.error(err)
    }
  }

  const info = await getMusicUrlResource({
    musicInfo: resolveInfo,
    quality: targetQuality,
    type: getFileType(targetQuality),
  })
  void workers.dbService.musicUrlSave([{ id, url: info.url }])

  // 写记忆 + 上报:实际取址成功的源 ≠ 原曲源 即"发生换源"。
  // - 仅当该源不同于已记住的源时才更新记忆(UNIQUE(source_id,id) ON CONFLICT REPLACE 去重)并回报前端提示,
  //   避免每次走记忆源播放都重复弹"已切换"提示。
  let otherSource: AnyListen.Music.MusicInfoOnline | undefined
  const used = info.musicInfo
  const usedSource = used?.meta?.source
  if (!musicInfo.isLocal && used && usedSource && usedSource !== musicInfo.meta.source) {
    if (usedSource !== rememberedSource) {
      try {
        await workers.dbService.musicInfoOtherSourceRemove([musicInfo.id])
        await workers.dbService.musicInfoOtherSourceAdd(musicInfo.id, [used])
      } catch (err) {
        console.error(err)
      }
      otherSource = used // 仅"新发现/记忆变更"时提示用户
    }
  }

  return {
    quality: info.quality,
    url: info.url,
    isFromCache: false,
    otherSource,
  }
}

export const getMusicPicByExtSource = async ({
  musicInfo,
  isRefresh = false,
  extensionId,
  source,
}: {
  musicInfo: AnyListen.Music.MusicInfoOnline
  extensionId: string
  source: string
  isRefresh?: boolean
  quality?: string
}): Promise<AnyListen.IPCMusic.MusicPicInfo> => {
  if (musicInfo.meta.picUrl && !isRefresh) {
    return {
      isFromCache: true,
      url: musicInfo.meta.picUrl,
    }
  }
  const url = await getMusicPicByExtensionSource({
    musicInfo,
    extensionId,
    source,
  })
  return {
    url,
    isFromCache: false,
  }
}
export const getMusicPicUrl = async ({
  musicInfo,
  isRefresh = false,
  listId,
}: {
  musicInfo: AnyListen.Music.MusicInfo
  listId?: string | null
  isRefresh?: boolean
}): Promise<AnyListen.IPCMusic.MusicPicInfo> => {
  if (musicInfo.meta.picUrl && !isRefresh) {
    return {
      isFromCache: true,
      url: musicInfo.meta.picUrl,
    }
  }
  const url = await getMusicPicResource({ musicInfo })
  if (listId) {
    musicInfo.meta.picUrl = url
    void updateMusicPic(listId, musicInfo)
  }
  return {
    url,
    isFromCache: false,
  }
}

export const getLyricInfoByExtSource = async ({
  musicInfo,
  isRefresh = false,
  extensionId,
  source,
}: {
  musicInfo: AnyListen.Music.MusicInfoOnline
  extensionId: string
  source: string
  isRefresh?: boolean
  quality?: string
}): Promise<AnyListen.IPCMusic.MusicLyricInfo> => {
  if (!isRefresh) {
    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo) return { info: await buildLyricInfo(lyricInfo), isFromCache: false }
  }
  const info = await getMusicLyricByExtensionSource({
    musicInfo,
    extensionId,
    source,
  })
  void saveLyricInfo(musicInfo, info)
  return {
    info,
    isFromCache: false,
  }
}
export const getLyricInfo = async ({
  musicInfo,
  isRefresh = false,
}: {
  musicInfo: AnyListen.Music.MusicInfo
  listId?: string | null
  isRefresh?: boolean
}): Promise<AnyListen.IPCMusic.MusicLyricInfo> => {
  if (!isRefresh) {
    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo) return { info: await buildLyricInfo(lyricInfo), isFromCache: false }
  }
  const info = await getMusicLyricResource({ musicInfo })
  void saveLyricInfo(musicInfo, info)
  return {
    info,
    isFromCache: false,
  }
}
