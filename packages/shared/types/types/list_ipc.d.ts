declare namespace AnyListen {
  namespace IPCList {
    type ListActionDataOverwrite = List.ListDataFull
    interface ListActionAdd {
      position: number
      listInfos: List.UserListInfo[]
    }
    type ListActionRemove = string[]
    interface ListActionUpdate {
      lists: List.MyListInfo[]
      /** 是否是同步操作导致的列表更新 */
      sync?: boolean
    }
    interface ListActionMove {
      /**
       * 目标列表id
       */
      id: List.ParentId
      /**
       * 列表id
       */
      ids: string[]
      /**
       * 位置
       */
      position: number
    }
    interface ListActionUpdatePosition {
      /**
       * 列表id
       */
      ids: string[]
      /**
       * 位置
       */
      position: number
    }
    interface ListActionUpdatePlayCount {
      id: string
      count?: number
    }
    // interface ListActionUpdatePlayTime {
    //   id: string
    //   name: string
    //   singer: string
    //   time: number
    // }

    interface ListActionMusicAdd {
      id: string
      musicInfos: Music.MusicInfo[]
      addMusicLocationType: AddMusicLocationType
    }

    interface ListActionMusicMove {
      fromId: string
      toId: string
      musicInfos: Music.MusicInfo[]
      addMusicLocationType: AddMusicLocationType
    }

    interface ListActionCheckMusicExistList {
      listId: string
      musicInfoId: string
    }

    interface ListActionMusicRemove {
      listId: string
      ids: string[]
      /** 是否是同步操作导致的歌曲移除 */
      sync?: boolean
    }

    type ListActionMusicUpdate = Array<{
      id: string
      musicInfo: Music.MusicInfo
    }>

    interface ListActionMusicUpdatePosition {
      listId: string
      position: number
      ids: string[]
    }

    interface ListActionMusicOverwrite {
      listId: string
      musicInfos: Music.MusicInfo[]
    }

    type ListActionMusicClear = string[]
    interface ListInfo {
      lastSyncDate?: number
      snapshotKey: string
    }
    type PlaylistFileFormat = 'csv' | 'm3u' | 'lx'
    interface PlaylistImportResult {
      total: number
      imported: number
      skipped: number
      local: number
      remote: number
    }
    interface PlaylistExportOptions {
      listId: string
      listName: string
      format: PlaylistFileFormat
      filePath?: string
      dirPath?: string
    }
    interface PlaylistExportResult {
      filePath: string
      total: number
    }

    type ActionList =
      | IPCAction<'list_data_overwrite', ListActionDataOverwrite>
      | IPCAction<'list_create', ListActionAdd>
      | IPCAction<'list_remove', ListActionRemove>
      | IPCAction<'list_update', ListActionUpdate>
      | IPCAction<'list_move', ListActionMove>
      | IPCAction<'list_update_position', ListActionUpdatePosition>
      // | IPCAction<'list_update_play_count', ListActionUpdatePlayCount>
      // | IPCAction<'list_update_play_time', ListActionUpdatePlayTime>
      | IPCAction<'list_music_add', ListActionMusicAdd>
      | IPCAction<'list_music_move', ListActionMusicMove>
      | IPCAction<'list_music_remove', ListActionMusicRemove>
      | IPCAction<'list_music_update', ListActionMusicUpdate>
      | IPCAction<'list_music_update_position', ListActionMusicUpdatePosition>
      | IPCAction<'list_music_overwrite', ListActionMusicOverwrite>
      | IPCAction<'list_music_clear', ListActionMusicClear>

    type ListData = List.ListDataFull
    type SyncMode =
      | 'merge_local_remote'
      | 'merge_remote_local'
      | 'overwrite_local_remote'
      | 'overwrite_remote_local'
      | 'overwrite_local_remote_full'
      | 'overwrite_remote_local_full'
      // | 'none'
      | 'cancel'

    type ServerActions = WarpPromiseRecord<{
      // importLocalFile: (listId: string) => void
      getAllUserLists: () => List.MyAllList
      getListCover: (listId: string) => string | undefined | null
      getListMusics: (listId: string) => Music.MusicInfo[]
      checkListExistMusic: (id: string, musicId: string) => boolean
      getMusicExistListIds: (id: string) => string[]
      listAction: (action: ActionList) => void
      /** 获取列表滚动位置 */
      getListScrollPosition: () => List.ListPositionInfo
      /** 保存列表滚动位置 */
      saveListScrollPosition: (id: string, position: number) => void
      addFolderMusics: (listId: string, filePaths: string[], onEnd: (errorMessage?: string | null) => void) => string
      cancelAddFolderMusics: (taskId: string) => void
      getDownloadList: () => Download.ListItem[]
      removeDownloadList: (ids: string[]) => void
      clearDownloadList: () => void
      /** 开始下载一首在线歌曲(仅 desktop 支持文件写入),返回任务 id */
      startDownload: (musicInfo: Music.MusicInfoOnline, quality: string) => string
      /** 暂停下载任务 */
      pauseDownload: (id: string) => void
      /** 继续(续传)下载任务 */
      resumeDownload: (id: string) => void
      /** 取消下载任务(停止+删半成品+移除) */
      cancelDownload: (id: string) => void
      /** 获取收藏的专辑/歌单列表 */
      getCollectedLists: () => List.CollectedListInfo[]
      /** 收藏一个专辑/歌单(仅存元数据引用),返回最新收藏列表 */
      collectResource: (info: List.CollectedListInfo) => List.CollectedListInfo[]
      /** 取消收藏,返回最新收藏列表 */
      uncollectResource: (id: string) => List.CollectedListInfo[]
      /** 检查是否已收藏 */
      checkCollected: (id: string) => boolean
      importPlaylistFile: (listId: string, filePath: string) => PlaylistImportResult
      exportPlaylistFile: (options: PlaylistExportOptions) => PlaylistExportResult
      syncUserList: (id: string) => Promise<void>
      parseMusicMetadata: (listId: string, musicInfo: Music.MusicInfo) => Promise<Music.MusicInfo | null>
      sortListMusics: (listId: string, list: Music.MusicInfo[], type: List.SortFileType) => Promise<string[]>
    }>
    type ServerIPCActions<Socket = undefined> = IPC.WarpIPCHandlerActions<Socket, ServerActions>

    type ClientActions = WarpPromiseRecord<{
      listAction: (action: ActionList) => void
    }>
    type ClientIPCActions<Socket = undefined> = IPC.WarpIPCHandlerActions<Socket, ClientActions>
  }
}
