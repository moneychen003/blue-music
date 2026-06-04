declare namespace AnyListen {
  namespace IPCResource {
    interface MusicListResult {
      list: Music.MusicInfoOnline[]
      total: number
      limit: number
      page: number
    }
    interface SonglistListResult {
      list: Resource.SongListItem[]
      total: number
      limit: number
      page: number
    }
    interface MusicCommentResult {
      list: Resource.MusicCommentItem[]
      total: number
      limit: number
      page: number
    }
    interface SonglistDetailResult {
      list: Music.MusicInfoOnline[]
      total: number
      limit: number
      page: number
      info: Resource.SongListDetailInfo
    }
    interface TopSongsDetailResult {
      list: Music.MusicInfoOnline[]
      total: number
      limit: number
      page: number
      info: Resource.TopSongsDetailInfo
    }

    interface SourceItem extends Extension.ResourceItem {
      sId: string
    }

    interface FindMusicParams extends IPCExtension.CommonParams {
      name: string
      artist?: string
      albumName?: string
      interval?: number | string | null
      strict?: boolean
    }

    type ServerActions = WarpPromiseRecord<{
      tipSearch: (params: IPCExtension.TipSearchParams) => Promise<string[]>
      hotSearch: (params: IPCExtension.CommonParams) => Promise<string[]>
      musicSearch: (params: IPCExtension.MusicSearchParams) => Promise<MusicListResult>
      musicPicSearch: (params: IPCExtension.PicSearchParams) => Promise<string[]>
      lyricSearch: (params: IPCExtension.LyricSearchParams) => Promise<IPCExtension.LyricSearchResult[]>
      lyricDetail: (params: IPCExtension.LyricDetailParams) => Promise<Music.LyricInfo>
      songlistSearch: (params: IPCExtension.CommonSearchParams) => Promise<SonglistListResult>
      songlistSorts: (params: IPCExtension.CommonParams) => Promise<Resource.TagItem[]>
      songlistTags: (params: IPCExtension.CommonParams) => Promise<IPCExtension.SonglistTagResult>
      songlist: (params: IPCExtension.SonglistListParams) => Promise<SonglistListResult>
      songlistDetail: (params: IPCExtension.ListDetailParams) => Promise<SonglistDetailResult>
      topSongs: (params: IPCExtension.CommonParams) => Promise<Resource.TopSongsItem[]>
      topSongsDate: (params: IPCExtension.TopSongsDateParams) => Promise<Resource.TagItem[]>
      topSongsDetail: (params: IPCExtension.TopSongsDetailParams) => Promise<TopSongsDetailResult>
      findMusic: (params: FindMusicParams) => Promise<Music.MusicInfoOnline | null>
      musicComment: (params: IPCExtension.MusicCommentParams) => Promise<MusicCommentResult>
    }>
    type ServerIPCActions<Socket = undefined> = IPC.WarpIPCHandlerActions<Socket, ServerActions>
  }
}
