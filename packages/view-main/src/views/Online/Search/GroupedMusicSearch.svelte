<script lang="ts">
  import Image from '@/components/base/Image.svelte'
  import Empty from '@/components/material/Empty.svelte'
  import Pagination from '@/components/material/Pagination.svelte'
  import { buildRequestKey, search } from '@/modules/resource/search/music/actions'
  import { pushRoute, replaceRoute } from '@/modules/resource/actions'
  import { query, type Params } from '@/plugins/routes'
  import { untrack } from 'svelte'
  import Source from '../Source.svelte'
  import {
    getSourceId,
    preferredMusicSearchSourceIds,
    urlParamKeyMap,
    type ResourceListType,
    type SourceType,
    type ViewType,
  } from '../shared.svelte'

  let {
    sourceList,
    mode,
  }: {
    sourceList: NonNullable<ResourceListType['musicSearch']>
    mode: 'album' | 'singer'
  } = $props()

  type GroupItem = {
    id: string
    title: string
    subtitle: string
    count: number
    pic: string | null
  }

  let groups = $state.raw<GroupItem[]>([])
  let listInfo = $state<{
    total: number
    page: number
    limit: number
    loading: boolean
    error: boolean
  }>({ total: 0, page: 1, limit: 60, loading: false, error: false })

  const getSourceRank = (sId: string) => {
    const index = preferredMusicSearchSourceIds.indexOf(sId)
    return index === -1 ? preferredMusicSearchSourceIds.length : index
  }
  const list = $derived(sourceList.map((s) => ({ ...s, sId: getSourceId(s) })).sort((a, b) => getSourceRank(a.sId) - getSourceRank(b.sId)))
  const activeSource = $derived(
    $query[urlParamKeyMap.source] ? list.find((s) => s.sId == $query[urlParamKeyMap.source]) : undefined
  )

  let requestParams: unknown[] = []
  const normalize = (text?: string | null) => text?.replace(/\s+/g, ' ').trim() ?? ''

  const buildGroups = (musics: AnyListen.Music.MusicInfoOnline[]) => {
    const map = new Map<string, GroupItem & { sampleNames: string[] }>()
    for (const music of musics) {
      const title = normalize(mode == 'album' ? music.meta.albumName : music.singer)
      if (!title) continue
      let item = map.get(title)
      if (!item) {
        item = {
          id: title,
          title,
          subtitle: '',
          count: 0,
          pic: music.meta.picUrl ?? null,
          sampleNames: [],
        }
        map.set(title, item)
      }
      item.count += 1
      if (!item.pic && music.meta.picUrl) item.pic = music.meta.picUrl
      if (item.sampleNames.length < 3 && !item.sampleNames.includes(music.name)) item.sampleNames.push(music.name)
    }
    return Array.from(map.values())
      .map(({ sampleNames, ...item }) => ({
        ...item,
        subtitle: sampleNames.join(' / '),
      }))
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
  }

  const to = (source: SourceType) => {
    const params: Params = {
      [urlParamKeyMap.type]: 'search' satisfies ViewType,
      [urlParamKeyMap.queryType]: mode,
      [urlParamKeyMap.source]: source.sId,
    }
    const text = $query[urlParamKeyMap.query] ?? ''
    if (text) params[urlParamKeyMap.query] = text
    replaceRoute('/online', params)
  }

  const openGroup = (item: GroupItem) => {
    const params: Params = {
      [urlParamKeyMap.type]: 'search' satisfies ViewType,
      [urlParamKeyMap.queryType]: 'music',
      [urlParamKeyMap.query]: item.title,
    }
    if (activeSource?.sId) params[urlParamKeyMap.source] = activeSource.sId
    pushRoute('/online', params)
  }

  const handleSearch = (page: number, text?: string) => {
    if (!activeSource) return
    const extId = activeSource.extensionId
    const sourceId = activeSource.id
    const keyword = text ?? $query[urlParamKeyMap.query] ?? ''
    listInfo.page = page
    requestParams = [page, keyword]
    const requestKey = buildRequestKey(extId, sourceId, page, listInfo.limit, keyword)
    const { promise, total, result } = search(extId, sourceId, keyword, '', page, listInfo.limit)
    listInfo.loading = !result
    listInfo.total = total
    if (result) {
      listInfo.error = false
      listInfo.total = result.total
      listInfo.limit = result.limit
      listInfo.page = result.page
      groups = buildGroups(result.list)
    }
    void promise
      .then((result) => {
        if (requestKey != buildRequestKey(extId, sourceId, result.page, listInfo.limit, keyword)) return
        listInfo.total = result.total
        listInfo.limit = result.limit
        listInfo.page = result.page
        listInfo.error = false
        groups = buildGroups(result.list)
      })
      .catch((err) => {
        console.log(err)
        if (requestKey != buildRequestKey(extId, sourceId, page, listInfo.limit, keyword)) return
        listInfo.error = true
        groups = []
      })
      .finally(() => {
        listInfo.loading = false
      })
  }

  $effect(() => {
    if (!list.length) return
    if (activeSource && list.some((s) => s.sId == activeSource.sId)) return
    const s = list[0]
    untrack(() => {
      to(s)
    })
  })

  $effect(() => {
    if (!activeSource) return
    let page = 1
    if ($query[urlParamKeyMap.page]) {
      let p = parseInt($query[urlParamKeyMap.page])
      if (Number.isNaN(p)) p = 1
      page = p
    }
    untrack(() => {
      handleSearch(page, $query[urlParamKeyMap.query] || '')
    })
  })
</script>

<div class="grouped-search">
  {#if list.length}
    <Source
      {list}
      active={activeSource?.sId}
      onchange={(source) => {
        to(source)
      }}
    />
  {/if}
  {#if groups.length}
    <div class="grid">
      {#each groups as item (item.id)}
        <button
          type="button"
          class="card"
          aria-label={item.title}
          onclick={() => {
            openGroup(item)
          }}
        >
          <div class="pic">
            <Image src={item.pic} icon={mode == 'album' ? 'albums' : 'dj'} />
          </div>
          <div class="meta">
            <strong>{item.title}</strong>
            {#if item.subtitle}
              <span>{item.subtitle}</span>
            {/if}
            <small>{item.count} 首</small>
          </div>
        </button>
      {/each}
    </div>
    <div class="pagination">
      <Pagination
        count={listInfo.total}
        page={listInfo.page}
        limit={listInfo.limit}
        onclick={(page) => {
          pushRoute('/online', {
            ...$query,
            [urlParamKeyMap.page]: page,
          })
        }}
      />
    </div>
  {:else if !listInfo.loading}
    <Empty />
  {/if}
</div>

<style lang="less">
  .grouped-search {
    display: flex;
    flex-flow: column nowrap;
    height: 100%;
    min-height: 0;
    padding: 10px 18px 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 10px;
    min-height: 0;
    padding: 10px 0;
    overflow: auto;
  }

  .card {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
    padding: 10px;
    color: var(--color-font);
    text-align: left;
    cursor: pointer;
    background-color: transparent;
    border: none;
    border-radius: @radius-border;
    transition: @transition-normal;
    transition-property: background-color, color;

    &:hover {
      color: var(--color-primary);
      background-color: var(--color-primary-background-hover);
    }
  }

  .pic {
    flex: none;
    width: 54px;
    height: 54px;
  }

  .meta {
    display: flex;
    min-width: 0;
    flex-flow: column nowrap;
    gap: 5px;
    line-height: 1.2;

    strong,
    span,
    small {
      .mixin-ellipsis-1();
    }

    strong {
      font-size: 14px;
      font-weight: 600;
    }

    span,
    small {
      color: var(--color-font-label);
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    padding: 8px 0 10px;
  }
</style>
