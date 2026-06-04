import { filterFileName } from '@any-listen/common/utils'
import { basename, dirname, extname, isAbsolute, joinPath, readFile, saveStrToFile, toMD5 } from '@any-listen/nodejs'
import { decodeString } from '@any-listen/nodejs/char'

interface ImportRow {
  name: string
  singer: string
  albumName: string
  interval?: string | null
  musicId?: string
  source?: string
  url?: string
  ext?: string
  fileName?: string
}

interface ParsedPlaylist {
  localPaths: string[]
  musicInfos: AnyListen.Music.MusicInfoOnline[]
  total: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value == 'object' && value != null && !Array.isArray(value)
}

const toText = (value: unknown): string => {
  if (typeof value == 'string') return value.trim()
  if (typeof value == 'number' && Number.isFinite(value)) return String(value)
  return ''
}

const toSingerText = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join('、')
  return toText(value)
}

const toIntervalSeconds = (interval: string | null) => {
  if (!interval) return -1
  const parts = interval.split(':').map((part) => Number(part))
  if (parts.some((part) => Number.isNaN(part))) return -1
  return parts.reduce((sum, part) => sum * 60 + part, 0)
}

const detectFormat = (filePath: string): AnyListen.IPCList.PlaylistFileFormat => {
  const ext = extname(filePath)
  if (ext == '.m3u' || ext == '.m3u8') return 'm3u'
  if (ext == '.json' || ext == '.lx') return 'lx'
  return 'csv'
}

const normalizePath = (filePath: string, baseDir: string) => {
  if (/^https?:\/\//i.test(filePath) || /^anylisten:/i.test(filePath)) return filePath
  return isAbsolute(filePath) ? filePath : joinPath(baseDir, filePath)
}

const createImportedMusicInfo = (row: ImportRow): AnyListen.Music.MusicInfoOnline | null => {
  const name = row.name.trim()
  if (!name) return null
  const singer = row.singer.trim()
  const albumName = row.albumName.trim()
  const source = (row.source || 'import').trim() || 'import'
  const musicId = (row.musicId || row.url || `${name}\u0000${singer}\u0000${albumName}`).trim()
  const now = Date.now()
  const id = `${source}_${toMD5(`${source}\u0000${musicId}\u0000${name}\u0000${singer}`)}`
  return {
    id,
    name,
    singer,
    isLocal: false,
    interval: row.interval ?? null,
    meta: {
      albumName,
      createTime: now,
      ext: row.ext,
      fileName: row.fileName,
      musicId,
      picUrl: null,
      posTime: now,
      source,
      updateTime: now,
      url: row.url,
    },
  }
}

const parseCSVLine = (line: string) => {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (char == '"') {
      if (quoted && line[index + 1] == '"') {
        cell += '"'
        index++
      } else {
        quoted = !quoted
      }
    } else if (char == ',' && !quoted) {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += char
    }
  }
  cells.push(cell.trim())
  return cells
}

const parseCSV = (content: string): ImportRow[] => {
  const rows = content
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCSVLine)
  if (!rows.length) return []

  const header = rows[0].map((cell) => cell.toLowerCase())
  const hasHeader = header.some((cell) => ['name', 'title', 'song', 'singer', 'artist', 'album', 'albumname'].includes(cell))
  const headerIndex = (keys: string[]) => keys.map((key) => header.indexOf(key)).find((index) => index >= 0) ?? -1
  const nameIndex = hasHeader ? headerIndex(['name', 'title', 'song']) : 0
  const singerIndex = hasHeader ? headerIndex(['singer', 'artist']) : 1
  const albumIndex = hasHeader ? headerIndex(['album', 'albumname', 'album_name']) : 2
  const sourceIndex = hasHeader ? headerIndex(['source']) : -1
  const musicIdIndex = hasHeader ? headerIndex(['musicid', 'music_id', 'id']) : -1
  const urlIndex = hasHeader ? headerIndex(['url']) : -1
  const intervalIndex = hasHeader ? headerIndex(['interval', 'duration']) : -1

  return (hasHeader ? rows.slice(1) : rows).map((row) => ({
    name: row[nameIndex] || '',
    singer: singerIndex >= 0 ? row[singerIndex] || '' : '',
    albumName: albumIndex >= 0 ? row[albumIndex] || '' : '',
    source: sourceIndex >= 0 ? row[sourceIndex] : undefined,
    musicId: musicIdIndex >= 0 ? row[musicIdIndex] : undefined,
    url: urlIndex >= 0 ? row[urlIndex] : undefined,
    interval: intervalIndex >= 0 ? row[intervalIndex] : undefined,
  }))
}

const parseM3U = (content: string, filePath: string) => {
  const rows: ImportRow[] = []
  const localPaths: string[] = []
  const baseDir = dirname(filePath)
  let extinf = ''
  for (const rawLine of content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('#EXTINF:')) {
      extinf = line.slice(line.indexOf(',') + 1).trim()
      continue
    }
    if (line.startsWith('#')) continue

    const target = normalizePath(line, baseDir)
    if (/^https?:\/\//i.test(target) || /^anylisten:/i.test(target)) {
      const fallbackName = basename(target.split('?')[0]) || target
      const [singer, name] = extinf.includes(' - ') ? extinf.split(' - ', 2).map((part) => part.trim()) : ['', extinf || fallbackName]
      rows.push({
        name,
        singer,
        albumName: '',
        source: /^anylisten:/i.test(target) ? target.split(':')[1] || 'm3u' : 'm3u',
        musicId: target,
        url: /^https?:\/\//i.test(target) ? target : undefined,
        fileName: fallbackName,
      })
    } else {
      localPaths.push(target)
    }
    extinf = ''
  }
  return { rows, localPaths, total: rows.length + localPaths.length }
}

const extractRowFromObject = (item: Record<string, unknown>): ImportRow | null => {
  const meta = isRecord(item.meta) ? item.meta : {}
  const album = isRecord(item.album) ? item.album : {}
  const name = toText(item.name ?? item.title ?? item.songName)
  if (!name) return null
  return {
    name,
    singer: toSingerText(item.singer ?? item.artist ?? item.artists ?? item.author),
    albumName: toText(meta.albumName ?? item.albumName ?? item.album ?? album.name),
    interval: toText(item.interval || item.duration) || null,
    source: toText(meta.source ?? item.source) || 'lx',
    musicId: toText(meta.musicId ?? item.musicId ?? item.id),
    url: toText(meta.url ?? item.url) || undefined,
    ext: toText(meta.ext ?? item.ext) || undefined,
    fileName: toText(meta.fileName ?? item.fileName) || undefined,
  }
}

const parseLXJSON = (content: string) => {
  const rows: ImportRow[] = []
  const localPaths: string[] = []
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
      return
    }
    if (!isRecord(value)) return
    const meta = isRecord(value.meta) ? value.meta : {}
    if (value.isLocal === true && typeof meta.filePath == 'string') {
      localPaths.push(meta.filePath)
      return
    }
    const row = extractRowFromObject(value)
    if (row) rows.push(row)
    for (const key of ['data', 'list', 'lists', 'musicList', 'musics']) {
      if (key in value) visit(value[key])
    }
  }
  visit(JSON.parse(content) as unknown)
  return { rows, localPaths, total: rows.length + localPaths.length }
}

const dedupeMusicInfos = (rows: ImportRow[]) => {
  const ids = new Set<string>()
  const musicInfos: AnyListen.Music.MusicInfoOnline[] = []
  for (const row of rows) {
    const musicInfo = createImportedMusicInfo(row)
    if (!musicInfo || ids.has(musicInfo.id)) continue
    ids.add(musicInfo.id)
    musicInfos.push(musicInfo)
  }
  return musicInfos
}

const parsePlaylistContent = (content: string, filePath: string): ParsedPlaylist => {
  const format = detectFormat(filePath)
  let rows: ImportRow[] = []
  let localPaths: string[] = []
  let total = 0
  if (format == 'm3u') {
    const result = parseM3U(content, filePath)
    rows = result.rows
    localPaths = result.localPaths
    total = result.total
  } else if (format == 'lx') {
    const result = parseLXJSON(content)
    rows = result.rows
    localPaths = result.localPaths
    total = result.total
  } else {
    rows = parseCSV(content)
    total = rows.length
  }
  return {
    localPaths,
    musicInfos: dedupeMusicInfos(rows),
    total,
  }
}

const escapeCSVCell = (value: string | number | null | undefined) => {
  const text = value == null ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const exportCSV = (musics: AnyListen.Music.MusicInfo[]) => {
  const header = ['name', 'singer', 'album', 'interval', 'source', 'musicId', 'filePath', 'url']
  const rows = musics.map((music) => {
    const source = music.isLocal ? 'local' : music.meta.source
    const musicId = music.meta.musicId
    const filePath = music.isLocal ? music.meta.filePath : ''
    const url = music.isLocal ? '' : toText(music.meta.url)
    return [music.name, music.singer, music.meta.albumName, music.interval ?? '', source, musicId, filePath, url].map(escapeCSVCell).join(',')
  })
  return `\uFEFF${[header.join(','), ...rows].join('\n')}\n`
}

const exportM3U = (musics: AnyListen.Music.MusicInfo[]) => {
  const lines = ['#EXTM3U']
  for (const music of musics) {
    const seconds = toIntervalSeconds(music.interval)
    const label = music.singer ? `${music.singer} - ${music.name}` : music.name
    lines.push(`#EXTINF:${seconds},${label}`)
    lines.push(music.isLocal ? music.meta.filePath : `anylisten:${music.meta.source}:${music.meta.musicId}`)
  }
  return `${lines.join('\n')}\n`
}

const exportLX = (listName: string, musics: AnyListen.Music.MusicInfo[]) => {
  return `${JSON.stringify({ type: 'myList', data: [{ name: listName, list: musics }] }, null, 2)}\n`
}

export const buildExportFileName = (listName: string, format: AnyListen.IPCList.PlaylistFileFormat) => {
  return `anylisten_${filterFileName(listName) || 'playlist'}.${format == 'lx' ? 'json' : format}`
}

export const readPlaylistImportFile = async (filePath: string) => {
  const content = await decodeString(await readFile(filePath))
  return parsePlaylistContent(content, filePath)
}

export const buildPlaylistExportContent = (
  listName: string,
  musics: AnyListen.Music.MusicInfo[],
  format: AnyListen.IPCList.PlaylistFileFormat
) => {
  switch (format) {
    case 'm3u':
      return exportM3U(musics)
    case 'lx':
      return exportLX(listName, musics)
    default:
      return exportCSV(musics)
  }
}

export const savePlaylistExportFile = async (
  listName: string,
  musics: AnyListen.Music.MusicInfo[],
  options: AnyListen.IPCList.PlaylistExportOptions
) => {
  const filePath = options.filePath || (options.dirPath ? joinPath(options.dirPath, buildExportFileName(listName, options.format)) : '')
  if (!filePath) throw new Error('missing export path')
  await saveStrToFile(filePath, buildPlaylistExportContent(listName, musics, options.format))
  return filePath
}
