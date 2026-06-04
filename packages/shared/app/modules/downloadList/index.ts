import fs from 'node:fs'
import path from 'node:path'

import { createDownload } from '@any-listen/nodejs/download'
import { buildMusicName, getFileType } from '@any-listen/common/tools'
import { filterFileName } from '@any-listen/common/utils'

import { workers } from '../worker'
import { getMusicUrl } from '../resources/musicUrl'

// 进行中的下载任务(taskId -> Downloader 实例),用于暂停/取消
const activeTasks = new Map<string, ReturnType<typeof createDownload>>()
// 并发控制:最多同时跑 MAX_CONCURRENT 个,其余排队(批量下载 700+ 时避免一次性全开)
const MAX_CONCURRENT = 3
let runningCount = 0
const pendingQueue: Array<{ id: string; run: () => void }> = []
const inflightIds = new Set<string>()

const buildTaskId = (musicInfo: AnyListen.Music.MusicInfoOnline, quality: string) => `${musicInfo.id}__${quality}`

const findItem = async (id: string) => (await workers.dbService.getDownloadList()).find((i) => i.id == id)

const runNext = () => {
  while (runningCount < MAX_CONCURRENT && pendingQueue.length) {
    pendingQueue.shift()!.run()
  }
}

const runTask = (item: AnyListen.Download.ListItem, fileType: AnyListen.Music.FileType) => {
  runningCount++
  item.status = 'run'
  item.statusText = ''
  workers.dbService.downloadInfoUpdate([item])
  const id = item.id

  const finish = () => {
    activeTasks.delete(id)
    inflightIds.delete(id)
    runningCount--
    workers.dbService.downloadInfoUpdate([item])
    runNext()
  }
  const fail = (message: string) => {
    item.status = 'error'
    item.statusText = message
    item.speed = ''
    finish()
  }

  void getMusicUrl({
    musicInfo: item.metadata.musicInfo as AnyListen.Music.MusicInfoOnline,
    quality: item.metadata.quality,
    type: fileType,
  })
    .then(({ url }) => {
      // 暂停/取消可能在取 URL 期间发生:此时任务已不在 inflight,直接放弃
      if (!inflightIds.has(id)) return
      if (!url) {
        fail('获取下载地址失败')
        return
      }
      item.metadata.url = url
      const dl = createDownload({
        url,
        path: item.metadata.filePath,
        onProgress(progress) {
          item.downloaded = progress.downloaded
          item.total = progress.total
          item.progress = progress.progress
          item.speed = progress.speed
          item.writeQueue = progress.writeQueue
          workers.dbService.downloadInfoUpdate([item])
        },
        onCompleted() {
          item.status = 'completed'
          item.isComplate = true
          item.progress = 100
          item.speed = ''
          finish()
        },
        onError(err) {
          fail(err.message)
        },
      })
      activeTasks.set(id, dl)
    })
    .catch((err: Error) => {
      fail(err.message)
    })
}

export const getDownloadList = async () => {
  return workers.dbService.getDownloadList()
}

export const removeDownloadList = async (ids: string[]) => {
  for (const id of ids) {
    activeTasks.get(id)?.stop()
    activeTasks.delete(id)
    inflightIds.delete(id)
  }
  return workers.dbService.downloadInfoRemove(ids)
}

export const clearDownloadList = async () => {
  for (const dl of activeTasks.values()) dl.stop()
  activeTasks.clear()
  inflightIds.clear()
  pendingQueue.length = 0
  runningCount = 0
  return workers.dbService.downloadInfoClear()
}

/** 暂停:停止下载器但保留半成品文件,以便续传 */
export const pauseDownload = async (id: string) => {
  const dl = activeTasks.get(id)
  if (dl) {
    void dl.stop()
    activeTasks.delete(id)
    runningCount = Math.max(0, runningCount - 1)
  }
  inflightIds.delete(id)
  const idx = pendingQueue.findIndex((p) => p.id == id)
  if (idx >= 0) pendingQueue.splice(idx, 1)
  const item = await findItem(id)
  if (item && !item.isComplate) {
    item.status = 'pause'
    item.speed = ''
    workers.dbService.downloadInfoUpdate([item])
  }
  runNext()
}

/** 继续:重新取 URL 并续传(下载器按已下字节用 Range 续传) */
export const resumeDownload = async (id: string) => {
  if (inflightIds.has(id)) return
  const item = await findItem(id)
  if (!item || item.isComplate) return
  inflightIds.add(id)
  const fileType = getFileType(item.metadata.quality)
  if (runningCount >= MAX_CONCURRENT) {
    item.status = 'waiting'
    workers.dbService.downloadInfoUpdate([item])
    pendingQueue.push({ id, run: () => runTask(item, fileType) })
  } else {
    runTask(item, fileType)
  }
}

/** 取消:停止下载、删除半成品文件、从列表移除 */
export const cancelDownload = async (id: string) => {
  const dl = activeTasks.get(id)
  if (dl) {
    void dl.stop()
    activeTasks.delete(id)
    runningCount = Math.max(0, runningCount - 1)
  }
  inflightIds.delete(id)
  const idx = pendingQueue.findIndex((p) => p.id == id)
  if (idx >= 0) pendingQueue.splice(idx, 1)
  const item = await findItem(id)
  if (item?.metadata.filePath) {
    await fs.promises.unlink(item.metadata.filePath).catch(() => {})
  }
  workers.dbService.downloadInfoRemove([id])
  runNext()
}

/**
 * 开始下载一首在线歌曲(仅 desktop 有文件写入能力)。
 * 保存到 <savePath>/<歌手>/<歌名 - 歌手>.<ext>;并发受限,超额排队;进度由前端轮询 getDownloadList。
 */
export const startDownloadMusic = async (
  musicInfo: AnyListen.Music.MusicInfoOnline,
  quality: string,
  savePath: string,
  fileNameFormat: AnyListen.AppSetting['download.fileName'],
  addMusicLocationType: AnyListen.AddMusicLocationType
): Promise<string> => {
  const id = buildTaskId(musicInfo, quality)
  // 去重①:本会话已在处理(进行中/排队)
  if (inflightIds.has(id)) return id

  const fileType = getFileType(quality)
  const ext: AnyListen.Download.FileExt = fileType === 'm4a' ? 'mp3' : fileType
  const baseName = filterFileName(buildMusicName(fileNameFormat, musicInfo.name, musicInfo.singer)) || musicInfo.name
  const fileName = `${baseName}.${ext}`
  // 按歌手分类:<savePath>/<歌手>/<文件名>
  const artistDir = filterFileName(musicInfo.singer) || '未知歌手'
  const filePath = path.join(savePath, artistDir, fileName)

  // 去重②:目标文件已存在磁盘 = 下载过了,跳过(批量下载时自动略过已下载的)
  if (fs.existsSync(filePath)) return id
  // 去重③:列表里已有该任务且未失败(完成/进行中/排队/暂停)→ 跳过,只有 error 的才允许重下
  const existing = (await workers.dbService.getDownloadList()).find((i) => i.id == id)
  if (existing && existing.status != 'error') return id

  inflightIds.add(id)
  const willQueue = runningCount >= MAX_CONCURRENT
  const item: AnyListen.Download.ListItem = {
    id,
    isComplate: false,
    status: willQueue ? 'waiting' : 'run',
    statusText: '',
    downloaded: 0,
    total: 0,
    progress: 0,
    speed: '',
    writeQueue: 0,
    metadata: { musicInfo, url: null, quality, ext, fileName, filePath },
  }
  workers.dbService.downloadInfoSave([item], addMusicLocationType)

  if (willQueue) pendingQueue.push({ id, run: () => runTask(item, fileType) })
  else runTask(item, fileType)
  return id
}
