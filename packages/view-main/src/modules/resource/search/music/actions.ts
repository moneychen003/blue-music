import { musicSearch } from '@/shared/ipc/resource'

import { musicState } from './state'

const buildSourceKey = (extId: string, source: string) => `${extId}.${source}`
const buildSearchKey = (extId: string, source: string, limit: number, text: string) => {
  return `${extId}.${source}.${limit}.${text}`
}
const SEARCH_TIMEOUT_MS = 25_000
const withSearchTimeout = <T>(promise: Promise<T>) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('Search request timeout'))
    }, SEARCH_TIMEOUT_MS)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}
export const buildRequestKey = (extId: string, source: string, page: number, limit: number, text: string) => {
  return JSON.stringify({ extId, source, page, limit, text })
}
export const parseRequestKey = (params: string) => {
  try {
    return JSON.parse(params) as { extId: string; source: string; page: number; limit: number; text: string }
  } catch {
    return null
  }
}

export const resetListInfo = (extId: string, source: string) => {
  let listInfo = musicState.lists.get(buildSourceKey(extId, source))
  if (!listInfo) return
  listInfo.requestPromise = undefined
  listInfo.result = undefined
  listInfo.page = 0
  listInfo.total = 0
  listInfo.searchKey = null
  listInfo.requestKey = null
}
export const resetAllListInfo = () => {
  musicState.lists.forEach((listInfo) => {
    listInfo.requestPromise = undefined
    listInfo.result = undefined
    listInfo.page = 0
    listInfo.total = 0
    listInfo.searchKey = null
    listInfo.requestKey = null
  })
}

const getCachedListInfo = (
  extId: string,
  source: string,
  page: number,
  limit: number,
  text: string
): [Promise<AnyListen.IPCResource.MusicListResult> | null, number, AnyListen.IPCResource.MusicListResult | undefined] | null => {
  const listInfo = musicState.lists.get(buildSourceKey(extId, source))
  if (listInfo) {
    if (listInfo.requestKey == buildRequestKey(extId, source, page, limit, text)) {
      return [listInfo.requestPromise!, listInfo.total, listInfo.result]
    }
    if (listInfo.searchKey == buildSearchKey(extId, source, limit, text)) {
      return [null, listInfo.total, undefined]
    }
  }
  return null
}
const setCachedListInfo = (
  extId: string,
  source: string,
  page: number,
  limit: number,
  text: string,
  promise: Promise<AnyListen.IPCResource.MusicListResult>
) => {
  const sourceKey = buildSourceKey(extId, source)
  const searchKey = buildSearchKey(extId, source, limit, text)
  const requestKey = buildRequestKey(extId, source, page, limit, text)
  let listInfo = musicState.lists.get(sourceKey)
  if (!listInfo) {
    listInfo = {
      page: 0,
      total: 0,
      limit,
      searchKey: null,
      requestKey: null,
    }
    musicState.lists.set(sourceKey, listInfo)
  }
  listInfo.searchKey = searchKey
  listInfo.requestKey = requestKey
  listInfo.requestPromise = promise
    .then((result) => {
      const listInfo = musicState.lists.get(sourceKey)
      if (listInfo?.requestKey === requestKey) {
        listInfo.page = page
        listInfo.limit = limit
        listInfo.total = result.total
        listInfo.result = result
      }
      return result
    })
    .catch((error) => {
      const listInfo = musicState.lists.get(sourceKey)
      if (listInfo?.requestKey === requestKey) {
        listInfo.requestPromise = undefined
        listInfo.result = undefined
        listInfo.page = 0
        listInfo.total = 0
      }
      console.log(error)
      throw error
    })
}

export const search = (
  extensionId: string,
  source: string,
  name: string,
  artist: string,
  page: number,
  limit: number
): {
  promise: Promise<AnyListen.IPCResource.MusicListResult>
  total: number
  result?: AnyListen.IPCResource.MusicListResult
} => {
  console.log(extensionId, source, name, artist, page, limit)
  if (!name.trim().length) {
    return {
      promise: Promise.resolve({
        list: [],
        total: 0,
        limit,
        page,
      }),
      total: 0,
    }
  }
  const cacheListInfo = getCachedListInfo(extensionId, source, page, limit, name)
  if (cacheListInfo?.[0]) {
    return {
      promise: cacheListInfo[0],
      total: cacheListInfo[1],
      result: cacheListInfo[2],
    }
  }
  const promise = withSearchTimeout(
    musicSearch({
      extensionId,
      source,
      name,
      artist,
      limit,
      page,
    })
  ).then((result) => {
    console.log(result)
    return result
  })
  setCachedListInfo(extensionId, source, page, limit, name, promise)
  return {
    promise,
    total: cacheListInfo?.[1] ?? 0,
    result: cacheListInfo?.[2],
  }
}

export { findMusic } from '@/shared/ipc/resource'
