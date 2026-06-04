declare namespace AnyListen {
  namespace IPCDislikeList {
    interface ListInfo {
      lastSyncDate?: number
      snapshotKey: string
    }

    type ActionList =
      | IPCAction<'dislike_data_overwrite', AnyListen.Dislike.DislikeRules>
      | IPCAction<'dislike_music_add', AnyListen.Dislike.DislikeMusicInfo[]>
      | IPCAction<'dislike_music_clear'>

    type SyncMode =
      | 'merge_local_remote'
      | 'merge_remote_local'
      | 'overwrite_local_remote'
      | 'overwrite_remote_local'
      // | 'none'
      | 'cancel'

    type ServerActions = WarpPromiseRecord<{
      getDislikeInfo: () => AnyListen.Dislike.DislikeInfo
      dislikeAction: (action: AnyListen.IPCDislikeList.ActionList) => void
    }>
    type ServerIPCActions<Socket = undefined> = AnyListen.IPC.WarpIPCHandlerActions<Socket, ServerActions>

    type ClientActions = WarpPromiseRecord<{
      dislikeAction: (action: AnyListen.IPCDislikeList.ActionList) => void
    }>
    type ClientIPCActions<Socket = undefined> = AnyListen.IPC.WarpIPCHandlerActions<Socket, ClientActions>
  }
}
