import { services } from './shared'
import { findMusic } from './tools'
import { allowedUrl, buildExtSourceId, getExtSource } from './utils'

export const getMusicUrlByExtensionSource = async ({
  extensionId,
  source,
  musicInfo,
  quality,
  type,
}: {
  extensionId: string
  source: string
  musicInfo: AnyListen.Music.MusicInfoOnline
  quality?: string
  type?: AnyListen.Music.FileType
}): Promise<AnyListen.IPCExtension.MusicUrlInfo> => {
  return services.extensionSerive
    .resourceAction('musicUrl', {
      extensionId,
      source,
      musicInfo,
      quality,
      type,
    })
    .then((result) => {
      // console.log(result)
      if (!result.url) throw new Error('Get music url failed')
      // 在线音源的播放地址必须是真实的 http(s) 地址。
      // 某些音源(如 gdstudio)在没有结果时会返回 "./gdstudio-no-url" 之类的相对路径占位符,
      // 而 desktop 的 allowedUrl 允许相对/file 路径(为本地文件留的),会把占位符当成合法地址缓存并"播放"→报错。
      // 这里统一要求 http(s),挡掉占位符,促使上层自动换到真正可用的音源。
      if (!/^https?:\/\//i.test(result.url)) throw new Error('Get music url failed, invalid url')
      if (!allowedUrl(result.url)) throw new Error('Get music url failed, url not allowed')
      return result
    })
}

const handleGetMusicUrl = async (
  {
    musicInfo,
    quality,
    type,
  }: {
    musicInfo: AnyListen.Music.MusicInfoOnline
    quality?: string
    type?: AnyListen.Music.FileType
  },
  excludeList: string[] = []
): Promise<AnyListen.IPCExtension.MusicUrlInfo> => {
  const source = getExtSource('musicUrl', excludeList, musicInfo.meta.source)
  if (!source) throw new Error('Get url failed, no source')
  return getMusicUrlByExtensionSource({
    extensionId: source.extensionId,
    source: source.id,
    musicInfo,
    quality,
    type,
  }).catch(async (e) => {
    console.error(e)
    excludeList.push(buildExtSourceId(source.extensionId, source.id))
    return handleGetMusicUrl({ musicInfo, quality, type }, excludeList)
  })
}

export const getMusicUrl = async (data: {
  musicInfo: AnyListen.Music.MusicInfo
  quality?: string
  type?: AnyListen.Music.FileType
}): Promise<AnyListen.IPCExtension.MusicUrlInfo & { musicInfo: AnyListen.Music.MusicInfoOnline }> => {
  // 记录实际取址成功时使用的歌曲信息(可能因自动换源而 ≠ 原曲),供上层提示/记忆备用源。
  let usedMusicInfo: AnyListen.Music.MusicInfoOnline | null = null
  const info = await findMusic(data.musicInfo, async (musicInfo) => {
    const result = await handleGetMusicUrl({
      musicInfo,
      quality: data.quality,
      type: data.type,
    })
    usedMusicInfo = musicInfo
    return result
  })
  return { ...info, musicInfo: usedMusicInfo ?? (data.musicInfo as AnyListen.Music.MusicInfoOnline) }
}
