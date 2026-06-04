<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { t } from '@/plugins/i18n'
  import Menu, { type MenuItem, type MenuList } from '@/components/base/Menu.svelte'
  import { LIST_IDS } from '@any-listen/common/constants'
  import { exportPlaylistFile, importLocalFile, importLocalFileFolder, importPlaylistFile, removeUserList, syncUserList } from './action'
  import { showListEditModal } from '@/components/apis/listEditModal'
  import { showOnlineSonglistImportModal } from '@/components/apis/onlineSonglistImportModal'
  import { musicLibraryEvent } from '@/modules/musicLibrary/store/event'
  import { appState } from '@/modules/app/store/state'
  import { GENERAL_LIST_TYPES } from '@/shared/constants'

  let {
    onhide,
  }: {
    onhide?: () => void
  } = $props()

  type MenuType =
    | 'create'
    | 'edit'
    | 'sort'
    | 'duplicate'
    | 'local_file'
    | 'local_file_folder'
    | 'update'
    | 'sourceDetail'
    | 'import'
    | 'import_online'
    | 'export_csv'
    | 'export_m3u'
    | 'export_lx'
    | 'remove'
  let menuVisible = $state.raw(false)
  let menuLocation = $state.raw({ x: 0, y: 0 })
  let menus = $state.raw<MenuList<MenuType>>([])
  let info: AnyListen.List.MyListInfo | null
  let fetching = false

  const setMenu = () => {
    if (!info) {
      menus = [{ action: 'create', label: $t('user_list_menu__create') }]
      return
    }
    let edit = false
    // let update = false
    let remove = false
    // let local_file = !listState.fetchingListStatus[listInfo.id]
    // let userList: AnyListen.List.UserListInfo
    switch (info.id) {
      case LIST_IDS.DEFAULT:
      case LIST_IDS.LOVE:
        break
      default:
        // userList = info as AnyListen.List.UserListInfo
        edit = true
        remove = true
        break
    }

    const disabledUpdate = fetching || (info.type == 'local' && info.meta.deviceId != appState.machineId)
    const isGeneral = GENERAL_LIST_TYPES.includes(info.type)

    menus = (
      [
        !isGeneral && { action: 'update', disabled: disabledUpdate, label: $t('user_list_menu__sync') },
        { action: 'create', label: $t('user_list_menu__create') },
        { action: 'edit', disabled: !edit, label: $t('user_list_menu__edit') },
        isGeneral && { action: 'local_file', disabled: fetching, label: $t('user_list_menu__select_local_file') },
        isGeneral && { action: 'local_file_folder', disabled: fetching, label: $t('user_list_menu__select_local_file_folder') },
        // null,
        // { action: 'sort', label: $t('user_list_menu__sort_list') },
        // { action: 'duplicate', label: $t('user_list_menu__duplicate') },
        // { action: 'sourceDetail', label: $t('user_list_menu__source_detail') },
        isGeneral && { action: 'import_online', disabled: fetching, label: $t('user_list_menu__import_online') },
        isGeneral && { action: 'import', disabled: fetching, label: $t('user_list_menu__import') },
        { action: 'export_csv', disabled: fetching, label: $t('user_list_menu__export_csv') },
        { action: 'export_m3u', disabled: fetching, label: $t('user_list_menu__export_m3u') },
        { action: 'export_lx', disabled: fetching, label: $t('user_list_menu__export_lx') },
        null,
        { action: 'remove', disabled: !remove || fetching, label: $t('user_list_menu__remove') },
      ] satisfies Array<MenuList<MenuType>[number] | false>
    ).filter((m) => m !== false)
  }

  export const show = async (selectInfo: AnyListen.List.MyListInfo | null, position: { x: number; y: number }) => {
    info = selectInfo
    menuLocation = position
    setMenu()
    await tick()
    menuVisible = true
  }

  const handleClick = (menu: MenuItem<MenuType>) => {
    switch (menu.action) {
      case 'create':
        void showListEditModal(info?.id)
        break
      case 'edit':
        void showListEditModal(info!.id, true)
        break
      case 'local_file':
        void importLocalFile(info!)
        break
      case 'local_file_folder':
        void importLocalFileFolder(info!)
        break
      case 'update':
        void syncUserList(info!)
        break
      case 'import':
        void importPlaylistFile(info!)
        break
      case 'import_online':
        void showOnlineSonglistImportModal(info!)
        break
      case 'export_csv':
        void exportPlaylistFile(info!, 'csv')
        break
      case 'export_m3u':
        void exportPlaylistFile(info!, 'm3u')
        break
      case 'export_lx':
        void exportPlaylistFile(info!, 'lx')
        break
      case 'remove':
        void removeUserList(info!)
        break

      default:
        break
    }
    menuVisible = false
  }

  onMount(() => {
    const unsub = musicLibraryEvent.on('fetchingListStatusUpdated', (_id, status) => {
      if (info?.id != _id) return
      fetching = status
      setMenu()
    })

    return () => {
      unsub()
    }
  })
</script>

<Menu bind:visible={menuVisible} {menus} location={menuLocation} onclick={handleClick} {onhide} />
