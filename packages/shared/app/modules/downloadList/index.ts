import fs from 'node:fs'
import path from 'node:path'

import { createDownload } from '@any-listen/nodejs/download'
import { buildMusicName, getFileType } from '@any-listen/common/tools'
import { filterFileName } from '@any-listen/common/utils'

import { workers } from '../worker'
import { getMusicUrl } from '../resources/musicUrl'

const MAX_CONCURRENT = 3
type Session = { id: string; generation: number; phase: 'waiting' | 'running'; released: boolean; controller: AbortController; dl?: ReturnType<typeof createDownload> }
const sessions = new Map<string, Session>()
const pendingQueue: string[] = []
let runningCount = 0
let generation = 0
let recovered = false
const buildTaskId = (musicInfo: AnyListen.Music.MusicInfoOnline, quality: string) => `${musicInfo.id}__${quality}`
const findItem = async (id: string) => (await workers.dbService.getDownloadList()).find((i) => i.id === id)
const current = (s: Session) => sessions.get(s.id) === s

/** A process restart cannot leave phantom in-memory workers or pretend a partial file is complete. */
const recover = async () => {
  if (recovered) return
  const list = await workers.dbService.getDownloadList()
  recovered = true
  for (const item of list) {
    if (item.isComplate) {
      const size = item.metadata.filePath
        ? (await fs.promises.stat(item.metadata.filePath).catch(() => null))?.size
        : undefined
      if (!(item.total > 0 && size === item.total)) {
        item.isComplate = false
        item.status = 'error'
        item.statusText = '下载文件未通过完整性验证，请重新下载'
        workers.dbService.downloadInfoUpdate([item])
      }
    } else if (item.status === 'run' || item.status === 'waiting') {
      item.status = 'pause'
      item.speed = ''
      workers.dbService.downloadInfoUpdate([item])
    }
  }
}

const release = (s: Session) => {
  if (s.released) return
  s.released = true
  if (s.phase === 'running') runningCount = Math.max(0, runningCount - 1)
}

const drain = () => {
  while (runningCount < MAX_CONCURRENT && pendingQueue.length) {
    const id = pendingQueue.shift()!
    const s = sessions.get(id)
    if (s?.phase === 'waiting' && !s.released) void runTask(s)
  }
}

const invalidate = (id: string, shouldDrain = true) => {
  const s = sessions.get(id)
  if (!s) return
  sessions.delete(id)
  s.controller.abort()
  for (let i = pendingQueue.length - 1; i >= 0; i--) if (pendingQueue[i] === id) pendingQueue.splice(i, 1)
  release(s)
  // Stop may finish asynchronously; callbacks from this generation are already invalid.
  const stopped = s.dl?.stop()
  if (shouldDrain) drain()
  return stopped
}

const runTask = async (s: Session) => {
  if (!current(s) || s.released || s.phase !== 'waiting') return
  s.phase = 'running'
  runningCount++
  let item: AnyListen.Download.ListItem | undefined
  try { item = await findItem(s.id) } catch { invalidate(s.id); return }
  if (!current(s)) return
  if (!item || item.isComplate) { invalidate(s.id); return }
  item.status = 'run'
  item.statusText = ''
  workers.dbService.downloadInfoUpdate([item])
  const finish = () => {
    if (!current(s)) return
    sessions.delete(s.id)
    release(s)
    workers.dbService.downloadInfoUpdate([item])
    drain()
  }
  const fail = (message: string) => {
    if (!current(s)) return
    item.status = 'error'
    item.statusText = message
    item.speed = ''
    finish()
  }
  try {
    const { url } = await getMusicUrl({
      musicInfo: item.metadata.musicInfo as AnyListen.Music.MusicInfoOnline,
      quality: item.metadata.quality,
      type: getFileType(item.metadata.quality),
      signal: s.controller.signal,
    })
    if (!current(s)) return
    if (!url) { fail('获取下载地址失败'); return }
    item.metadata.url = url
    s.dl = createDownload({
      url,
      path: item.metadata.filePath,
      verifyAudio: true,
      onProgress(progress) {
        if (!current(s)) return
        item.downloaded = progress.downloaded
        item.total = progress.total
        item.progress = progress.progress
        item.speed = progress.speed
        item.writeQueue = progress.writeQueue
        workers.dbService.downloadInfoUpdate([item])
      },
      onCompleted() {
        if (!current(s)) return
        item.status = 'completed'
        item.isComplate = true
        item.progress = 100
        item.speed = ''
        finish()
      },
      onError(err) { fail(err.message) },
      onFail(resp) { fail(`Download HTTP ${resp.statusCode ?? 'unknown'}`) },
    })
  } catch (err) {
    fail((err as Error).message)
  }
}

const enqueue = (item: AnyListen.Download.ListItem) => {
  const s: Session = { id: item.id, generation: ++generation, phase: 'waiting', released: false, controller: new AbortController() }
  sessions.set(item.id, s)
  if (runningCount < MAX_CONCURRENT) void runTask(s)
  else {
    item.status = 'waiting'
    workers.dbService.downloadInfoUpdate([item])
    pendingQueue.push(item.id)
  }
}

export const getDownloadList = async () => {
  await recover()
  return workers.dbService.getDownloadList()
}

export const removeDownloadList = async (ids: string[]) => {
  await Promise.all(ids.map((id) => invalidate(id, false)))
  const result = workers.dbService.downloadInfoRemove(ids)
  drain()
  return result
}

export const clearDownloadList = async () => {
  await Promise.all([...sessions.keys()].map((id) => invalidate(id, false)))
  pendingQueue.length = 0
  return workers.dbService.downloadInfoClear()
}

/** Pause keeps only the .part file; URL and downloader callbacks are invalidated. */
export const pauseDownload = async (id: string) => {
  invalidate(id)
  const item = await findItem(id)
  if (item && !item.isComplate) {
    item.status = 'pause'
    item.speed = ''
    workers.dbService.downloadInfoUpdate([item])
  }
}

export const resumeDownload = async (id: string) => {
  await recover()
  if (sessions.has(id)) return
  const item = await findItem(id)
  if (!item || item.isComplate) return
  enqueue(item)
}

/** Cancel removes only this task's partial file, not a verified final or another quality. */
export const cancelDownload = async (id: string) => {
  await invalidate(id)
  const item = await findItem(id)
  if (item?.metadata.filePath) await fs.promises.unlink(`${item.metadata.filePath}.part`).catch(() => {})
  return workers.dbService.downloadInfoRemove([id])
}

export const startDownloadMusic = async (
  musicInfo: AnyListen.Music.MusicInfoOnline,
  quality: string,
  savePath: string,
  fileNameFormat: AnyListen.AppSetting['download.fileName'],
  addMusicLocationType: AnyListen.AddMusicLocationType
): Promise<string> => {
  await recover()
  const id = buildTaskId(musicInfo, quality)
  if (sessions.has(id)) return id
  const fileType = getFileType(quality)
  const ext: AnyListen.Download.FileExt = fileType === 'm4a' ? 'mp3' : fileType
  const baseName = filterFileName(buildMusicName(fileNameFormat, musicInfo.name, musicInfo.singer)) || musicInfo.name
  const artistDir = filterFileName(musicInfo.singer) || '未知歌手'
  // Quality is part of the task identity and MUST also be part of its on-disk identity.
  const safeQuality = filterFileName(quality).replace(/[\\/]/g, '_') || 'unknown'
  const fileName = `${baseName} [${safeQuality}].${ext}`
  const filePath = path.join(savePath, artistDir, fileName)
  const existing = await findItem(id)
  if (existing?.isComplate && existing.status === 'completed' && existing.total > 0 &&
    existing.metadata.filePath === filePath &&
    (await fs.promises.stat(filePath).catch(() => null))?.size === existing.total) return id
  if (existing && existing.status !== 'error' && existing.status !== 'completed') return id
  const item: AnyListen.Download.ListItem = existing ?? {
    id, isComplate: false, status: 'waiting', statusText: '', downloaded: 0, total: 0,
    progress: 0, speed: '', writeQueue: 0,
    metadata: { musicInfo, url: null, quality, ext, fileName, filePath },
  }
  item.isComplate = false
  item.status = 'waiting'
  item.statusText = ''
  item.downloaded = 0
  item.total = 0
  item.progress = 0
  item.metadata = { musicInfo, url: null, quality, ext, fileName, filePath }
  if (existing) workers.dbService.downloadInfoUpdate([item])
  else workers.dbService.downloadInfoSave([item], addMusicLocationType)
  enqueue(item)
  return id
}
