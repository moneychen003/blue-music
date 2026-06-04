export interface ListInfo {
  requestPromise?: Promise<AnyListen.IPCResource.SonglistListResult>
  total: number
  page: number
  limit: number
  searchKey: string | null
  requestKey: string | null
}
export interface InitState {
  lists: Map<string, ListInfo>
}

export const musicState: InitState = {
  lists: new Map(),
}
