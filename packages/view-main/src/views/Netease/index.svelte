<script lang="ts">
  import { toOnlineSearch, pushRoute } from '@/modules/resource/actions'
  import { location, query } from '@/plugins/routes'
  import { LIST_IDS } from '@any-listen/common/constants'
  import { getListMusics, removeListMusics } from '@/modules/musicLibrary/actions'
  import { musicLibraryEvent } from '@/modules/musicLibrary/store/event'
  import { userListsAll, useListCover } from '@/modules/musicLibrary/reactive.svelte'
  import { playLocalListMusic } from '@/components/common/MusicList/List/action'
  import { playList } from '@/modules/player/store/actions'
  import MusicList from '@/components/common/MusicList/MusicList.svelte'
  import Menu, { type MenuList } from '@/components/base/Menu.svelte'
  import { type ComponentExports } from 'svelte'
  import type { ListInfo } from '@/components/common/MusicList/type'
  import { LIST_PIC_ICON } from '@/shared/constants'
  import { useResourceList, useOnlineResourceAvailable, getSourceId } from '@/views/Online/shared.svelte'
  import { getData as getSonglistData } from '@/modules/resource/songlist/list/actions'
  import { buildSonglistDetailUrl } from '@/views/Online/Songlist/shared.svelte'
  import { startDownload } from '@/shared/ipc/list'
  import { settingState } from '@/modules/setting/store/state'
  import { showNotify } from '@/components/apis/notify'

  type PageType = 'curated' | 'liked' | 'recent' | 'playlist'
  type Card = {
    title: string
    desc?: string
    tag?: string
    count?: string
    image: string
    accent?: string
    query?: string
    action?: 'topSongs'
  }
  type Track = {
    title: string
    artist: string
    album: string
    time: string
    badge?: string
    liked?: boolean
    image: string
    // 真实歌曲对象（来自本地"我喜欢"列表）。存在时行内交互走真实播放/取消收藏，
    // 不存在时退回原有 mock 行为（在线搜索），其它 NetEase 假页面不受影响。
    music?: AnyListen.Music.MusicInfo
  }

  const pageMap: Record<string, PageType> = {
    '/curated': 'curated',
    '/liked': 'liked',
    '/recent': 'recent',
    '/playlist-detail': 'playlist',
  }

  const cover = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=80`


  const likedTracks: Track[] = [
    {
      title: '想象之中',
      artist: '许嵩',
      album: '苏格拉没有底',
      time: '04:06',
      badge: 'VIP',
      liked: true,
      image: cover('photo-1511379938547-c1f69419868d'),
    },
    {
      title: '你最近还好吗',
      artist: 'Ghost',
      album: '从 M 到 W 的高速公路',
      time: '03:30',
      badge: 'VIP',
      liked: true,
      image: cover('photo-1500530855697-b586d89ba3ee'),
    },
    {
      title: '第57次取消发送',
      artist: '姚晓棠 / 张新成',
      album: '天赐的声音第六季',
      time: '03:06',
      badge: 'MV',
      liked: true,
      image: cover('photo-1493225457124-a3eb161ffa5f'),
    },
    {
      title: '是我不够好',
      artist: '李毓芬',
      album: '是我不够好',
      time: '03:37',
      badge: 'SQ',
      liked: true,
      image: cover('photo-1517841905240-472988babdf9'),
    },
    {
      title: '我本将心向明月',
      artist: '王朝1982 / 朱旭BooBoo',
      album: '我本将心向明月',
      time: '03:41',
      badge: 'Hi-Res',
      liked: true,
      image: cover('photo-1500534314209-a25ddb2bd429'),
    },
    {
      title: '灿烂的你',
      artist: '歌手 2024',
      album: '歌手 2024 第5期',
      time: '05:09',
      badge: 'LIVE',
      liked: true,
      image: cover('photo-1516280440614-37939bbacd81'),
    },
  ]


  const activePage = $derived(pageMap[$location] ?? 'liked')
  const playlistTitle = $derived($query.name ?? '我喜欢的音乐')

  const search = (keyword: string) => {
    void toOnlineSearch(keyword)
  }
  const openMeta = (queryType: 'singer' | 'album', keyword: string, event?: Event) => {
    event?.preventDefault()
    event?.stopPropagation()
    const text = keyword.trim()
    if (!text) return
    pushRoute('/online', {
      t: 'search',
      qt: queryType,
      q: text,
    })
  }
  const openTrack = (track: Track) => {
    search(`${track.title} ${track.artist}`)
  }

  // ===== 真实"我喜欢的音乐"（本地 LIST_IDS.LOVE）数据接入 =====
  let loveMusics = $state.raw<AnyListen.Music.MusicInfo[]>([])
  const loveListInfo = $derived($userListsAll.find((l) => l.id == LIST_IDS.LOVE))
  const loveCover = $derived(useListCover(loveListInfo))
  // 喂给真实 MusicList(虚拟滚动)的列表信息;love 是 default 型,封面走 picIcon
  const loveListInfoForList = $derived<ListInfo>({
    id: LIST_IDS.LOVE,
    name: loveListInfo?.name ?? '我喜欢的音乐',
    picIcon: LIST_PIC_ICON[LIST_IDS.LOVE as keyof typeof LIST_PIC_ICON],
  })

  // 仅在进入"我喜欢的音乐"页时加载，并订阅列表变更实时刷新（模式同 views/Library/index.svelte）
  $effect(() => {
    if (activePage != 'liked') return
    let active = true
    const refresh = () => {
      void getListMusics(LIST_IDS.LOVE).then((l) => {
        if (active) loveMusics = [...l]
      })
    }
    refresh()
    const unsub = musicLibraryEvent.on('listMusicChanged', (ids) => {
      if (ids.includes(LIST_IDS.LOVE)) refresh()
    })
    const unsub2 = musicLibraryEvent.on('listMusicUpdated', (updateInfo) => {
      if (updateInfo.has(LIST_IDS.LOVE)) refresh()
    })
    return () => {
      active = false
      unsub()
      unsub2()
    }
  })

  const playLikedAll = () => {
    if (!loveMusics.length) return
    void playList(LIST_IDS.LOVE, loveMusics, 0)
  }

  // hero ··· 下拉菜单(批量选择 / 下载全部 / 刷新)
  let likedMusicList = $state<ComponentExports<typeof MusicList> | null>(null)
  let heroMenuVisible = $state.raw(false)
  let heroMenuLocation = $state.raw({ x: 0, y: 0 })
  type HeroMenuAction = 'multiSelect' | 'downloadAll'
  const heroMenus: MenuList<HeroMenuAction> = [
    { action: 'multiSelect', label: '批量选择' },
    { action: 'downloadAll', label: '下载全部' },
  ]
  const openHeroMenu = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    heroMenuLocation = { x: rect.left, y: rect.bottom + 4 }
    heroMenuVisible = true
  }
  const handleHeroMenu = (item: NonNullable<MenuList<HeroMenuAction>[number]>) => {
    heroMenuVisible = false
    switch (item.action) {
      case 'multiSelect':
        likedMusicList?.toggleMultiSelect()
        showNotify(likedMusicList?.isMultiSelect() ? '已进入批量选择,勾选歌曲后右键即可下载/操作' : '已退出批量选择')
        break
      case 'downloadAll':
        void downloadLikedAll()
        break
    }
  }
  // hero「下载」:下载列表里所有在线歌(并发受限于后端,仅 desktop 真正落盘)
  const downloadLikedAll = async () => {
    const online = loveMusics.filter((m) => !m.isLocal) as AnyListen.Music.MusicInfoOnline[]
    if (!online.length) {
      showNotify('没有可下载的在线歌曲')
      return
    }
    const quality = settingState.setting['download.quality']
    try {
      for (const m of online) await startDownload(m, quality)
      showNotify(`已加入下载(${online.length})`)
    } catch (err) {
      showNotify((err as Error).message)
    }
  }

  // /liked 列表内搜索(按歌名/歌手/专辑过滤)
  let likedSearch = $state('')
  const likedFiltered = $derived.by(() => {
    const kw = likedSearch.trim().toLowerCase()
    if (!kw) return loveMusics
    return loveMusics.filter(
      (m) =>
        m.name.toLowerCase().includes(kw) || m.singer.toLowerCase().includes(kw) || m.meta.albumName.toLowerCase().includes(kw)
    )
  })

  // ===== 最近播放(LAST_PLAYED)真实数据 =====
  let recentMusics = $state.raw<AnyListen.Music.MusicInfo[]>([])
  const recentListInfoForList = $derived<ListInfo>({
    id: LIST_IDS.LAST_PLAYED,
    name: '最近播放',
    picIcon: LIST_PIC_ICON[LIST_IDS.LAST_PLAYED as keyof typeof LIST_PIC_ICON],
  })
  $effect(() => {
    if (activePage != 'recent') return
    let active = true
    const refresh = () => {
      void getListMusics(LIST_IDS.LAST_PLAYED).then((l) => {
        if (active) recentMusics = [...l]
      })
    }
    refresh()
    const unsub = musicLibraryEvent.on('listMusicChanged', (ids) => {
      if (ids.includes(LIST_IDS.LAST_PLAYED)) refresh()
    })
    const unsub2 = musicLibraryEvent.on('listMusicUpdated', (updateInfo) => {
      if (updateInfo.has(LIST_IDS.LAST_PLAYED)) refresh()
    })
    return () => {
      active = false
      unsub()
      unsub2()
    }
  })
  const playRecentAll = () => {
    if (!recentMusics.length) return
    void playList(LIST_IDS.LAST_PLAYED, recentMusics, 0)
  }
  const onTrackActivate = (track: Track) => {
    if (track.music) void playLocalListMusic(LIST_IDS.LOVE, track.music)
    else openTrack(track)
  }
  const uncollectTrack = (track: Track, event: Event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!track.music) return
    void removeListMusics(LIST_IDS.LOVE, [track.music.id])
  }

  const handleTrackKeydown = (event: KeyboardEvent, track: Track) => {
    if (event.repeat || event.key != 'Enter') return
    onTrackActivate(track)
  }

  // ===== 真实在线数据：推荐(排行榜聚合) / 精选(歌单广场) =====
  // 源能提供的在线能力只有 search/songlist/topSongs/album/singer；推荐接 topSongs，精选接 songlist。
  const onlineAvailable = useOnlineResourceAvailable()
  const songlistSources = useResourceList('songlist')
  const songlistSource = $derived((songlistSources.val.songlist ?? [])[0])

  // 精选 = 歌单广场（默认源、默认分类、首页 30 条）
  let curatedList = $state.raw<AnyListen.Resource.SongListItem[]>([])
  let curatedLoading = $state(false)
  $effect(() => {
    if (activePage != 'curated') return
    const s = songlistSource
    if (!s) {
      curatedList = []
      return
    }
    let active = true
    curatedLoading = true
    void getSonglistData(s.extensionId, s.id, '', '', 1, 30)
      .promise.then((r) => {
        if (active) curatedList = r.list
      })
      .catch(() => {
        if (active) curatedList = []
      })
      .finally(() => {
        if (active) curatedLoading = false
      })
    return () => {
      active = false
    }
  })
  const openSonglist = (item: AnyListen.Resource.SongListItem) => {
    const s = songlistSource
    if (!s) return
    const { path, meta } = buildSonglistDetailUrl({ id: item.id, sid: getSourceId(s) })
    pushRoute(path, meta)
  }

  const pageTitle = $derived.by(() => {
    switch (activePage) {
      case 'curated':
        return '精选'
      case 'liked':
        return '我喜欢的音乐'
      case 'recent':
        return '最近播放'
      case 'playlist':
        return playlistTitle
    }
  })
</script>


{#snippet OnlineCard(image: string, title: string, sub: string, onclick: () => void)}
  <button
    type="button"
    class="feature-card"
    style={`${image ? `--image: url(${image});` : ''} --accent: linear-gradient(160deg, rgb(58 58 68), rgb(22 22 30));`}
    {onclick}
  >
    <div class="card-media"></div>
    <div class="card-copy">
      <strong>{title}</strong>
      {#if sub}
        <span>{sub}</span>
      {/if}
    </div>
  </button>
{/snippet}

{#snippet TrackRows(tracks: Track[], mode: 'playlist' | 'recent' = 'playlist')}
  <div class="track-table">
    <div class="track-head">
      <span>#</span>
      <span>标题</span>
      <span>艺术家</span>
      <span>专辑</span>
      <span>{mode == 'recent' ? '播放时间' : '时长'}</span>
    </div>
    {#each tracks as track, index (track.music?.id ?? track.title)}
      <div
        class="track-row"
        role="button"
        tabindex="0"
        onkeydown={(event) => {
          handleTrackKeydown(event, track)
        }}
        onclick={() => {
          onTrackActivate(track)
        }}
      >
        <span class="index">{String(index + 1).padStart(2, '0')}</span>
        <span class="track-main">
          <img src={track.image} alt="" />
          <span>
            <strong>{track.title}</strong>
            <span class="track-meta">
              {#if track.badge}
                <em>{track.badge}</em>
              {/if}
            </span>
          </span>
        </span>
        <button
          type="button"
          class="meta-link artist"
          aria-label={`艺术家 ${track.artist}`}
          onclick={(event) => {
            openMeta('singer', track.artist, event)
          }}
        >
          {track.artist}
        </button>
        <button
          type="button"
          class="meta-link album"
          aria-label={`专辑 ${track.album}`}
          onclick={(event) => {
            openMeta('album', track.album, event)
          }}
        >
          {track.album}
        </button>
        <span class="time">
          {#if track.liked}
            {#if track.music}
              <button
                type="button"
                class="heart heart-btn"
                aria-label="取消收藏"
                onclick={(event) => {
                  uncollectTrack(track, event)
                }}
              >♥</button>
            {:else}
              <span class="heart">♥</span>
            {/if}
          {/if}
          {track.time}
        </span>
      </div>
    {/each}
  </div>
{/snippet}

<div
  class="netease-view"
  class:playlist-page={activePage == 'liked' || activePage == 'playlist'}
  class:list-page={activePage == 'liked' || activePage == 'recent' || activePage == 'curated'}
>
  {#if activePage == 'curated'}
    <header class="page-header">
      <h1>精选</h1>
    </header>
    {#if !onlineAvailable.val || !songlistSource}
      <p class="online-empty">未安装支持歌单的在线扩展，前往「扩展管理」添加后即可使用。</p>
    {:else if curatedLoading && !curatedList.length}
      <p class="online-empty">正在加载歌单…</p>
    {:else if !curatedList.length}
      <p class="online-empty">暂无歌单</p>
    {:else}
      <div class="curated-scroll">
        <section class="card-grid large">
          {#each curatedList as item (item.id)}
            {@render OnlineCard(item.img ?? '', item.name, item.play_count ?? item.author ?? '', () => openSonglist(item))}
          {/each}
        </section>
      </div>
    {/if}
  {:else if activePage == 'liked'}
    <section class="playlist-hero">
      <img src={loveCover.val || loveMusics[0]?.meta.picUrl || likedTracks[0].image} alt="" />
      <div>
        <h1>{loveListInfo?.name || pageTitle}</h1>
        <p>共 {loveMusics.length} 首</p>
        <div class="hero-actions">
          <button type="button" class="primary-action" onclick={playLikedAll}>播放全部</button>
          <button type="button" onclick={downloadLikedAll}>下载</button>
          <button type="button" onclick={openHeroMenu}>•••</button>
        </div>
      </div>
    </section>
    <div class="liked-toolbar">
      <span class="liked-count">共 {loveMusics.length} 首{#if likedSearch.trim()}，找到 {likedFiltered.length} 首{/if}</span>
      <input class="liked-search" type="text" placeholder="搜索我喜欢的音乐" bind:value={likedSearch} />
    </div>
    <div class="liked-list">
      <MusicList bind:this={likedMusicList} list={likedFiltered} listinfo={loveListInfoForList} showheader={false} />
    </div>
    <Menu bind:visible={heroMenuVisible} menus={heroMenus} location={heroMenuLocation} onclick={handleHeroMenu} />
  {:else if activePage == 'playlist'}
    <section class="playlist-hero">
      <img src={likedTracks[0].image} alt="" />
      <div>
        <h1>{pageTitle}</h1>
        <p>陈前-ebay · 2019-12-13 创建</p>
        <div class="hero-actions">
          <button type="button" class="primary-action" onclick={() => search(pageTitle)}>播放全部</button>
          <button type="button">下载</button>
          <button type="button">•••</button>
        </div>
      </div>
    </section>
    <nav class="list-tabs">
      <button type="button" class="active">歌曲 712</button>
      <button type="button">收藏者 1</button>
      <button type="button" class="list-search">搜索</button>
    </nav>
    {@render TrackRows(likedTracks)}
  {:else if activePage == 'recent'}
    <header class="page-header recent-header">
      <h1>最近播放</h1>
      {#if recentMusics.length}
        <button type="button" class="primary-action" onclick={playRecentAll}>播放全部</button>
      {/if}
    </header>
    {#if !recentMusics.length}
      <p class="online-empty">还没有最近播放记录</p>
    {:else}
      <div class="liked-list">
        <MusicList list={recentMusics} listinfo={recentListInfoForList} showheader={false} />
      </div>
    {/if}
  {/if}
</div>

<style lang="less">
  .netease-view {
    --ncm-card: color-mix(in srgb, var(--color-main-background) 88%, white 12%);
    --ncm-soft: color-mix(in srgb, var(--color-main-background) 78%, white 22%);
    --ncm-muted: var(--color-font-label);

    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    gap: 22px;
    // 父级路由容器 .view 是 display:block,flex 在这里不生效,必须用 height:100% 才能填满整屏
    height: 100%;
    min-height: 0;
    padding: 22px 32px 96px;
    overflow: auto;
    color: var(--color-font);
    background: var(--color-main-background);
  }

  // 列表页(我喜欢/最近播放)整页不滚动,交给内部 MusicList 虚拟滚动,否则 wrapper 拿不到固定高度
  .netease-view.list-page {
    overflow: hidden;
    gap: 14px;
    // 列表页内部 MusicList 自己滚动,不需要给播放器留 96px 底部空白(那会把列表挤成 0 高)
    padding-bottom: 18px;

    .playlist-hero {
      min-height: 0;

      img {
        width: 150px;
        height: 150px;
      }
      p {
        margin: 0 0 14px;
      }
    }
  }

  // MusicList 自带虚拟滚动,wrapper 需给定可收缩高度
  .liked-list {
    display: flex;
    // flex-basis:0 强制纯弹性分配出确定高度(flex:auto 的 basis=内容会让 708 行巨型占位撑爆/塌成 0,
    // 导致内部 VirtualizedList 拿到 clientHeight=0 渲染 0 行)
    flex: 1 1 0;
    flex-flow: column nowrap;
    min-height: 0;
  }
  .liked-toolbar {
    display: flex;
    flex: none;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }
  .liked-count {
    font-size: 13px;
    color: var(--color-font-label);
  }
  .liked-search {
    width: 220px;
    height: 34px;
    padding: 0 14px;
    color: var(--color-font);
    background: var(--ncm-card);
    border: 1px solid var(--color-border);
    border-radius: 999px;

    &:focus {
      border-color: var(--color-primary);
      outline: none;
    }
  }

  // 精选页:外层 .netease-view.list-page 不滚,grid 放进这个可收缩滚动容器(复用 liked 的成熟模式)
  .curated-scroll {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: 80px;
  }
  .card-grid {
    display: grid;
    gap: 18px;
  }
  .card-grid.large {
    grid-template-columns: repeat(4, minmax(160px, 1fr));
  }

  .feature-card {
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    min-height: 176px;
    padding: 0;
    overflow: hidden;
    color: rgb(255 255 255);
    text-align: left;
    cursor: pointer;
    background: var(--accent);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 8px;
    transition: transform 0.18s ease, border-color 0.18s ease;

    &:hover {
      border-color: rgb(255 255 255 / 22%);
      transform: translateY(-2px);
    }
  }
  .card-media {
    min-height: 118px;
    background-image:
      linear-gradient(180deg, rgb(0 0 0 / 4%), rgb(0 0 0 / 38%)),
      var(--image);
    background-position: center;
    background-size: cover;
  }
  .card-copy {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    gap: 6px;
    padding: 12px;
    background: linear-gradient(180deg, rgb(0 0 0 / 0%), rgb(0 0 0 / 26%));

    strong {
      font-size: 16px;
      line-height: 1.28;
    }
    span:not(.tag) {
      font-size: 13px;
      line-height: 1.35;
      opacity: 0.82;
    }
  }
  .list-tabs {
    display: flex;
    flex: none;
    gap: 22px;
    align-items: center;
    min-height: 38px;

    button {
      position: relative;
      padding: 0 0 8px;
      font-size: 17px;
      font-weight: 700;
      color: var(--color-font-label);
      cursor: pointer;
      background: none;
      border: 0;

      &.active {
        color: var(--color-font);
      }
      &.active::after {
        position: absolute;
        right: 18%;
        bottom: 0;
        left: 18%;
        height: 4px;
        content: '';
        background: var(--color-primary);
        border-radius: 999px;
      }
    }
  }

  .playlist-hero,
  .page-header,
  .recent-header {
    display: flex;
    align-items: center;
  }
  .playlist-hero {
    gap: 28px;
    min-height: 230px;
    padding: 18px 0 4px;
    background:
      radial-gradient(circle at 18% 20%, rgb(71 114 88 / 38%), transparent 34%),
      linear-gradient(180deg, color-mix(in srgb, var(--color-main-background) 60%, rgb(37 78 62) 40%), var(--color-main-background));

    img {
      width: 210px;
      height: 210px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 18px 40px rgb(0 0 0 / 28%);
    }
    h1 {
      margin: 0 0 14px;
      font-size: 30px;
      line-height: 1.2;
    }
    p {
      margin: 0 0 58px;
      color: var(--color-font-label);
    }
  }
  .hero-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .primary-action {
    color: rgb(255 255 255) !important;
    background: var(--color-primary) !important;
    border-color: transparent !important;
  }
  // 次级 hero 按钮(下载/···):深色半透明底 + 可读文字,避免白字贴浅底看不清
  .hero-actions button:not(.primary-action) {
    height: 40px;
    padding: 0 20px;
    font-size: 14px;
    color: var(--color-font);
    cursor: pointer;
    background: rgb(255 255 255 / 12%);
    border: 1px solid rgb(255 255 255 / 18%);
    border-radius: 999px;
    transition: background 0.15s ease;

    &:hover {
      background: rgb(255 255 255 / 20%);
    }
  }

  .list-tabs {
    justify-content: flex-start;
    .list-search {
      margin-left: auto;
      padding: 0 18px;
      color: var(--color-font-label);
      background: var(--ncm-card);
      border: 1px solid var(--color-border);
      border-radius: 999px;
    }
  }

  .track-table {
    display: flex;
    flex-flow: column nowrap;
    gap: 2px;
    min-width: 0;
  }
  .track-head,
  .track-row {
    display: grid;
    grid-template-columns: 48px minmax(240px, 1.2fr) minmax(150px, 0.8fr) minmax(180px, 1fr) 110px;
    gap: 16px;
    align-items: center;
  }
  .track-head {
    height: 42px;
    padding: 0 14px;
    font-size: 14px;
    color: var(--color-font-label);
    border-bottom: 1px solid var(--color-border);
  }
  .track-row {
    min-height: 72px;
    padding: 0 14px;
    color: var(--color-font);
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 6px;

    &:hover {
      background: var(--ncm-card);
    }
  }
  .index,
  .album,
  .time {
    color: var(--color-font-label);
  }
  .meta-link {
    min-width: 0;
    padding: 0;
    overflow: hidden;
    color: var(--color-font-label);
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    background: transparent;
    border: 0;

    &:hover {
      color: var(--color-primary);
      text-decoration: underline;
    }
  }
  .track-main {
    display: flex;
    gap: 12px;
    align-items: center;
    min-width: 0;

    img {
      flex: none;
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 4px;
    }
    strong,
    span {
      .mixin-ellipsis-1();
    }
    & > span {
      display: flex;
      min-width: 0;
      flex-flow: column nowrap;
      gap: 5px;
    }
  }
  .track-meta {
    display: flex;
    gap: 6px;
    align-items: center;
    color: var(--color-font-label);

    em {
      padding: 1px 4px;
      font-style: normal;
      font-size: 11px;
      color: #f5b23b;
      border: 1px solid rgb(245 178 59 / 70%);
      border-radius: 3px;
    }
  }
  .heart {
    margin-right: 12px;
    color: var(--color-primary);
  }
  .online-empty {
    padding: 40px 4px;
    font-size: 14px;
    color: var(--color-font-label);
    text-align: center;
  }
  .heart-btn {
    padding: 0;
    font: inherit;
    line-height: 1;
    cursor: pointer;
    background: none;
    border: none;
    transition: transform 0.15s ease, opacity 0.15s ease;

    &:hover {
      opacity: 0.8;
      transform: scale(1.2);
    }
  }

  .page-header {
    justify-content: space-between;

    h1 {
      margin: 0;
      font-size: 28px;
    }
    .primary-action {
      height: 48px;
      padding: 0 28px;
      font-size: 16px;
      border-radius: 8px;
    }
  }
  .recent-header {
    justify-content: space-between;
  }
  @media (max-width: 1080px) {
    .card-grid.large {
      grid-template-columns: repeat(2, minmax(160px, 1fr));
    }
    .track-head,
    .track-row {
      grid-template-columns: 40px minmax(220px, 1fr) minmax(120px, 0.8fr) 90px;
    }
    .track-row .album {
      display: none;
    }
    .track-head span:nth-child(4) {
      display: none;
    }
  }
</style>
