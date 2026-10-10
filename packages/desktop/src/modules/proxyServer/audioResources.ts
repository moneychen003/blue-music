import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

import { MEDIA_FILE_TYPES } from '@any-listen/common/constants'
import { request } from '@any-listen/nodejs/request'
import type { Readable } from 'node:stream'

type AudioResource = { kind: 'local'; filePath: string; expires: number } | { kind: 'remote'; url: string; expires: number }
const resources = new Map<string, AudioResource>()
const TOKEN_RX = /^[a-f0-9]{48}$/
const TTL = 6 * 60 * 60 * 1000
const LIMIT = 512
const MIME: Record<string, string> = {
  mp3: 'audio/mpeg', flac: 'audio/flac', ogg: 'audio/ogg', oga: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4',
}
let baseUrl = ''
let allowedDevOrigin = ''

export const initAudioResources = (host: string, devOrigin: string) => {
  baseUrl = `${host}/audio`
  allowedDevOrigin = devOrigin
}

const addResource = (resource: { kind: 'local'; filePath: string } | { kind: 'remote'; url: string }) => {
  if (!baseUrl) throw new Error('Audio proxy is not initialized')
  for (const [key, value] of resources) if (value.expires < Date.now()) resources.delete(key)
  while (resources.size >= LIMIT) {
    const oldest = resources.keys().next().value
    if (!oldest) break
    resources.delete(oldest)
  }
  const token = randomBytes(24).toString('hex')
  resources.set(token, { ...resource, expires: Date.now() + TTL })
  return `${baseUrl}/${token}`
}

export const registerLocalAudioFile = async (filePath: string) => {
  const realPath = await fsPromises.realpath(filePath)
  const stat = await fsPromises.stat(realPath)
  const ext = path.extname(realPath).slice(1).toLowerCase()
  if (!stat.isFile() || !MEDIA_FILE_TYPES.includes(ext as (typeof MEDIA_FILE_TYPES)[number])) throw new Error('Not a supported audio file')
  return addResource({ kind: 'local', filePath: realPath })
}

export const registerRemoteAudioUrl = (url: string) => {
  const parsed = new URL(url)
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) throw new Error('Invalid audio URL')
  return addResource({ kind: 'remote', url })
}

export const setRendererCorsHeaders = (req: IncomingMessage, res: ServerResponse) => {
  // file:// pages send Origin: null; the dev renderer has one pinned origin.
  // The opaque URL token is also required, so this is not an open LAN proxy.
  const origin = req.headers.origin
  if (origin === 'null' || origin === allowedDevOrigin) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Range')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')
}

const rejectRange = (res: ServerResponse, size: number) => {
  res.writeHead(416, { 'Content-Range': `bytes */${size}` })
  res.end()
}

const serveLocal = async (req: IncomingMessage, res: ServerResponse, filePath: string) => {
  let stat: fs.Stats
  try { stat = await fsPromises.stat(filePath) }
  catch { res.writeHead(404); res.end(); return }
  if (!stat.isFile() || stat.size <= 0) { res.writeHead(404); res.end(); return }
  let start = 0
  let end = stat.size - 1
  const range = req.headers.range
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (!match || (!match[1] && !match[2])) { rejectRange(res, stat.size); return }
    if (match[1]) {
      start = Number(match[1])
      if (match[2]) end = Number(match[2])
    } else {
      const suffix = Number(match[2])
      if (!Number.isSafeInteger(suffix) || suffix <= 0) { rejectRange(res, stat.size); return }
      start = Math.max(0, stat.size - suffix)
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= stat.size || end < start) { rejectRange(res, stat.size); return }
    end = Math.min(end, stat.size - 1)
  }
  const ext = path.extname(filePath).slice(1).toLowerCase()
  res.writeHead(range ? 206 : 200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Content-Length': end - start + 1,
    'Accept-Ranges': 'bytes',
    ...(range ? { 'Content-Range': `bytes ${start}-${end}/${stat.size}` } : {}),
  })
  if (req.method === 'HEAD') { res.end(); return }
  const stream = fs.createReadStream(filePath, { start, end })
  stream.on('error', () => res.destroy())
  res.on('close', () => stream.destroy())
  stream.pipe(res)
}

const serveRemote = async (req: IncomingMessage, res: ServerResponse, url: string) => {
  let upstream: Awaited<ReturnType<typeof request<Readable>>>
  try {
    upstream = await request<Readable>(url, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: req.headers.range ? { Range: req.headers.range } : undefined,
      needBody: true,
      timeout: 15000,
      retryNum: 0,
    })
  } catch { res.writeHead(502); res.end(); return }
  const headers: Record<string, string> = {}
  for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers[name]
    if (typeof value === 'string') headers[name] = value
  }
  res.writeHead(upstream.statusCode ?? 502, headers)
  if (req.method === 'HEAD') { upstream.body.destroy(); res.end(); return }
  upstream.body.on('error', () => res.destroy())
  res.on('close', () => upstream.body.destroy())
  upstream.body.pipe(res)
}

export const handleAudioResource = async (req: IncomingMessage, res: ServerResponse, pathname: string) => {
  const token = pathname.startsWith('/audio/') ? pathname.slice('/audio/'.length) : ''
  if (!TOKEN_RX.test(token)) { res.writeHead(404); res.end(); return }
  const resource = resources.get(token)
  if (!resource || resource.expires < Date.now()) { resources.delete(token); res.writeHead(404); res.end(); return }
  setRendererCorsHeaders(req, res)
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return }
  if (resource.kind === 'local') await serveLocal(req, res, resource.filePath)
  else await serveRemote(req, res, resource.url)
}
