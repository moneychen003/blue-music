import { cancelMusicSearchRequest, findMusic as findMusicByExt } from './search/music'
import { isSourceCoolingDown, runSourceAction, sourceAbortError } from './sourceHealth'
import { buildExtSourceId, getPreferredExtSource } from './utils'

const findSourceMusic = async <T>(
  info: {
    name: string
    singer: string
    albumName: string
    interval: string | null
  },
  handler: (info: AnyListen.Music.MusicInfoOnline) => Promise<T>,
  excludeList: string[] = [],
  signal?: AbortSignal
): Promise<T> => {
  // A failed extension must not abort the whole fallback chain. Exclude before
  // awaiting so even an exception, malformed result or timeout advances it.
  const excluded = [...excludeList]
  while (true) {
    if (signal?.aborted) throw sourceAbortError()
    const source = getPreferredExtSource('musicSearch', excluded)
    if (!source) throw new Error('Get url failed, no source')
    const sourceId = buildExtSourceId(source.extensionId, source.id)
    excluded.push(sourceId)
    if (isSourceCoolingDown('musicSearch', sourceId)) continue
    try {
      const music = await runSourceAction('musicSearch', sourceId, 5000, async (_signal, requestId) =>
        findMusicByExt({ extensionId: source.extensionId, source: source.id, ...info, requestId }),
        { signal, cancel: (requestId) => cancelMusicSearchRequest?.(requestId) }
      )
      if (music) return await handler(music)
    } catch {
      if (signal?.aborted) throw sourceAbortError()
      // Do not log extension errors verbatim: they can contain signed URLs.
      console.warn(`Music fallback failed: ${source.id}; trying next source`)
    }
  }
}

const handleFindMusic = async <T>(
  musicInfo: {
    name: string
    singer: string
    albumName: string
    interval: string | null
    rawName?: string
    source?: string
  },
  handler: (info: AnyListen.Music.MusicInfoOnline) => Promise<T>,
  signal?: AbortSignal
) => {
  const excludeList: string[] = musicInfo.source ? [musicInfo.source] : []
  try {
    return await findSourceMusic<T>(
      {
        name: musicInfo.name,
        singer: musicInfo.singer,
        albumName: musicInfo.albumName,
        interval: musicInfo.interval,
      },
      handler,
      [...excludeList],
      signal
    )
  } catch {}
  if (musicInfo.name.includes('-')) {
    const [name, singer] = musicInfo.name.split('-').map((val) => val.trim())
    try {
      return await findSourceMusic<T>(
        {
          name,
          singer,
          albumName: musicInfo.albumName,
          interval: musicInfo.interval,
        },
        handler,
        [...excludeList],
        signal
      )
    } catch {}
    try {
      return await findSourceMusic<T>(
        {
          name: singer,
          singer: name,
          albumName: musicInfo.albumName,
          interval: musicInfo.interval,
        },
        handler,
        [...excludeList],
        signal
      )
    } catch {}
  }
  let fileName = musicInfo.rawName
  if (fileName) {
    fileName = fileName.substring(0, fileName.lastIndexOf('.'))
    if (fileName != musicInfo.name) {
      if (fileName.includes('-')) {
        const [name, singer] = fileName.split('-').map((val) => val.trim())
        try {
          return await findSourceMusic<T>(
            {
              name,
              singer,
              albumName: musicInfo.albumName,
              interval: musicInfo.interval,
            },
            handler,
            [...excludeList],
            signal
          )
        } catch {}
        try {
          return await findSourceMusic<T>(
            {
              name: singer,
              singer: name,
              albumName: musicInfo.albumName,
              interval: musicInfo.interval,
            },
            handler,
            [...excludeList],
            signal
          )
        } catch {}
      } else {
        try {
          return await findSourceMusic<T>(
            {
              name: fileName,
              singer: '',
              albumName: musicInfo.albumName,
              interval: musicInfo.interval,
            },
            handler,
            [...excludeList],
            signal
          )
        } catch {}
      }
    }
  }

  throw new Error('source not found')
}

const findMusicByLocal = async <T>(
  musicInfo: AnyListen.Music.MusicInfoLocal,
  handler: (info: AnyListen.Music.MusicInfoOnline) => Promise<T>,
  signal?: AbortSignal
) => {
  return handleFindMusic(
    {
      name: musicInfo.name,
      singer: musicInfo.singer,
      albumName: musicInfo.meta.albumName,
      interval: musicInfo.interval,
      rawName: musicInfo.meta.filePath.split(/\/|\\/).at(-1),
    },
    handler,
    signal
  )
}

const findMusicByOnline = async <T>(
  musicInfo: AnyListen.Music.MusicInfoOnline,
  handler: (info: AnyListen.Music.MusicInfoOnline) => Promise<T>,
  signal?: AbortSignal
) => {
  return handleFindMusic(
    {
      name: musicInfo.name,
      singer: musicInfo.singer,
      albumName: musicInfo.meta.albumName,
      interval: musicInfo.interval,
      rawName: musicInfo.meta.fileName,
      source: musicInfo.meta.source,
    },
    handler,
    signal
  )
}

export const findMusic = async <T>(
  musicInfo: AnyListen.Music.MusicInfo,
  handler: (info: AnyListen.Music.MusicInfoOnline) => Promise<T>,
  signal?: AbortSignal
) => {
  if (musicInfo.isLocal) {
    return findMusicByLocal(musicInfo, async (info) => {
      return handler(info)
    }, signal)
  }
  try {
    return await handler(musicInfo)
  } catch {}
  if (signal?.aborted) throw sourceAbortError()
  return findMusicByOnline(musicInfo, handler, signal)
}
