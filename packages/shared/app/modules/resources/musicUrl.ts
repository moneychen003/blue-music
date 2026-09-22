import type { Readable } from 'node:stream'

import { request } from '@any-listen/nodejs/request'

import { services } from './shared'
import { isSourceCoolingDown, runSourceAction } from './sourceHealth'
import { findMusic } from './tools'
import { allowedUrl, buildExtSourceId, getExtSource } from './utils'

const MIN_REASONABLE_AUDIO_BYTES = 512 * 1024
const PREVIEW_MIN_DURATION = 60

const getIntervalSeconds = (interval: string | null | undefined) => {
  if (!interval) return 0
  const parts = interval.split(':').map((part) => Number(part))
  if (parts.some((part) => Number.isNaN(part))) return 0
  return parts.reduce((total, part) => total * 60 + part, 0)
}

const getContentSize = async (url: string) => {
  const deadline = Date.now() + 5000
  const probe = async (method: 'HEAD' | 'GET', timeout: number) => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
    }, timeout)
    try {
      // needBody returns the stream at headers. Never buffer a whole song when
      // a server ignores Range, and release the socket immediately afterwards.
      const resp = await request<Readable>(url, {
        method,
        headers: method == 'GET' ? { Range: 'bytes=0-1' } : undefined,
        timeout,
        retryNum: 0,
        signal: controller.signal,
        needBody: true,
      })
      try {
        return { headers: resp.headers, statusCode: resp.statusCode }
      } finally {
        // Undici emits an AbortError on intentional early stream destruction.
        resp.body.once('error', () => {})
        resp.body.destroy()
      }
    } finally {
      clearTimeout(timer)
    }
  }
  let resp: Awaited<ReturnType<typeof probe>> | undefined
  try {
    resp = await probe('HEAD', 2000)
  } catch {
    // Some CDNs reject HEAD; a bounded Range GET is the compatibility fallback.
  }
  if (!resp?.statusCode || resp.statusCode < 200 || resp.statusCode >= 300) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) throw new Error('Music URL validation timed out')
    resp = await probe('GET', remaining)
  }
  if (!resp.statusCode || resp.statusCode < 200 || resp.statusCode >= 300) {
    throw new Error(`Music URL unavailable: HTTP ${resp.statusCode ?? 'unknown'}`)
  }
  const contentType = String(resp.headers['content-type'] ?? '').toLowerCase()
  // Audio-only MP4/WebM files are sometimes served with a video MIME type.
  // MIME alone cannot tell whether these supported containers contain audio.
  const mime = contentType.split(';')[0].trim()
  const unsupportedVideo = mime.startsWith('video/') && !['video/mp4', 'video/webm'].includes(mime)
  if (/^(?:text\/|application\/(?:json|xml))/.test(contentType) || unsupportedVideo) {
    throw new Error('Music URL did not return supported media')
  }
  const range = resp.headers['content-range']
  if (typeof range == 'string') {
    const match = /\/(\d+)$/.exec(range)
    if (match) return Number(match[1])
  }
  // A 206 Content-Length is only the probe size, not the size of the song.
  if (resp.statusCode == 206) return 0
  const length = Number(resp.headers['content-length'] ?? 0)
  return Number.isFinite(length) && length > 0 ? length : 0
}

// A probe timeout is inconclusive on slow CDNs, unlike a definite network or
// HTTP error. Only fresh URLs may be handed to the player in this case.
const isProbeTimeout = (error: unknown) => {
  if (!error || typeof error != 'object') return false
  const info = error as { name?: string; code?: string; message?: string }
  return (
    info.name == 'AbortError' ||
    info.name == 'TimeoutError' ||
    info.code == 'UND_ERR_HEADERS_TIMEOUT' ||
    info.code == 'UND_ERR_BODY_TIMEOUT' ||
    info.message == 'Music URL validation timed out'
  )
}

export const assertPlayableMusicUrl = async (url: string, musicInfo: AnyListen.Music.MusicInfo, isFromCache = false) => {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch (error) {
    throw new Error('Music URL is invalid', { cause: error })
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Music URL must use HTTP(S)')
  // These short-lived signed links must be refreshed, not replayed from the
  // persistent cache. Fresh audio links remain supported after validation.
  if (isFromCache && /(?:^|\.)googlevideo\.com$/i.test(parsed.hostname)) {
    throw new Error('Cached media URL requires refresh')
  }
  const expires = Number(parsed.searchParams.get('expire'))
  if (expires > 0 && expires * 1000 <= Date.now()) throw new Error('Music URL has expired')
  let size: number
  try {
    size = await getContentSize(url)
  } catch (error) {
    if (isFromCache || !isProbeTimeout(error)) throw error
    // No signed URL in logs. The player remains responsible for final decoding,
    // playback and its normal loading timeout; this is not a successful probe.
    console.warn('Fresh music URL probe timed out; validation unknown, trying playback')
    return
  }
  const duration = getIntervalSeconds(musicInfo.interval)
  if (duration >= PREVIEW_MIN_DURATION && size > 0 && size < MIN_REASONABLE_AUDIO_BYTES) {
    throw new Error(`Get music url failed, preview url too short: ${size} bytes`)
  }
}

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
  return runSourceAction('musicUrl', buildExtSourceId(extensionId, source), 8000, async () =>
    services.extensionSerive
      .resourceAction('musicUrl', {
        extensionId,
        source,
        musicInfo,
        quality,
        type,
      })
      .then(async (result) => {
        // console.log(result)
        if (!result.url) throw new Error('Get music url failed')
        // 在线音源的播放地址必须是真实的 http(s) 地址。
        // 某些音源(如 gdstudio)在没有结果时会返回 "./gdstudio-no-url" 之类的相对路径占位符,
        // 而 desktop 的 allowedUrl 允许相对/file 路径(为本地文件留的),会把占位符当成合法地址缓存并"播放"→报错。
        // 这里统一要求 http(s),挡掉占位符,促使上层自动换到真正可用的音源。
        if (!/^https?:\/\//i.test(result.url)) throw new Error('Get music url failed, invalid url')
        if (!allowedUrl(result.url)) throw new Error('Get music url failed, url not allowed')
        await assertPlayableMusicUrl(result.url, musicInfo)
        return result
      })
  )
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
  const excluded = [...excludeList]
  while (true) {
    const source = getExtSource('musicUrl', excluded, musicInfo.meta.source)
    if (!source) throw new Error('Get url failed, no source')
    const sourceId = buildExtSourceId(source.extensionId, source.id)
    excluded.push(sourceId)
    if (isSourceCoolingDown('musicUrl', sourceId)) continue
    try {
      return await getMusicUrlByExtensionSource({
        extensionId: source.extensionId,
        source: source.id,
        musicInfo,
        quality,
        type,
      })
    } catch {
      console.warn(`Music URL failed: ${source.id}; trying next source`)
    }
  }
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
