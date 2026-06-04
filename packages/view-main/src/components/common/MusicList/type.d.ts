export interface MenuSelectInfo {
  listId: string
  musicInfo: AnyListen.Music.MusicInfo
  selectedList: AnyListen.Music.MusicInfo[]
  onRemoveAllSelected: () => void
}

export interface ListInfo {
  id: string
  name: string
  pic?: string
  desc?: string
  playCount?: number
  createTime?: string
  picIcon?: string
  saveable?: boolean
  /** 是否显示"收藏"按钮(在线专辑/歌单) */
  collectible?: boolean
  /** 当前是否已收藏 */
  collected?: boolean
  listMeta?: {
    extensionId: string
    source: string
    [key: string]: unknown
  }
  getSortTimeFn?: () => ((list: AnyListen.Music.MusicInfo[], type: AnyListen.List.SortFileType) => Promise<string[]>) | null
}
