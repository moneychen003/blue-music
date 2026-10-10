import { cancelMusicSearch, musicSearch } from '@/shared/ipc/resource'
import { musicState, type ListInfo } from './state'

const CACHE_LIMIT = 40
const CACHE_TTL_MS = 5 * 60_000
const SEARCH_TIMEOUT_MS = 25_000
const sourceKey = (extensionId: string, source: string) => JSON.stringify({ extensionId, source })
let activeRequest: { id: string; key: string } | null = null
const cancel = (id?: string) => { if (id) void cancelMusicSearch(id).catch(() => {}) }
export const buildRequestKey = (extId: string, source: string, page: number, limit: number, text: string) => JSON.stringify({ extId, source, page, limit, text })
export const parseRequestKey = (params: string) => {
  try { return JSON.parse(params) as { extId: string; source: string; page: number; limit: number; text: string } }
  catch { return null }
}
export const resetListInfo = (extId: string, source: string) => {
  const key = sourceKey(extId, source)
  cancel(musicState.lists.get(key)?.requestId)
  musicState.lists.delete(key)
}
export const resetAllListInfo = () => {
  for (const info of musicState.lists.values()) cancel(info.requestId)
  musicState.lists.clear()
}
export const search = (extensionId: string, source: string, name: string, artist: string, page: number, limit: number): {
  promise: Promise<AnyListen.IPCResource.MusicListResult>; total: number; result?: AnyListen.IPCResource.MusicListResult
} => {
  const key = sourceKey(extensionId, source)
  const requestKey = JSON.stringify({ extensionId, source, name, artist, page, limit })
  if (activeRequest && activeRequest.key !== requestKey) cancel(activeRequest.id)
  if (!name.trim()) return { promise: Promise.resolve({ list: [], total: 0, limit, page }), total: 0 }
  const cached = musicState.lists.get(key)
  if (cached?.requestKey === requestKey && cached.requestPromise && Date.now() - (cached.updatedAt ?? 0) < CACHE_TTL_MS) {
    musicState.lists.delete(key); musicState.lists.set(key, cached)
    return { promise: cached.requestPromise, total: cached.total, result: cached.result }
  }
  cancel(cached?.requestId)
  const requestId = crypto.randomUUID()
  activeRequest = { id: requestId, key: requestKey }
  const info: ListInfo = { page, limit, total: 0, requestKey, searchKey: requestKey, requestId, updatedAt: Date.now() }
  musicState.lists.delete(key); musicState.lists.set(key, info)
  while (musicState.lists.size > CACHE_LIMIT) {
    const oldest = musicState.lists.keys().next().value
    if (!oldest) break
    cancel(musicState.lists.get(oldest)?.requestId)
    musicState.lists.delete(oldest)
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => { cancel(requestId); reject(new Error('搜索超时，请换源或重试')) }, SEARCH_TIMEOUT_MS)
  })
  const promise = Promise.race([musicSearch({ extensionId, source, name, artist, page, limit, requestId }), timeout])
    .then((result) => {
      if (musicState.lists.get(key) === info) {
        info.result = result; info.total = result.total; info.page = result.page; info.updatedAt = Date.now()
      }
      return result
    }).catch((error: unknown) => {
      if (musicState.lists.get(key) === info) musicState.lists.delete(key)
      throw error
    }).finally(() => {
      clearTimeout(timer)
      info.requestId = undefined
      if (activeRequest?.id === requestId) activeRequest = null
    })
  info.requestPromise = promise
  return { promise, total: 0 }
}
export { findMusic } from '@/shared/ipc/resource'
