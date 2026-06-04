/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { deduplicationList } from '@any-listen/common/tools'

import { services } from '../resources/shared'

export const topSongsDate = async ({
  extensionId,
  source,
  id,
}: {
  extensionId: string
  source: string
  id: string
}): Promise<AnyListen.Resource.TagItem[]> => {
  return services.extensionSerive
    .resourceAction('topSongsDate', {
      extensionId,
      source,
      id,
    })
    .then((result) => {
      // console.log(result)
      return result ?? []
    })
}

export const topSongs = async ({
  extensionId,
  source,
}: {
  extensionId: string
  source: string
}): Promise<AnyListen.Resource.TopSongsItem[]> => {
  return services.extensionSerive
    .resourceAction('topSongs', {
      extensionId,
      source,
    })
    .then((result) => {
      // console.log(result)
      return result ?? []
    })
}

export const topSongsDetail = async ({
  extensionId,
  source,
  id,
  date,
  page,
  limit,
}: {
  extensionId: string
  source: string
  id: string
  date: string
  page: number
  limit?: number
}): Promise<AnyListen.IPCResource.TopSongsDetailResult> => {
  return services.extensionSerive
    .resourceAction('topSongsDetail', {
      extensionId,
      source,
      id,
      date,
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
        info: result.info,
      }
    })
}

export const topSongsDetailAll = async (
  extensionId: string,
  source: string,
  id: string,
  date: string
): Promise<AnyListen.Music.MusicInfoOnline[]> => {
  let limit = 10000
  const loadData = async (page: number): Promise<AnyListen.IPCResource.MusicListResult> => {
    return topSongsDetail({
      extensionId,
      source,
      id,
      date,
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
