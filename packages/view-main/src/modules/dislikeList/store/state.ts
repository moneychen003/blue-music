export interface InitState {
  names: Set<string>
  musicNames: Set<string>
  singerNames: Set<string>
  rules: AnyListen.Dislike.DislikeRules
  count: number
}

export const dislikeListState: InitState = {
  names: new Set(),
  musicNames: new Set(),
  singerNames: new Set(),
  rules: '',
  count: 0,
}
