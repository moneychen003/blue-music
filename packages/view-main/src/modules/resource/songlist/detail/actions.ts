import { deduplicationList } from '@any-listen/common/tools'

import { songlistDetail } from '@/shared/ipc/resource'

import { musicState } from './state'

const buildSourceKey = (extId: string, source: string) => `${extId}.${source}`
const buildSearchKey = (extId: string, source: string, limit: number, id: string) => {
  return `${extId}.${source}.${limit}.${id}`
}
export const buildRequestKey = (extId: string, source: string, page: number, limit: number, id: string) => {
  return `${extId}.${source}.${page}.${limit}.${id}`
}

export const resetListInfo = (extId: string, source: string) => {
  let listInfo = musicState.lists.get(buildSourceKey(extId, source))
  if (!listInfo) return
  listInfo.requestPromise = undefined
  listInfo.page = 0
  listInfo.total = 0
  listInfo.searchKey = null
  listInfo.requestKey = null
  listInfo.info = null
}
export const resetAllListInfo = () => {
  musicState.lists.forEach((listInfo) => {
    listInfo.requestPromise = undefined
    listInfo.page = 0
    listInfo.total = 0
    listInfo.searchKey = null
    listInfo.requestKey = null
    listInfo.info = null
  })
}

const getCachedListInfo = (
  extId: string,
  source: string,
  page: number,
  limit: number,
  id: string
): [Promise<AnyListen.IPCResource.SonglistDetailResult> | null, number, AnyListen.Resource.SongListDetailInfo | null] | null => {
  const listInfo = musicState.lists.get(buildSourceKey(extId, source))
  if (listInfo) {
    if (listInfo.requestKey == buildRequestKey(extId, source, page, limit, id)) {
      return [listInfo.requestPromise!, listInfo.total, listInfo.info]
    }
    if (listInfo.searchKey == buildSearchKey(extId, source, limit, id)) {
      return [null, listInfo.total, listInfo.info]
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
  promise: Promise<AnyListen.IPCResource.SonglistDetailResult>
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
      requestPromise: undefined,
      info: null,
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
        listInfo.info = result.info
      }
      return result
    })
    .catch((error) => {
      const listInfo = musicState.lists.get(sourceKey)
      if (listInfo?.requestKey === requestKey) {
        listInfo.requestPromise = undefined
        listInfo.page = 0
        listInfo.total = 0
      }
      console.log(error)
      throw error
    })
}

export const detail = (
  extensionId: string,
  source: string,
  id: string,
  page: number,
  limit: number
): {
  promise: Promise<AnyListen.IPCResource.SonglistDetailResult>
  total: number
  info: AnyListen.Resource.SongListDetailInfo | null
} => {
  console.log(extensionId, source, id, page, limit)
  if (!id.trim().length) {
    return {
      promise: Promise.resolve({
        list: [],
        total: 0,
        info: {
          name: '',
        },
        limit,
        page,
      }),
      total: 0,
      info: null,
    }
  }
  const cacheListInfo = getCachedListInfo(extensionId, source, page, limit, id)
  if (cacheListInfo?.[0]) {
    return {
      promise: cacheListInfo[0],
      total: cacheListInfo[1],
      info: cacheListInfo[2],
    }
  }
  const promise = songlistDetail({
    extensionId,
    source,
    id,
    limit,
    page,
  }).then((result) => {
    console.log(result)
    return result
  })
  setCachedListInfo(extensionId, source, page, limit, id, promise)
  return {
    promise,
    total: cacheListInfo?.[1] ?? 0,
    info: cacheListInfo?.[2] ?? null,
  }
}

export const songlistDetailAll = async (
  extensionId: string,
  source: string,
  id: string
): Promise<AnyListen.Music.MusicInfoOnline[]> => {
  let limit = 10000
  const loadData = async (page: number): Promise<AnyListen.IPCResource.SonglistDetailResult> => {
    return songlistDetail({
      extensionId,
      source,
      id,
      limit,
      page,
    }).then((result) => {
      console.log(result)
      return result
    })
  }

  return loadData(1)
    .then(async (result) => {
      if (result.total <= result.limit) return result.list
      limit = result.limit

      const list = [...result.list]
      const maxPage = Math.ceil(result.total / limit)
      let page = 1
      while (++page <= maxPage) {
        const res = await loadData(page)
        list.push(...res.list)
      }
      return list
    })
    .then((list) => deduplicationList(list))
}

export const songlistDetailAllWithInfo = async (
  extensionId: string,
  source: string,
  id: string
): Promise<{ list: AnyListen.Music.MusicInfoOnline[]; info: AnyListen.Resource.SongListDetailInfo | null }> => {
  let limit = 10000
  const loadData = async (page: number): Promise<AnyListen.IPCResource.SonglistDetailResult> => {
    return songlistDetail({
      extensionId,
      source,
      id,
      limit,
      page,
    }).then((result) => {
      console.log(result)
      return result
    })
  }

  const firstResult = await loadData(1)
  const info = firstResult.info ?? null

  let list: AnyListen.Music.MusicInfoOnline[]
  if (firstResult.total <= firstResult.limit) {
    list = firstResult.list
  } else {
    limit = firstResult.limit

    list = [...firstResult.list]
    const maxPage = Math.ceil(firstResult.total / limit)
    let page = 1
    while (++page <= maxPage) {
      const res = await loadData(page)
      list.push(...res.list)
    }
  }

  return { list: deduplicationList(list), info }
}
