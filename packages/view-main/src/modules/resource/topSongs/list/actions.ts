import { topSongs } from '@/shared/ipc/resource'

import { topSongsState } from './state'

export const buildSourceKey = (extId: string, source: string) => `${extId}.${source}`

export const resetTopSongs = (extId: string, source: string) => {
  const sourceKey = buildSourceKey(extId, source)
  let listInfo = topSongsState.lists.get(sourceKey)
  if (!listInfo) return
  topSongsState.lists.delete(sourceKey)
}
export const resetAllTopSongs = () => {
  topSongsState.lists.clear()
}

const getCachedListInfo = (extId: string, source: string): Promise<AnyListen.Resource.TopSongsItem[]> | null => {
  const listInfo = topSongsState.lists.get(buildSourceKey(extId, source))
  return listInfo ?? null
}
const setCachedListInfo = (extId: string, source: string, promise: Promise<AnyListen.Resource.TopSongsItem[]>) => {
  const sourceKey = buildSourceKey(extId, source)

  topSongsState.lists.set(
    sourceKey,
    promise.catch((error) => {
      topSongsState.lists.delete(sourceKey)
      console.log(error)
      throw error
    })
  )
}

export const getData = async (extensionId: string, source: string): Promise<AnyListen.Resource.TopSongsItem[]> => {
  console.log(extensionId, source)
  const cacheListInfo = getCachedListInfo(extensionId, source)
  if (cacheListInfo) return cacheListInfo

  const promise = topSongs({ extensionId, source }).then((result) => {
    console.log(result)
    return result
  })
  setCachedListInfo(extensionId, source, promise)
  return promise
}
