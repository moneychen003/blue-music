import { songlistSorts } from '@/shared/ipc/resource'

import { sortsState } from './state'

const buildSourceKey = (extId: string, source: string) => `${extId}.${source}`

export const resetSorts = (extId: string, source: string) => {
  const sourceKey = buildSourceKey(extId, source)
  let listInfo = sortsState.lists.get(sourceKey)
  if (!listInfo) return
  sortsState.lists.delete(sourceKey)
}
export const resetAllSorts = () => {
  sortsState.lists.clear()
}

const getCachedListInfo = (extId: string, source: string): Promise<AnyListen.Resource.TagItem[]> | null => {
  const listInfo = sortsState.lists.get(buildSourceKey(extId, source))
  return listInfo ?? null
}
const setCachedListInfo = (extId: string, source: string, promise: Promise<AnyListen.Resource.TagItem[]>) => {
  const sourceKey = buildSourceKey(extId, source)

  sortsState.lists.set(
    sourceKey,
    promise.catch((error) => {
      sortsState.lists.delete(sourceKey)
      console.log(error)
      throw error
    })
  )
}

export const getData = async (extensionId: string, source: string): Promise<AnyListen.Resource.TagItem[]> => {
  console.log(extensionId, source)
  const cacheListInfo = getCachedListInfo(extensionId, source)
  if (cacheListInfo) return cacheListInfo

  const promise = songlistSorts({ extensionId, source }).then((result) => {
    console.log(result)
    return result
  })
  setCachedListInfo(extensionId, source, promise)
  return promise
}
