import { get, writable } from 'svelte/store'

import {
  getCollectedLists,
  collectResource as ipcCollectResource,
  uncollectResource as ipcUncollectResource,
} from '@/shared/ipc/list'

export const collectedLists = writable<AnyListen.List.CollectedListInfo[]>([])

let inited = false

/** 拼装稳定的收藏 id:类型+源+原资源 id */
export const buildCollectId = (type: AnyListen.List.CollectedType, source: string, syncId: string) => {
  return `${type}__${source}__${syncId}`
}

export const initCollectedLists = async () => {
  if (inited) return
  inited = true
  try {
    collectedLists.set(await getCollectedLists())
  } catch {
    inited = false
  }
}

export const refreshCollectedLists = async () => {
  collectedLists.set(await getCollectedLists())
}

export const collectResource = async (info: AnyListen.List.CollectedListInfo) => {
  collectedLists.set(await ipcCollectResource(info))
}

export const uncollectResource = async (id: string) => {
  collectedLists.set(await ipcUncollectResource(id))
}

export const isCollected = (id: string) => {
  return get(collectedLists).some((i) => i.id === id)
}
