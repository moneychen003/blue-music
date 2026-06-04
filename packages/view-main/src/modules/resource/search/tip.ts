import { extensionState } from '@/modules/extension/store/state'
import { settingState } from '@/modules/setting/store/state'
import { tipSearch as tipSearchRemote } from '@/shared/ipc/resource'

const cache = {
  keys: [] as string[],
  lists: new Map<string, Promise<string[]>>(),
}
const buildSourceKey = (extId: string, source: string, keyword: string) => `${extId}.${source}.${keyword}`

export const reset = (extId: string, source: string, keyword: string) => {
  const sourceKey = buildSourceKey(extId, source, keyword)
  let listInfo = cache.lists.get(sourceKey)
  if (!listInfo) return
  cache.lists.delete(sourceKey)
}
export const resetAll = () => {
  cache.lists.clear()
}

const getCachedListInfo = (extId: string, source: string, keyword: string): Promise<string[]> | null => {
  const listInfo = cache.lists.get(buildSourceKey(extId, source, keyword))
  return listInfo ?? null
}
const setCachedListInfo = (extId: string, source: string, keyword: string, promise: Promise<string[]>) => {
  const sourceKey = buildSourceKey(extId, source, keyword)

  cache.lists.set(
    sourceKey,
    promise
      .then((res) => {
        if (cache.keys.length > 20) {
          const deleteKey = cache.keys.shift()!
          cache.lists.delete(deleteKey)
        }
        return res
      })
      .catch((error) => {
        cache.lists.delete(sourceKey)
        const index = cache.keys.indexOf(sourceKey)
        if (index !== -1) {
          cache.keys.splice(index, 1)
        }
        console.log(error)
        throw error
      })
  )
  cache.keys.push(sourceKey)
}

const getSource = () => {
  const list = extensionState.resourceList.resources.tipSearch ?? []
  if (!list.length) return null
  return (
    (settingState.setting['onlineResource.tipSearchSource'] &&
      list.find((item) => item.id === settingState.setting['onlineResource.tipSearchSource'])) ||
    list[0]
  )
}
export const getData = async (extensionId: string, source: string, keyword: string): Promise<string[]> => {
  const cacheListInfo = getCachedListInfo(extensionId, source, keyword)
  if (cacheListInfo) return cacheListInfo

  const promise = tipSearchRemote({ extensionId, source, keyword }).then((result) => {
    return result
  })
  setCachedListInfo(extensionId, source, keyword, promise)
  return promise
}

export const tipSearch = async (keyword: string) => {
  const source = getSource()
  if (!source) return []
  return getData(source.extensionId, source.id, keyword)
}
