export interface InitState {
  lists: Map<string, Promise<AnyListen.Resource.TagItem[]>>
}

export const sortsState: InitState = {
  lists: new Map(),
}
