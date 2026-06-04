/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { deduplicationList } from '@any-listen/common/tools'

import { services } from '../resources/shared'

export const songlistSorts = async ({
  extensionId,
  source,
}: {
  extensionId: string
  source: string
}): Promise<AnyListen.Resource.TagItem[]> => {
  return services.extensionSerive
    .resourceAction('songlistSorts', {
      extensionId,
      source,
    })
    .then((result) => {
      // console.log(result)
      return result ?? []
    })
}

export const songlistTags = async ({
  extensionId,
  source,
}: {
  extensionId: string
  source: string
}): Promise<AnyListen.IPCExtension.SonglistTagResult> => {
  return services.extensionSerive
    .resourceAction('songlistTags', {
      extensionId,
      source,
    })
    .then((result) => {
      // console.log(result)
      return {
        tags: result.tags ?? [],
        hotTags: result.hotTags ?? [],
      }
    })
}

export const songlist = async ({
  extensionId,
  source,
  sort,
  tag,
  page,
  limit,
}: {
  extensionId: string
  source: string
  sort: string
  tag: string
  page: number
  limit?: number
}): Promise<AnyListen.IPCResource.SonglistListResult> => {
  return services.extensionSerive
    .resourceAction('songlist', {
      extensionId,
      source,
      limit,
      page,
      sort,
      tag,
    })
    .then((result) => {
      // console.log(result)
      return {
        list: result.list ?? [],
        total: result.total,
        limit: result.limit ?? 30,
        page: result.page ?? 1,
      }
    })
}

export const songlistSearch = async ({
  extensionId,
  source,
  keyword,
  page,
  limit,
}: {
  extensionId: string
  source: string
  keyword: string
  page: number
  limit?: number
}): Promise<AnyListen.IPCResource.SonglistListResult> => {
  // console.log(extensionId, source, artist, page, limit)
  if (!keyword.trim().length) {
    return {
      list: [],
      total: 0,
      limit: limit ?? 30,
      page: page ?? 1,
    }
  }
  return services.extensionSerive
    .resourceAction('songlistSearch', {
      extensionId,
      source,
      keyword,
      limit,
      page,
    })
    .then((result) => {
      // console.log(result)
      return {
        list: result.list ?? [],
        total: result.total,
        limit: result.limit ?? 30,
        page: result.page ?? 1,
      }
    })
}

export const songlistDetail = async ({
  extensionId,
  source,
  id,
  page,
  limit,
}: {
  extensionId: string
  source: string
  id: string
  page: number
  limit?: number
}): Promise<AnyListen.IPCResource.SonglistDetailResult> => {
  return services.extensionSerive
    .resourceAction('songlistDetail', {
      extensionId,
      source,
      id,
      limit,
      page,
    })
    .then((result) => {
      // console.log(result)
      return {
        list: result.list ?? [],
        total: result.total,
        info: result.info,
        limit: result.limit ?? 30,
        page: result.page ?? 1,
      }
    })
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
