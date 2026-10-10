<script lang="ts">
  import brandIcon from '@/assets/jide-icon.png?inline'
  import { pushRoute } from '@/modules/resource/actions'
  import { location, link } from '@/plugins/routes'
  import { LIST_IDS } from '@any-listen/common/constants'
  import { getListMusics } from '@/modules/musicLibrary/actions'
  import { musicLibraryEvent } from '@/modules/musicLibrary/store/event'
  import { userListsAll, useListCover } from '@/modules/musicLibrary/reactive.svelte'
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

  type PageType = 'curated' | 'liked' | 'recent'
  const pageMap: Record<string, PageType> = {
    '/curated': 'curated',
    '/liked': 'liked',
    '/recent': 'recent',
  }
  const activePage = $derived(pageMap[$location] ?? 'curated')
  const goToSources = () => pushRoute('/extenstion', {})
  const searchSources = useResourceList('search')
  const searchSourceCount = $derived(searchSources.val.musicSearch?.length ?? 0)

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
    // 下载全部仅 desktop(web 在线听不下载)
    import.meta.env.VITE_IS_DESKTOP ? { action: 'downloadAll', label: '下载全部' } : null,
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
  // ===== 真实在线数据：推荐(排行榜聚合) / 精选(歌单广场) =====
  // 源能提供的在线能力只有 search/songlist/topSongs/album/singer；推荐接 topSongs，精选接 songlist。
  const onlineAvailable = useOnlineResourceAvailable()
  const songlistSources = useResourceList('songlist')
  const songlistSource = $derived((songlistSources.val.songlist ?? [])[0])

  // 精选 = 歌单广场（默认源、默认分类、首页 30 条）
  let curatedList = $state.raw<AnyListen.Resource.SongListItem[]>([])
  let curatedLoading = $state(false)
  let curatedError = $state(false)
  let curatedRefresh = $state(0)
  $effect(() => {
    if (activePage != 'curated') return
    const s = songlistSource
    void curatedRefresh
    curatedError = false
    if (!s || !onlineAvailable.val) {
      curatedLoading = false
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
        if (active) {
          curatedList = []
          curatedError = true
        }
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
        return '发现音乐'
      case 'liked':
        return '我喜欢的音乐'
      case 'recent':
        return '最近播放'
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

<div
  class="netease-view"
  class:playlist-page={activePage == 'liked'}
  class:list-page={activePage == 'liked' || activePage == 'recent' || activePage == 'curated'}
>
  {#if activePage == 'curated'}
    <header class="page-header">
      <div><span class="eyebrow">JIDE MUSIC · 自由聆听</span><h1>发现音乐</h1></div>
      <a class="source-link" href="/extenstion" {@attach link()}>音源管理 ↗</a>
    </header>
    <section class="discovery-intro" aria-label="开始聆听">
      <div>
        <h2>好音乐，听你所爱。</h2>
        <p>{onlineAvailable.val && searchSourceCount ? `已连接 ${searchSourceCount} 个搜索音源，在上方搜索歌曲、艺术家或专辑。` : '从开放曲库开始，也可以导入本地音乐。你的收藏与最近播放，都在这里。'}</p>
      </div>
      <a class="intro-link" href="/media-library" {@attach link()}>打开音乐库 →</a>
    </section>
    <div class="section-heading"><h2>歌单广场</h2><span>由已启用的音源提供</span></div>
    {#if !onlineAvailable.val || !songlistSource}
      <section class="empty-state">
        <span class="empty-symbol" aria-hidden="true">♫</span>
        <h2>{!onlineAvailable.val ? '连接你的第一个音源' : '当前音源暂不提供歌单'}</h2>
        <p>{!onlineAvailable.val ? '在音源管理中启用扩展，即可搜索和播放在线音乐。只安装你信任的音源。' : '歌曲搜索仍可使用。你也可以添加支持歌单的扩展，探索更多音乐。'}</p>
        <button type="button" class="primary-action" onclick={goToSources}>打开音源管理</button>
      </section>
    {:else if curatedLoading && !curatedList.length}
      <p class="online-empty" role="status">正在加载歌单…</p>
    {:else if !curatedList.length}
      <section class="empty-state">
        <span class="empty-symbol" aria-hidden="true">♫</span>
        <h2>{curatedError ? '这个音源暂时没有回应' : '当前音源暂无歌单'}</h2>
        <p>{curatedError ? '可以重试，或在音源管理中切换扩展。你的收藏不受影响。' : '试试搜索歌曲，或连接其他支持歌单的音源。'}</p>
        <button type="button" class="primary-action" onclick={() => curatedRefresh++}>重新加载</button>
        <a class="source-link" href="/extenstion" {@attach link()}>管理音源</a>
      </section>
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
      <img
        src={loveCover.val || loveMusics[0]?.meta.picUrl || brandIcon}
        alt=""
        onerror={(event) => {
          const image = event.currentTarget
          if (!(image instanceof HTMLImageElement)) return
          if (image.src !== brandIcon) image.src = brandIcon
        }}
      />
      <div>
        <h1>{loveListInfo?.name || pageTitle}</h1>
        <p>共 {loveMusics.length} 首</p>
        <div class="hero-actions">
          <button type="button" class="primary-action" disabled={!loveMusics.length} onclick={playLikedAll}>播放全部</button>
          {#if import.meta.env.VITE_IS_DESKTOP}
            <button type="button" disabled={!loveMusics.length} onclick={downloadLikedAll}>下载</button>
          {/if}
          <button type="button" aria-label="歌单更多操作" disabled={!loveMusics.length} onclick={openHeroMenu}>•••</button>
        </div>
      </div>
    </section>
    <div class="liked-toolbar">
      <span class="liked-count">共 {loveMusics.length} 首{#if likedSearch.trim()}，找到 {likedFiltered.length} 首{/if}</span>
      <input class="liked-search" type="text" placeholder="搜索我喜欢的音乐" bind:value={likedSearch} />
    </div>
    {#if !loveMusics.length}
      <section class="empty-state"><h2>收藏喜欢的每一首</h2><p>播放时点击爱心，喜欢的音乐就会出现在这里。</p><a class="source-link" href="/curated" {@attach link()}>去发现音乐 →</a></section>
    {:else if !likedFiltered.length}
      <section class="empty-state"><h2>没有找到匹配的歌曲</h2><p>试试其他歌名、歌手或专辑。</p><button type="button" class="primary-action" onclick={() => likedSearch = ''}>清除搜索</button></section>
    {:else}
      <div class="liked-list">
        <MusicList bind:this={likedMusicList} list={likedFiltered} listinfo={loveListInfoForList} showheader={false} />
      </div>
    {/if}
    <Menu bind:visible={heroMenuVisible} menus={heroMenus} location={heroMenuLocation} onclick={handleHeroMenu} />
  {:else if activePage == 'recent'}
    <header class="page-header recent-header">
      <h1>最近播放</h1>
      {#if recentMusics.length}
        <button type="button" class="primary-action" onclick={playRecentAll}>播放全部</button>
      {/if}
    </header>
    {#if !recentMusics.length}
      <section class="empty-state"><span class="empty-symbol" aria-hidden="true">♫</span><h2>从第一首歌开始</h2><p>播放过的音乐会出现在这里，随时找回上一次的旋律。</p><a class="source-link" href="/curated" {@attach link()}>去发现音乐 →</a></section>
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
    box-sizing: border-box;
    padding: 26px 32px 20px;
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
    padding-bottom: 16px;
  }
  .card-grid {
    display: grid;
    gap: 18px;
  }
  .card-grid.large {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
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
      radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 34%),
      linear-gradient(180deg, color-mix(in srgb, var(--color-main-background) 60%, var(--color-primary) 8%), var(--color-main-background));

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
    min-height: 38px;
    padding: 0 20px;
    cursor: pointer;
    border: 0;
    border-radius: 999px;
    &:disabled { opacity: 0.4; cursor: default; }
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

  .online-empty {
    padding: 40px 4px;
    font-size: 14px;
    color: var(--color-font-label);
    text-align: center;
  }
  .page-header {
    justify-content: space-between;

    h1 {
      margin: 0;
      font-size: 28px;
    }
    .primary-action {
    min-height: 38px;
    padding: 0 20px;
    cursor: pointer;
    border: 0;
    border-radius: 999px;
    &:disabled { opacity: 0.4; cursor: default; }
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

  }
  .eyebrow { display: block; margin-bottom: 8px; font-size: 11px; letter-spacing: 1.5px; color: var(--color-font-label); }
  .source-link, .intro-link { color: var(--color-primary); text-decoration: none; font-size: 13px; border-radius: 6px; }
  .source-link:hover, .intro-link:hover { text-decoration: underline; }
  .discovery-intro { display: flex; flex: none; justify-content: space-between; align-items: center; gap: 20px; padding: 24px; border: 1px solid var(--color-border); border-radius: 16px; background: linear-gradient(115deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-main-background)), var(--color-main-background)); }
  .discovery-intro h2 { margin: 0 0 10px; font-size: 24px; }
  .discovery-intro p { max-width: 480px; margin: 0; font-size: 13px; line-height: 1.7; color: var(--color-font-label); }
  .intro-link { flex: none; }
  .section-heading { display: flex; flex: none; align-items: baseline; gap: 14px; margin-top: 8px; }
  .section-heading h2 { font-size: 18px; margin: 0; }
  .section-heading span { font-size: 12px; color: var(--color-font-label); }
  .empty-state { display: flex; flex: 1 1 0; min-height: 0; overflow: auto; flex-flow: column nowrap; align-items: center; justify-content: center; gap: 14px; padding: 24px; text-align: center; }
  .empty-state h2 { margin: 0; font-size: 18px; }
  .empty-state p { max-width: 420px; margin: 0; font-size: 13px; line-height: 1.8; color: var(--color-font-label); }
  .empty-symbol { font-size: 36px; color: var(--color-primary); }
  a:focus-visible, button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 4px; }
  @media (max-height: 660px) { .discovery-intro { padding: 14px 20px; } .empty-symbol { display: none; } .netease-view { gap: 12px; padding-top: 16px; } }
  @media (max-width: 900px) { .netease-view { padding-left: 22px; padding-right: 22px; } .discovery-intro { align-items: flex-start; flex-flow: column nowrap; gap: 12px; } .playlist-hero h1 { font-size: 24px; } }
</style>
