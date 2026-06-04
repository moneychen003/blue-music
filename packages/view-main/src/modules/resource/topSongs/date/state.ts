export interface InitState {
  lists: Map<string, Promise<AnyListen.Resource.TagItem[]>>
}

export const dateState: InitState = {
  lists: new Map(),
}
