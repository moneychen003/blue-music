import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import type http from 'node:http'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

import { type Options as RequestOptions, request } from './request'
import { STATUS } from './util'

export interface Options {
  forceResume: boolean
  timeout: number
  requestOptions: RequestOptions
  verifyAudio: boolean
}

/** The final path is never opened for writing. Only a verified .part is renamed into place. */
class Task extends EventEmitter {
  downloadUrl: string
  chunkInfo: { savePath: string; startByte: string; endByte: string }
  status: (typeof STATUS)[keyof typeof STATUS] = STATUS.idle
  options: Options
  requestOptions: RequestOptions
  requestInstance: http.ClientRequest | null = null
  private ws: fs.WriteStream | null = null
  private stopped = false
  private finished: Promise<void> | null = null
  private downloaded = 0
  private total = 0
  private lastProgressAt = 0
  private lastProgressBytes = 0

  constructor(url: string, savePath: string, options: Partial<Options> = {}) {
    super()
    this.downloadUrl = url
    this.chunkInfo = { savePath, startByte: '0', endByte: '' }
    this.options = { forceResume: true, timeout: 20_000, requestOptions: { method: 'get' }, verifyAudio: false, ...options }
    this.requestOptions = {
      ...this.options.requestOptions,
      headers: { ...this.options.requestOptions.headers },
    }
  }

  private async response(url: string, offset: number, redirects = 0): Promise<http.IncomingMessage> {
    if (redirects > 5) throw new Error('Too many download redirects')
    const headers = { ...this.requestOptions.headers }
    if (offset) headers.range = `bytes=${offset}-`
    else delete headers.range
    const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
      const req = request(url, { ...this.requestOptions, headers, timeout: this.options.timeout })
      this.requestInstance = req
      req.once('response', resolve).once('error', reject).end()
    })
    if (this.stopped) {
      response.destroy()
      throw new Error('Download stopped')
    }
    if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0) && response.headers.location) {
      const next = new URL(response.headers.location, url).href
      response.resume()
      return this.response(next, offset, redirects + 1)
    }
    return response
  }

  private report(force = false) {
    const now = Date.now()
    if (!force && now - this.lastProgressAt < 1000) return
    const elapsed = Math.max(1, now - this.lastProgressAt)
    const speed = Math.round(((this.downloaded - this.lastProgressBytes) * 1000) / elapsed)
    this.lastProgressAt = now
    this.lastProgressBytes = this.downloaded
    this.emit('progress', {
      total: this.total,
      downloaded: this.downloaded,
      progress: this.total ? (this.downloaded / this.total) * 100 : 0,
      speed,
      writeQueue: this.ws?.writableLength ?? 0,
    })
  }


  /** Header-level container check only; this does not decode audio or verify a content hash. */
  private async verifyAudioContainer(partPath: string, finalPath: string) {
    const handle = await fs.promises.open(partPath, 'r')
    const header = Buffer.alloc(32)
    let bytesRead: number
    try { ({ bytesRead } = await handle.read(header, 0, header.length, 0)) }
    finally { await handle.close() }
    const head = header.subarray(0, bytesRead)
    let container: 'mp3' | 'flac' | 'wav' | 'm4a' | null = null
    if (head.length >= 3 && head.toString('ascii', 0, 3) === 'ID3') container = 'mp3'
    else if (head.length >= 4 && head[0] === 0xff && (head[1] & 0xe0) === 0xe0 &&
      (head[1] & 0x18) !== 0x08 && (head[1] & 0x06) === 0x02 &&
      (head[2] & 0xf0) !== 0 && (head[2] & 0xf0) !== 0xf0 && (head[2] & 0x0c) !== 0x0c) container = 'mp3'
    else if (head.length >= 4 && head.toString('ascii', 0, 4) === 'fLaC') container = 'flac'
    else if (head.length >= 12 && head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WAVE') container = 'wav'
    else if (head.length >= 12 && head.toString('ascii', 4, 8) === 'ftyp') {
      const brands = [head.toString('ascii', 8, 12)]
      for (let offset = 16; offset + 4 <= head.length; offset += 4) brands.push(head.toString('ascii', offset, offset + 4))
      if (brands.some((brand) => ['M4A ', 'M4B ', 'isom', 'iso2', 'iso6', 'mp41', 'mp42', 'dash'].includes(brand))) container = 'm4a'
    }
    const ext = path.extname(finalPath).slice(1).toLowerCase()
    if (!container) throw new Error('Downloaded file is not a recognized audio container')
    if (container !== ext) throw new Error(`Downloaded audio container ${container} does not match .${ext}`)
  }

  private async transfer(retried416 = false): Promise<void> {
    const finalPath = this.chunkInfo.savePath
    if (!finalPath) throw new Error('Chunk save Path is not set.')
    const partPath = `${finalPath}.part`
    await fs.promises.mkdir(path.dirname(finalPath), { recursive: true })
    if (this.stopped) return
    const offset = (await fs.promises.stat(partPath).catch((err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') return null
      throw err
    }))?.size ?? 0
    const response = await this.response(this.downloadUrl, offset)
    response.setTimeout(this.options.timeout, () => response.destroy(new Error('download timeout')))
    const status = response.statusCode ?? 0
    if (status === 416 && offset && !retried416) {
      response.resume()
      await fs.promises.truncate(partPath, 0)
      return this.transfer(true)
    }
    if (status !== 200 && status !== 206) {
      response.resume()
      throw new Error(`Download HTTP ${status}`)
    }
    const lengthHeader = response.headers['content-length']
    const length = typeof lengthHeader === 'string' && /^\d+$/.test(lengthHeader) ? Number(lengthHeader) : NaN
    if (!Number.isSafeInteger(length) || length <= 0) {
      response.destroy()
      throw new Error('Invalid Content-Length')
    }
    let append = false
    if (status === 206) {
      const range = response.headers['content-range']
      const match = typeof range === 'string' ? /^bytes (\d+)-(\d+)\/(\d+)$/.exec(range) : null
      const start = match ? Number(match[1]) : NaN
      const end = match ? Number(match[2]) : NaN
      const total = match ? Number(match[3]) : NaN
      if (!offset || start !== offset || end < start || end - start + 1 !== length || total <= end || !Number.isSafeInteger(total)) {
        response.destroy()
        throw new Error('Invalid Content-Range')
      }
      this.total = total
      this.downloaded = offset
      append = true
    } else {
      // A server may ignore Range. Its 200 body is a complete replacement, never an append.
      this.total = length
      this.downloaded = 0
    }
    this.lastProgressAt = Date.now()
    this.lastProgressBytes = this.downloaded
    this.emit('response', response)
    const ws = fs.createWriteStream(partPath, { flags: append ? 'a' : 'w' })
    this.ws = ws
    response.on('data', (chunk: Buffer) => {
      this.downloaded += chunk.length
      this.report()
    })
    try {
      await pipeline(response, ws)
    } finally {
      this.ws = null
      this.requestInstance = null
    }
    if (this.stopped) return
    const actual = (await fs.promises.stat(partPath)).size
    if (actual !== this.total || this.downloaded !== this.total) throw new Error(`Incomplete download: ${actual}/${this.total}`)
    this.report(true)
    if (this.stopped) return
    if (this.options.verifyAudio) await this.verifyAudioContainer(partPath, finalPath)
    if (this.stopped) return
    await fs.promises.rename(partPath, finalPath)
    if (this.stopped) return
    this.status = STATUS.completed
    this.emit('completed')
  }

  async start() {
    if (this.finished) return this.finished
    this.stopped = false
    this.status = STATUS.init
    this.finished = (async () => {
      try {
        if (this.stopped) return
        this.status = STATUS.running
        this.emit('start')
        await this.transfer()
      } catch (err) {
        if (this.stopped) return
        this.status = STATUS.error
        this.emit('error', err)
      } finally {
        this.finished = null
      }
    })()
    return this.finished
  }

  async stop() {
    if (this.stopped || this.status === STATUS.completed) return
    this.stopped = true
    this.status = STATUS.stopped
    this.requestInstance?.destroy()
    this.ws?.destroy()
    await this.finished?.catch(() => {})
    this.emit('stop')
  }

  refreshUrl(url: string) { this.downloadUrl = url }
  updateSaveInfo(filePath: string, fileName: string) { this.chunkInfo.savePath = path.join(filePath, fileName) }
}

export default Task
