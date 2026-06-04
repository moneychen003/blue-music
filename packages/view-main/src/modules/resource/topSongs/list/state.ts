export interface InitState {
  lists: Map<string, Promise<AnyListen.Resource.TopSongsItem[]>>
}

export const topSongsState: InitState = {
  lists: new Map(),
}
