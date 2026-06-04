import { topSongsDate } from '@/shared/ipc/resource'

import { dateState } from './state'

const buildSourceKey = (extId: string, source: string, id: string) => `${extId}.${source}.${id}`

export const resetSorts = (extId: string, source: string, id: string) => {
  const sourceKey = buildSourceKey(extId, source, id)
  let listInfo = dateState.lists.get(sourceKey)
  if (!listInfo) return
  dateState.lists.delete(sourceKey)
}
export const resetAllSorts = () => {
  dateState.lists.clear()
}

const getCachedListInfo = (extId: string, source: string, id: string): Promise<AnyListen.Resource.TagItem[]> | null => {
  const listInfo = dateState.lists.get(buildSourceKey(extId, source, id))
  return listInfo ?? null
}
const setCachedListInfo = (extId: string, source: string, id: string, promise: Promise<AnyListen.Resource.TagItem[]>) => {
  const sourceKey = buildSourceKey(extId, source, id)

  dateState.lists.set(
    sourceKey,
    promise.catch((error) => {
      dateState.lists.delete(sourceKey)
      console.log(error)
      throw error
    })
  )
}

export const getData = async (extensionId: string, source: string, id: string): Promise<AnyListen.Resource.TagItem[]> => {
  console.log(extensionId, source, id)
  const cacheListInfo = getCachedListInfo(extensionId, source, id)
  if (cacheListInfo) return cacheListInfo

  const promise = topSongsDate({ extensionId, source, id }).then((result) => {
    console.log(result)
    return result
  })
  setCachedListInfo(extensionId, source, id, promise)
  return promise
}
