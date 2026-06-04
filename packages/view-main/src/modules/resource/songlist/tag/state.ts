export interface InitState {
  lists: Map<string, Promise<AnyListen.IPCExtension.SonglistTagResult>>
}

export const tagsState: InitState = {
  lists: new Map(),
}
