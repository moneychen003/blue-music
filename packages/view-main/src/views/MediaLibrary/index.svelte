<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import Input from '@/components/base/Input.svelte'
  import Empty from '@/components/material/Empty.svelte'
  import { showSimpleConfirmModal } from '@/components/apis/dialog'
  import { showNotify } from '@/components/apis/notify'
  import {
    getAllList,
    getListMusics,
    parseMusicMetadata,
    removeListMusics,
    syncUserList,
    updateListMusic,
  } from '@/modules/musicLibrary/actions'
  import { musicLibraryEvent } from '@/modules/musicLibrary/store/event'
  import { playLocalListMusic } from '@/components/common/MusicList/List/action'
  import { i18n, t, type Message } from '@/plugins/i18n'
  import { openDirInExplorer } from '@/shared/ipc/app'
  import { getUserListsAll, userListsAll } from '@/modules/musicLibrary/reactive.svelte'
  import { LIST_IDS } from '@any-listen/common/constants'
  import { buildMusicName, buildSourceLabel } from '@any-listen/common/tools'
  import { onMount } from 'svelte'

  type TabId = 'all' | 'artist' | 'album' | 'folder' | 'duplicate' | 'metadata' | 'scan'
  type GroupType = 'artist' | 'album' | 'folder'

  interface LibraryEntry {
    key: string
    listId: string
    listName: string
    listType: AnyListen.List.MyListInfo['type']
    musicInfo: AnyListen.Music.MusicInfo
  }

  interface LibraryGroup {
    key: string
    name: string
    count: number
    items: LibraryEntry[]
  }

  const tabs: Array<{ id: TabId; label: keyof Message }> = [
    { id: 'all', label: 'media_library.tabs.all' },
    { id: 'artist', label: 'media_library.tabs.artist' },
    { id: 'album', label: 'media_library.tabs.album' },
    { id: 'folder', label: 'media_library.tabs.folder' },
    { id: 'duplicate', label: 'media_library.tabs.duplicate' },
    { id: 'metadata', label: 'media_library.tabs.metadata' },
    { id: 'scan', label: 'media_library.tabs.scan' },
  ]

  let activeTab = $state<TabId>('all')
  let entries = $state.raw<LibraryEntry[]>([])
  let loading = $state(false)
  let searchText = $state('')
  let selectedGroup = $state('')
  let repairingKey = $state('')
  let syncingListId = $state('')

  const normalize = (value?: string | null) => (value || '').trim().toLowerCase().replace(/\s+/g, ' ')
  const fallbackText = (value?: string | null) => value?.trim() || i18n.t('media_library.unknown')
  const getMusicFolder = (musicInfo: AnyListen.Music.MusicInfo) => {
    if (!musicInfo.isLocal) return i18n.t('media_library.online_resource')
    const filePath = musicInfo.meta.filePath
    const index = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
    return index > 0 ? filePath.substring(0, index) : filePath
  }
  const getGroupValue = (entry: LibraryEntry, type: GroupType) => {
    switch (type) {
      case 'artist':
        return fallbackText(entry.musicInfo.singer)
      case 'album':
        return fallbackText(entry.musicInfo.meta.albumName)
      case 'folder':
        return getMusicFolder(entry.musicInfo)
    }
  }
  const buildGroups = (type: GroupType) => {
    const map = new Map<string, LibraryEntry[]>()
    for (const entry of entries) {
      const name = getGroupValue(entry, type)
      const key = normalize(name) || name
      const list = map.get(key)
      if (list) {
        list.push(entry)
      } else {
        map.set(key, [entry])
      }
    }
    return Array.from(map.entries())
      .map(([key, items]) => ({ key, name: getGroupValue(items[0], type), count: items.length, items }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, i18n.locale))
  }
  const getDuplicateKey = (entry: LibraryEntry) => {
    const musicInfo = entry.musicInfo
    return [musicInfo.name, musicInfo.singer, musicInfo.meta.albumName].map(normalize).join('|')
  }
  const buildDuplicateGroups = () => {
    const map = new Map<string, LibraryEntry[]>()
    for (const entry of entries) {
      const key = getDuplicateKey(entry)
      if (!key.replaceAll('|', '')) continue
      const list = map.get(key)
      if (list) {
        list.push(entry)
      } else {
        map.set(key, [entry])
      }
    }
    return Array.from(map.entries())
      .filter(([, items]) => items.length > 1)
      .map(([key, items]) => ({ key, name: buildMusicName('%name% - %singer%', items[0].musicInfo.name, items[0].musicInfo.singer), count: items.length, items }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, i18n.locale))
  }
  const getMetadataIssues = (musicInfo: AnyListen.Music.MusicInfo) => {
    const issues: string[] = []
    if (musicInfo.meta.unparsed) issues.push(i18n.t('media_library.issue.unparsed'))
    if (!musicInfo.singer.trim()) issues.push(i18n.t('media_library.issue.singer'))
    if (!musicInfo.meta.albumName.trim()) issues.push(i18n.t('media_library.issue.album'))
    if (!musicInfo.interval) issues.push(i18n.t('media_library.issue.interval'))
    return issues
  }

  const artistGroups = $derived(buildGroups('artist'))
  const albumGroups = $derived(buildGroups('album'))
  const folderGroups = $derived(buildGroups('folder'))
  const duplicateGroups = $derived(buildDuplicateGroups())
  const metadataEntries = $derived(entries.filter((entry) => getMetadataIssues(entry.musicInfo).length))
  const maintenanceLists = $derived(
    $userListsAll.filter((listInfo) => listInfo.type === 'local' || listInfo.type === 'remote' || listInfo.type === 'online')
  )
  const totalArtists = $derived(artistGroups.filter((group) => group.name != i18n.t('media_library.unknown')).length)
  const totalAlbums = $derived(albumGroups.filter((group) => group.name != i18n.t('media_library.unknown')).length)
  const localCount = $derived(entries.filter((entry) => entry.musicInfo.isLocal).length)
  const onlineCount = $derived(entries.length - localCount)
  const currentGroups = $derived.by(() => {
    switch (activeTab) {
      case 'artist':
        return artistGroups
      case 'album':
        return albumGroups
      case 'folder':
        return folderGroups
      default:
        return []
    }
  })
  const filteredEntries = $derived.by(() => {
    let list = activeTab == 'metadata' ? metadataEntries : entries
    if (activeTab == 'artist' || activeTab == 'album' || activeTab == 'folder') {
      const group = currentGroups.find((item) => item.key == selectedGroup)
      list = group?.items ?? []
    }
    const text = normalize(searchText)
    if (text) {
      list = list.filter((entry) => {
        const musicInfo = entry.musicInfo
        return [musicInfo.name, musicInfo.singer, musicInfo.meta.albumName, entry.listName, getMusicFolder(musicInfo)]
          .map(normalize)
          .some((value) => value.includes(text))
      })
    }
    return list
  })
  const shownEntries = $derived(filteredEntries.slice(0, 500))

  const loadLibrary = async () => {
    loading = true
    try {
      await getAllList()
      const lists = getUserListsAll().filter((listInfo) => listInfo.id != LIST_IDS.LAST_PLAYED)
      const result = await Promise.all(
        lists.map(async (listInfo) => {
          const musics = await getListMusics(listInfo.id, true)
          return musics.map((musicInfo) => ({
            key: `${listInfo.id}:${musicInfo.id}`,
            listId: listInfo.id,
            listName: listInfo.name,
            listType: listInfo.type,
            musicInfo,
          }))
        })
      )
      entries = result.flat()
      if (!selectedGroup || !currentGroups.some((group) => group.key == selectedGroup)) {
        selectedGroup = currentGroups[0]?.key ?? ''
      }
    } catch (err) {
      showNotify(i18n.t('media_library.load_failed', { msg: (err as Error).message }))
    } finally {
      loading = false
    }
  }

  const handleTabChange = (tab: TabId) => {
    activeTab = tab
    selectedGroup = ''
    searchText = ''
  }

  const playEntry = (entry: LibraryEntry) => {
    void playLocalListMusic(entry.listId, entry.musicInfo)
  }

  const openEntryFolder = (entry: LibraryEntry) => {
    if (!entry.musicInfo.isLocal) return
    void openDirInExplorer(entry.musicInfo.meta.filePath)
  }

  const removeEntries = async (items: LibraryEntry[], message: string) => {
    if (!items.length) return
    const confirm = await showSimpleConfirmModal(message, {
      confirmBtn: i18n.t('media_library.remove_confirm'),
    })
    if (!confirm) return
    for (const item of items) {
      await removeListMusics(item.listId, [item.musicInfo.id])
    }
    const removeKeys = new Set(items.map((item) => item.key))
    entries = entries.filter((entry) => !removeKeys.has(entry.key))
    showNotify(i18n.t('media_library.remove_done', { count: items.length }))
  }

  const removeDuplicateGroup = async (group: LibraryGroup) => {
    await removeEntries(group.items.slice(1), i18n.t('media_library.remove_duplicate_tip', { name: group.name, count: group.count - 1 }))
  }

  const repairEntry = async (entry: LibraryEntry) => {
    repairingKey = entry.key
    try {
      const parsed = await parseMusicMetadata(entry.listId, entry.musicInfo)
      if (!parsed) {
        showNotify(i18n.t('media_library.repair_skipped'))
        return
      }
      await updateListMusic(entry.listId, parsed)
      entries = entries.map((item) => (item.key == entry.key ? { ...item, musicInfo: parsed } : item))
      showNotify(i18n.t('media_library.repair_done'))
    } catch (err) {
      showNotify(i18n.t('media_library.repair_failed', { msg: (err as Error).message }))
    } finally {
      repairingKey = ''
    }
  }

  const repairAll = async () => {
    const items = metadataEntries.slice(0, 100)
    if (!items.length) return
    const confirm = await showSimpleConfirmModal(i18n.t('media_library.repair_all_tip', { count: items.length }), {
      confirmBtn: i18n.t('media_library.repair'),
    })
    if (!confirm) return
    for (const item of items) {
      await repairEntry(item)
    }
  }

  const syncList = async (listInfo: AnyListen.List.MyListInfo) => {
    syncingListId = listInfo.id
    try {
      await syncUserList(listInfo.id)
      await loadLibrary()
      showNotify(i18n.t('media_library.scan_done', { name: listInfo.name }))
    } catch (err) {
      showNotify(i18n.t('media_library.scan_failed', { msg: (err as Error).message }))
    } finally {
      syncingListId = ''
    }
  }

  onMount(() => {
    void loadLibrary()
    const unsub = musicLibraryEvent.on('anyListMusicChanged', () => {
      void loadLibrary()
    })
    return () => {
      unsub()
    }
  })
</script>

<div class="view-container media-library">
  <header class="page-header">
    <div>
      <h1>{$t('media_library')}</h1>
      <p>{$t('media_library.subtitle')}</p>
    </div>
    <Btn min loading={loading} onclick={loadLibrary}>{$t('media_library.refresh')}</Btn>
  </header>

  <section class="summary" aria-label={$t('media_library.summary')}>
    <div><strong>{entries.length}</strong><span>{$t('media_library.summary.tracks')}</span></div>
    <div><strong>{localCount}</strong><span>{$t('media_library.summary.local')}</span></div>
    <div><strong>{onlineCount}</strong><span>{$t('media_library.summary.online')}</span></div>
    <div><strong>{totalArtists}</strong><span>{$t('media_library.summary.artists')}</span></div>
    <div><strong>{totalAlbums}</strong><span>{$t('media_library.summary.albums')}</span></div>
  </section>

  <nav class="tabs" aria-label={$t('media_library.tabs')}>
    {#each tabs as tab}
      <button class:active={activeTab == tab.id} type="button" onclick={() => handleTabChange(tab.id)}>
        {$t(tab.label)}
      </button>
    {/each}
  </nav>

  {#if activeTab == 'scan'}
    <section class="scan-panel">
      {#each maintenanceLists as listInfo}
        <div class="scan-row">
          <div>
            <h3>{listInfo.name}</h3>
            <p>
              {#if listInfo.type == 'local'}
                {listInfo.meta.path}
              {:else if listInfo.type == 'remote'}
                {$t('media_library.remote_list')}
              {:else}
                {$t('media_library.online_list')}
              {/if}
            </p>
          </div>
          <div class="scan-meta">
            <span>{listInfo.type}</span>
            <span>{listInfo.meta.songCount} {$t('media_library.summary.tracks')}</span>
          </div>
          <Btn min loading={syncingListId == listInfo.id} onclick={() => syncList(listInfo)}>{$t('media_library.scan')}</Btn>
        </div>
      {:else}
        <Empty />
      {/each}
    </section>
  {:else}
    <section class="toolbar">
      <Input
        value={searchText}
        placeholder={$t('media_library.search_placeholder')}
        onchange={(val) => {
          searchText = val
        }}
      />
      {#if activeTab == 'metadata'}
        <Btn min disabled={!metadataEntries.length} onclick={repairAll}>{$t('media_library.repair_all')}</Btn>
      {/if}
    </section>

    {#if activeTab == 'artist' || activeTab == 'album' || activeTab == 'folder'}
      <section class="group-layout">
        <aside class="group-list">
          {#each currentGroups as group}
            <button type="button" class:active={selectedGroup == group.key} onclick={() => (selectedGroup = group.key)}>
              <span>{group.name}</span>
              <em>{group.count}</em>
            </button>
          {:else}
            <Empty />
          {/each}
        </aside>
        <div class="table-wrap">
          {@render musicTable(shownEntries)}
        </div>
      </section>
    {:else if activeTab == 'duplicate'}
      <section class="duplicate-list">
        {#each duplicateGroups as group}
          <div class="duplicate-group">
            <div class="duplicate-header">
              <div>
                <h3>{group.name}</h3>
                <p>{group.count} {$t('media_library.duplicate_count')}</p>
              </div>
              <Btn min onclick={() => removeDuplicateGroup(group)}>{$t('media_library.remove_redundant')}</Btn>
            </div>
            {@render musicTable(group.items)}
          </div>
        {:else}
          <Empty />
        {/each}
      </section>
    {:else}
      {@render musicTable(shownEntries)}
    {/if}
  {/if}
</div>

{#snippet musicTable(list: LibraryEntry[])}
  <div class="table" role="table">
    <div class="table-row table-head" role="row">
      <span>{$t('media_library.col.title')}</span>
      <span>{$t('media_library.col.artist')}</span>
      <span>{$t('media_library.col.album')}</span>
      <span>{$t('media_library.col.list')}</span>
      <span>{$t('media_library.col.source')}</span>
      <span>{$t('media_library.col.action')}</span>
    </div>
    {#each list as entry (entry.key)}
      {@const musicInfo = entry.musicInfo}
      <div class="table-row" role="row">
        <span class="primary">{musicInfo.name}</span>
        <span>{fallbackText(musicInfo.singer)}</span>
        <span>{fallbackText(musicInfo.meta.albumName)}</span>
        <span>{entry.listName}</span>
        <span>{buildSourceLabel(musicInfo)}</span>
        <span class="actions">
          <Btn min onclick={() => playEntry(entry)}>{$t('media_library.play')}</Btn>
          {#if musicInfo.isLocal}
            <Btn min onclick={() => openEntryFolder(entry)}>{$t('media_library.open_folder')}</Btn>
          {/if}
          {#if activeTab == 'metadata'}
            <Btn min loading={repairingKey == entry.key} onclick={() => repairEntry(entry)}>
              {$t('media_library.repair')}
            </Btn>
          {/if}
        </span>
      </div>
      {#if activeTab == 'metadata'}
        <div class="issue-row">
          {getMetadataIssues(musicInfo).join(' / ')}
        </div>
      {/if}
    {:else}
      <Empty />
    {/each}
  </div>
  {#if filteredEntries.length > shownEntries.length}
    <p class="limit-tip">{$t('media_library.limit_tip', { count: shownEntries.length, total: filteredEntries.length })}</p>
  {/if}
{/snippet}

<style lang="less">
  .media-library {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    gap: 14px;
    min-height: 0;
    padding: 18px;
    overflow: hidden;
  }

  .page-header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 14px;

    h1 {
      font-size: 22px;
      line-height: 1.35;
    }

    p {
      margin-top: 4px;
      color: var(--color-font-label);
    }
  }

  .summary {
    display: grid;
    flex: none;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: 8px;

    div {
      min-width: 0;
      padding: 12px;
      background-color: var(--color-primary-background);
    }

    strong,
    span {
      display: block;
    }

    strong {
      font-size: 18px;
    }

    span {
      margin-top: 4px;
      color: var(--color-font-label);
    }
  }

  .tabs {
    display: flex;
    flex: none;
    gap: 6px;
    min-width: 0;
    overflow-x: auto;

    button {
      flex: none;
      padding: 7px 12px;
      color: var(--color-font);
      cursor: pointer;
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: 8px;

      &.active {
        color: var(--color-primary);
        background-color: var(--color-primary-background);
      }
    }
  }

  .toolbar {
    display: flex;
    flex: none;
    gap: 10px;
    align-items: center;

    :global(.input) {
      width: 280px;
      max-width: 55%;
    }
  }

  .group-layout {
    display: grid;
    flex: auto;
    grid-template-columns: minmax(160px, 220px) minmax(0, 1fr);
    gap: 12px;
    min-height: 0;
  }

  .group-list,
  .table-wrap,
  .duplicate-list,
  .scan-panel {
    min-height: 0;
    overflow: auto;
  }

  .group-list {
    border-right: 1px solid var(--color-border);

    button {
      display: flex;
      width: 100%;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      padding: 9px 10px;
      color: var(--color-font);
      text-align: left;
      cursor: pointer;
      background: transparent;
      border: 0;

      &.active,
      &:hover {
        background-color: var(--color-primary-background-hover);
      }

      span {
        min-width: 0;
        .mixin-ellipsis-1();
      }

      em {
        flex: none;
        font-style: normal;
        color: var(--color-font-label);
      }
    }
  }

  .table {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    min-height: 0;
    overflow: auto;
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }

  .table-row {
    display: grid;
    grid-template-columns: minmax(160px, 1.5fr) minmax(110px, 1fr) minmax(120px, 1fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(160px, auto);
    gap: 10px;
    align-items: center;
    min-height: 42px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--color-border);

    > span {
      min-width: 0;
      .mixin-ellipsis-1();
    }

    .primary {
      color: var(--color-font);
    }
  }

  .table-head {
    position: sticky;
    top: 0;
    z-index: 1;
    min-height: 36px;
    color: var(--color-font-label);
    background-color: var(--color-primary-background);
  }

  .actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }

  .issue-row {
    padding: 0 10px 8px;
    margin-top: -4px;
    font-size: 12px;
    color: var(--color-font-error);
    border-bottom: 1px solid var(--color-border);
  }

  .duplicate-list {
    display: flex;
    flex-flow: column nowrap;
    gap: 14px;
  }

  .duplicate-group {
    flex: none;
  }

  .duplicate-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;

    h3 {
      font-size: 15px;
    }

    p {
      margin-top: 3px;
      color: var(--color-font-label);
    }
  }

  .scan-panel {
    display: flex;
    flex-flow: column nowrap;
    gap: 1px;
    overflow: hidden auto;
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }

  .scan-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 12px;
    align-items: center;
    padding: 12px;
    background-color: var(--color-primary-background);

    h3,
    p {
      min-width: 0;
      .mixin-ellipsis-1();
    }

    p,
    .scan-meta {
      color: var(--color-font-label);
    }
  }

  .scan-meta {
    display: flex;
    flex-flow: column nowrap;
    gap: 3px;
    text-align: right;
  }

  .limit-tip {
    flex: none;
    margin-top: 8px;
    color: var(--color-font-label);
  }

  @media (max-width: 760px) {
    .summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .group-layout {
      grid-template-columns: 1fr;
    }

    .group-list {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      border-right: 0;

      button {
        flex: 0 0 160px;
      }
    }

    .table-row {
      grid-template-columns: minmax(150px, 1fr) minmax(90px, 0.8fr) minmax(120px, auto);

      span:nth-child(3),
      span:nth-child(4),
      span:nth-child(5) {
        display: none;
      }
    }

    .scan-row {
      grid-template-columns: 1fr;
    }

    .scan-meta {
      text-align: left;
    }
  }
</style>
