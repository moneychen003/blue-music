<script lang="ts">
  import { getSourceId, urlParamKeyMap, useResourceList, type SourceType, type ViewType } from '../shared.svelte'
  import { location, query } from '@/plugins/routes'
  import { untrack } from 'svelte'
  import List from './list/List.svelte'
  import Source from '../Source.svelte'
  import { replaceRoute } from '@/modules/resource/actions'
  // import Header from './list/header/Header.svelte'

  let resourceList = useResourceList('topSongs')
  let sList = $derived(resourceList.val.topSongs?.map((s) => ({ ...s, sId: getSourceId(s) })) ?? [])
  let activeSource = $derived(
    $query[urlParamKeyMap.source] ? sList.find((s) => s.sId == $query[urlParamKeyMap.source]) : undefined
  )

  const to = (source: SourceType) => {
    replaceRoute($location == '/topSongs' ? '/topSongs' : '/online', {
      [urlParamKeyMap.type]: 'topSongs' satisfies ViewType,
      [urlParamKeyMap.source]: source.sId,
    })
  }

  $effect(() => {
    if (!sList.length) return
    if (activeSource && sList.some((s) => s.sId == activeSource.sId)) return
    const s = sList[0]
    untrack(() => {
      to(s)
    })
  })
</script>

<!-- <Header source={activeSource} /> -->
<div class="online-songlist-list">
  {#if sList.length}
    <Source
      list={sList}
      active={activeSource?.sId}
      onchange={(source) => {
        to(source)
      }}
    />
  {/if}
  {#if activeSource}
    <List source={activeSource} />
  {/if}
</div>

<style lang="less">
  .online-songlist-list {
    display: flex;
    flex-flow: column nowrap;
    height: 100%;
    min-height: 0;
    padding: 10px 18px 0;
  }
</style>
