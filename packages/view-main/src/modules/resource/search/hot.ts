import { hotSearch } from '@/shared/ipc/resource'

export interface InitState {
  lists: Map<string, Promise<string[]>>
}

export const tagState: InitState = {
  lists: new Map(),
}

const buildSourceKey = (extId: string, source: string) => `${extId}.${source}`

export const reset = (extId: string, source: string) => {
  const sourceKey = buildSourceKey(extId, source)
  let listInfo = tagState.lists.get(sourceKey)
  if (!listInfo) return
  tagState.lists.delete(sourceKey)
}
export const resetAll = () => {
  tagState.lists.clear()
}

const getCachedListInfo = (extId: string, source: string): Promise<string[]> | null => {
  const listInfo = tagState.lists.get(buildSourceKey(extId, source))
  return listInfo ?? null
}
const setCachedListInfo = (extId: string, source: string, promise: Promise<string[]>) => {
  const sourceKey = buildSourceKey(extId, source)

  tagState.lists.set(
    sourceKey,
    promise.catch((error) => {
      tagState.lists.delete(sourceKey)
      console.log(error)
      throw error
    })
  )
}

export const getData = async (extensionId: string, source: string): Promise<string[]> => {
  console.log(extensionId, source)
  const cacheListInfo = getCachedListInfo(extensionId, source)
  if (cacheListInfo) return cacheListInfo

  const promise = hotSearch({ extensionId, source }).then((result) => {
    console.log(result)
    return result
  })
  setCachedListInfo(extensionId, source, promise)
  return promise
}
