import { MEDIA_FILE_TYPES } from '@any-listen/common/constants'

import { showNotify } from '@/components/apis/notify'
import {
  addListMusics,
  getListMusics,
  removeUserList as removeUserListRemote,
  setFetchingListStatus,
  syncUserList as syncUserListRemote,
  updateListMusicsPosition,
} from '@/modules/musicLibrary/store/actions'
import { settingState } from '@/modules/setting/store/state'
import { i18n } from '@/plugins/i18n'
import { filterFileName } from '@/shared'
import { showOpenDialog, showSaveDialog } from '@/shared/ipc/app'
import { addFolderMusics, exportPlaylistFile as exportPlaylistFileRemote, importPlaylistFile as importPlaylistFileRemote } from '@/shared/ipc/list'
import { createLocalMusicInfos } from '@/shared/ipc/music'

const handleAddMusics = async (listId: string, filePaths: string[], index = -1) => {
  // console.log(index + 1, index + 101)
  const paths = filePaths.slice(index + 1, index + 101)
  // TODO optimize: createLocalMusicInfos delay parseing music info, just get basic info first, then parse detail info when needed
  const musicInfos = await createLocalMusicInfos(paths)
  let failedCount = paths.length - musicInfos.length
  if (musicInfos.length) await addListMusics(listId, musicInfos)
  index += 100
  if (filePaths.length - 1 > index) {
    failedCount += await handleAddMusics(listId, filePaths, index)
  }
  return failedCount
}
const updateMusicPosition = async (listId: string, ids: string[]) => {
  const musicInfos = await getListMusics(listId, true)
  const musicIds = new Set(musicInfos.map((m) => m.id))
  ids = ids.filter((id) => musicIds.has(id))
  await updateListMusicsPosition({
    ids,
    listId,
    position: settingState.setting['list.addMusicLocationType'] === 'top' ? 0 : musicInfos.length - 1,
  })
}

export const importLocalFile = async (listInfo: AnyListen.List.MyListInfo) => {
  const { canceled, filePaths } = await showOpenDialog({
    title: i18n.t('user_list__select_local_file'),
    properties: ['openFile', 'multiSelections'],
    filters: [
      // https://support.google.com/chromebook/answer/183093
      // 3gp, .avi, .mov, .m4v, .m4a, .mp3, .mkv, .ogm, .ogg, .oga, .webm, .wav
      { name: 'Media File', extensions: [...MEDIA_FILE_TYPES] },
    ],
  })
  if (canceled || !filePaths.length) return
  console.log(filePaths)
  setFetchingListStatus(listInfo.id, true)
  const failedCount = await handleAddMusics(listInfo.id, filePaths)
  await updateMusicPosition(listInfo.id, filePaths)
  setFetchingListStatus(listInfo.id, false)
  const all = filePaths.length
  let message =
    failedCount == 0
      ? i18n.t('user_list__add_local_file_successfull', { num: all })
      : failedCount == all
        ? i18n.t('user_list__add_local_file_failed', { num: all })
        : i18n.t('user_list__add_local_file_success_part', { all, count: failedCount })
  showNotify(message)
}
export const importLocalFileFolder = async (listInfo: AnyListen.List.MyListInfo) => {
  const { canceled, filePaths } = await showOpenDialog({
    title: i18n.t('user_list__select_local_file_folder'),
    properties: ['openDirectory'],
    filters: [
      // https://support.google.com/chromebook/answer/183093
      // 3gp, .avi, .mov, .m4v, .m4a, .mp3, .mkv, .ogm, .ogg, .oga, .webm, .wav
      { name: 'Media File', extensions: [...MEDIA_FILE_TYPES] },
    ],
  })
  if (canceled || !filePaths.length) return
  setFetchingListStatus(listInfo.id, true)
  const taskId = await addFolderMusics(listInfo.id, filePaths, (message) => {
    switch (message) {
      case null:
        showNotify(i18n.t('user_list__add_local_file_folder_cancelled'))
        break
      case undefined:
        showNotify(i18n.t('user_list__add_local_file_folder_end'))
        break
      default:
        break
    }
    setFetchingListStatus(listInfo.id, false)
  })
  // setTimeout(() => {
  //   void cancelAddFolderMusics(taskId)
  // }, 1000)
  console.log(taskId)
}

export const importPlaylistFile = async (listInfo: AnyListen.List.MyListInfo) => {
  const { canceled, filePaths } = await showOpenDialog({
    title: i18n.t('user_list__select_playlist_file'),
    properties: ['openFile'],
    filters: [{ name: 'Playlist', extensions: ['csv', 'm3u', 'm3u8', 'json', 'lx'] }],
  })
  if (canceled || !filePaths.length) return
  setFetchingListStatus(listInfo.id, true)
  await importPlaylistFileRemote(listInfo.id, filePaths[0])
    .then((result) => {
      showNotify(
        i18n.t('user_list__import_playlist_success', {
          imported: result.imported,
          local: result.local,
          remote: result.remote,
          skipped: result.skipped,
          total: result.total,
        })
      )
    })
    .catch((err: Error) => {
      showNotify(i18n.t('user_list__import_playlist_failed', { err: err.message }))
      throw err
    })
    .finally(() => {
      setFetchingListStatus(listInfo.id, false)
    })
}

const exportExt = (format: AnyListen.IPCList.PlaylistFileFormat) => (format == 'lx' ? 'json' : format)

export const exportPlaylistFile = async (listInfo: AnyListen.List.MyListInfo, format: AnyListen.IPCList.PlaylistFileFormat) => {
  const fileName = `anylisten_${filterFileName(listInfo.name) || 'playlist'}.${exportExt(format)}`
  let options: AnyListen.IPCList.PlaylistExportOptions | null = null
  if (import.meta.env.VITE_IS_DESKTOP) {
    const result = await showSaveDialog({
      title: i18n.t('user_list__export_playlist_file'),
      defaultPath: fileName,
      filters: [{ name: 'Playlist', extensions: [exportExt(format)] }],
    })
    if (result.canceled || !result.filePath) return
    options = { listId: listInfo.id, listName: listInfo.name, format, filePath: result.filePath }
  } else {
    const result = await showOpenDialog({
      title: i18n.t('user_list__export_playlist_dir'),
      properties: ['openDirectory'],
    })
    if (result.canceled || !result.filePaths.length) return
    options = { listId: listInfo.id, listName: listInfo.name, format, dirPath: result.filePaths[0] }
  }
  await exportPlaylistFileRemote(options)
    .then((result) => {
      showNotify(i18n.t('user_list__export_playlist_success', { count: result.total, path: result.filePath }), 5, true)
    })
    .catch((err: Error) => {
      showNotify(i18n.t('user_list__export_playlist_failed', { err: err.message }))
      throw err
    })
}

export const syncUserList = async (listInfo: AnyListen.List.MyListInfo) => {
  setFetchingListStatus(listInfo.id, true)
  await syncUserListRemote(listInfo.id)
    .catch((e: Error) => {
      showNotify(i18n.t('user_list__sync_failed', { name: listInfo.name, err: e.message }))
      throw e
    })
    .finally(() => {
      setFetchingListStatus(listInfo.id, false)
    })
  showNotify(i18n.t('user_list__sync_successful', { name: listInfo.name }))
}

export const removeUserList = async (listInfo: AnyListen.List.MyListInfo) => {
  await removeUserListRemote([listInfo.id]).catch((e: Error) => {
    showNotify(i18n.t('user_list__remove_failed', { name: listInfo.name, err: e.message }))
  })
}

export { updateUserListPosition } from '@/modules/musicLibrary/store/actions'
