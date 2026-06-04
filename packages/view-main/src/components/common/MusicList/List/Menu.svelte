<script lang="ts">
  import { tick } from 'svelte'
  import { t } from '@/plugins/i18n'
  import Menu, { type MenuList } from '@/components/base/Menu.svelte'
  import { copyName, dislikeMusic, locateMusic, playMusicLater, removeMusic } from './action'
  import { hasDislike } from '@/modules/dislikeList/store/actions'
  import type { MenuSelectInfo } from '../type'
  import { showMusicAddModal } from '@/components/apis/musicAddModal'
  import { addListMusics } from '@/modules/musicLibrary/actions'
  import { LIST_IDS } from '@any-listen/common/constants'
  import { startDownload } from '@/shared/ipc/list'
  import { settingState } from '@/modules/setting/store/state'
  import { showNotify } from '@/components/apis/notify'
  import { getMusicUrl } from '@/modules/player/store/playerRemoteAction'
  let {
    source,
    onplay,
    onhide,
  }: {
    source: AnyListen.Player.SourceType
    onplay: (musicInfo: AnyListen.Music.MusicInfo) => Promise<void>
    onhide?: () => void
  } = $props()

  type MenuType =
    | 'play'
    | 'collect'
    | 'download'
    | 'playLater'
    | 'addTo'
    | 'moveTo'
    | 'detail'
    | 'sort'
    | 'toggleSource'
    | 'copyName'
    | 'sourceDetail'
    | 'search'
    | 'locate'
    | 'dislike'
    | 'remove'
  let menuVisible = $state.raw(false)
  let menuLocation = $state.raw({ x: 0, y: 0 })
  let menus = $state.raw<MenuList<MenuType>>([])
  let selectInfo: MenuSelectInfo

  const setMenu = () => {
    // let sourceDetail = !!musicSdk[musicInfo.source]?.getMusicDetailPageUrl
    // let download = assertApiSupport(musicInfo.source) && musicInfo.source != 'local'
    let dislike = hasDislike(selectInfo.musicInfo)
    const local = source === 'local'
    const newMenu: Array<MenuList<MenuType>[number] | false> = [
      { action: 'play', label: $t('user_list_music_menu__play') },
      { action: 'playLater', label: $t('user_list_music_menu__play_later') },
      !selectInfo.musicInfo.isLocal && { action: 'download', label: $t('user_list_music_menu__download') },
      selectInfo.listId != LIST_IDS.LOVE && { action: 'collect', label: '收藏到我喜欢' },
      { action: 'addTo', label: $t('user_list_music_menu__add_to') },
      local && { action: 'moveTo', label: $t('user_list_music_menu__move_to') },
      // { action: 'sort', label: $t('user_list_music_menu__sort') },
      null,
      { action: 'copyName', label: $t('user_list_music_menu__copy_name') },
      // { action: 'detail', label: $t('user_list_music_menu__detail') },
      null,
      { action: 'dislike', disabled: dislike, label: $t('user_list_music_menu__dislike') },
      local && { action: 'remove', label: $t('user_list_music_menu__remove') },
    ]
    if (import.meta.env.VITE_IS_DESKTOP) {
      if (selectInfo.musicInfo.isLocal) {
        newMenu.splice(6, 0, { action: 'locate', label: $t('user_list_music_menu__locate') })
      }
    }
    menus = newMenu.filter((m) => m !== false) as MenuList<MenuType>
  }

  export const show = async (_selectInfo: MenuSelectInfo, position: { x: number; y: number }) => {
    selectInfo = _selectInfo
    menuLocation = position
    setMenu()
    await tick()
    menuVisible = true
  }

  const handleDownload = async () => {
    const targets = (selectInfo.selectedList.length ? selectInfo.selectedList : [selectInfo.musicInfo]).filter(
      (m) => !m.isLocal
    ) as AnyListen.Music.MusicInfoOnline[]
    if (!targets.length) return
    const quality = settingState.setting['download.quality']
    try {
      for (const m of targets) await startDownload(m, quality)
      showNotify(`已加入下载(${targets.length})`)
    } catch (err) {
      showNotify((err as Error).message)
    }
  }

  // Web 端没有下载管理器,改为通过浏览器直接下载:
  // 播放 URL 由服务端同源代理(/api/p_static/xxx.mp3),所以 <a download> 能可靠触发下载。
  const triggerBrowserDownload = (url: string, fileName: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  const sanitizeFileName = (name: string) => name.replace(/[\\/:*?"<>|\n\r\t]/g, '_').slice(0, 120)
  const handleBrowserDownload = async () => {
    const targets = (selectInfo.selectedList.length ? selectInfo.selectedList : [selectInfo.musicInfo]).filter(
      (m) => !m.isLocal
    ) as AnyListen.Music.MusicInfoOnline[]
    if (!targets.length) return
    showNotify(targets.length > 1 ? `开始下载 ${targets.length} 首…` : '开始下载…')
    // 音质回退链:优先下载档(320k),拿不到再退播放档,最后交给服务端默认。
    // 某些歌在源里压根取不到(返回 gdstudio-no-url 之类非 http 占位符),逐档尝试后仍失败才报错。
    const qualityChain = [
      settingState.setting['download.quality'],
      settingState.setting['player.playQuality'],
      undefined,
    ].filter((q, i, a) => a.indexOf(q) === i)
    const resolveUrl = async (m: AnyListen.Music.MusicInfoOnline) => {
      for (const quality of qualityChain) {
        try {
          const { url } = await getMusicUrl({ musicInfo: m, quality })
          if (url && /^https?:\/\//i.test(url)) return url
        } catch {}
      }
      return ''
    }
    let ok = 0
    for (const m of targets) {
      try {
        const url = await resolveUrl(m)
        if (!url) {
          showNotify(`无法获取下载地址:${m.name}`)
          continue
        }
        const rawExt = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() ?? ''
        const ext = ['mp3', 'flac', 'wav', 'm4a', 'ogg', 'ape', 'aac'].includes(rawExt) ? rawExt : 'mp3'
        triggerBrowserDownload(url, `${sanitizeFileName(`${m.name} - ${m.singer}`)}.${ext}`)
        ok++
        // 多文件时留出间隔,避免浏览器把连续下载当成弹窗拦截
        if (targets.length > 1) await new Promise((r) => setTimeout(r, 600))
      } catch (err) {
        showNotify(`下载失败:${m.name}(${(err as Error).message})`)
      }
    }
    if (ok && targets.length > 1) showNotify(`已触发下载 ${ok}/${targets.length} 首`)
  }

  const handleClick = (menu: NonNullable<(typeof menus)[number]>) => {
    switch (menu.action) {
      case 'play':
        void onplay?.(selectInfo.musicInfo)
        break
      case 'download':
        if (import.meta.env.VITE_IS_DESKTOP) void handleDownload()
        else void handleBrowserDownload()
        break
      case 'collect':
        void addListMusics(
          LIST_IDS.LOVE,
          selectInfo.selectedList.length ? selectInfo.selectedList : [selectInfo.musicInfo]
        )
        break
      case 'playLater':
        void playMusicLater(
          selectInfo.listId,
          selectInfo.musicInfo,
          selectInfo.selectedList,
          source,
          selectInfo.onRemoveAllSelected
        )
        break
      case 'addTo':
        void showMusicAddModal(
          false,
          selectInfo.listId,
          selectInfo.selectedList.length ? selectInfo.selectedList : [selectInfo.musicInfo]
        )
        break
      case 'moveTo':
        void showMusicAddModal(
          true,
          selectInfo.listId,
          selectInfo.selectedList.length ? selectInfo.selectedList : [selectInfo.musicInfo]
        )
        break
      case 'copyName':
        copyName(selectInfo.musicInfo)
        break
      case 'locate':
        locateMusic(selectInfo.musicInfo as AnyListen.Music.MusicInfoLocal)
        break
      case 'dislike':
        void dislikeMusic(selectInfo.musicInfo)
        break
      case 'remove':
        void removeMusic(selectInfo.listId, selectInfo.musicInfo, selectInfo.selectedList, selectInfo.onRemoveAllSelected)
        break

      default:
        break
    }
    menuVisible = false
  }
</script>

<Menu bind:visible={menuVisible} {menus} location={menuLocation} onclick={handleClick} {onhide} />
