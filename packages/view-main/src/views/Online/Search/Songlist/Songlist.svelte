<script lang="ts">
  import { getSourceId, urlParamKeyMap, type ResourceListType, type SourceType, type ViewType } from '../../shared.svelte'
  import Source from '../../Source.svelte'
  import { query, type Params } from '@/plugins/routes'
  import List from './List.svelte'
  import { untrack } from 'svelte'
  import { replaceRoute } from '@/modules/resource/actions'

  let { sourceList }: { sourceList: NonNullable<ResourceListType['songlistSearch']> } = $props()
  let list = $derived(sourceList.map((s) => ({ ...s, sId: getSourceId(s) })))
  let activeSource = $derived(
    $query[urlParamKeyMap.source] ? list.find((s) => s.sId == $query[urlParamKeyMap.source]) : undefined
  )

  const to = (source: SourceType) => {
    const params: Params = {
      [urlParamKeyMap.type]: 'search' satisfies ViewType,
      [urlParamKeyMap.queryType]: $query[urlParamKeyMap.queryType] ?? '',
      [urlParamKeyMap.source]: source.sId,
    }
    let text = $query[urlParamKeyMap.query] ?? ''
    if (text) params[urlParamKeyMap.query] = text
    replaceRoute('/online', params)
  }

  $effect(() => {
    if (!list.length) return
    if (activeSource && list.some((s) => s.sId == activeSource.sId)) return
    const s = list[0]
    untrack(() => {
      to(s)
    })
  })
</script>

<div class="online-search-music">
  {#if list.length}
    <Source
      {list}
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
  .online-search-music {
    display: flex;
    flex-flow: column nowrap;
    height: 100%;
    min-height: 0;
    padding: 10px 18px 0;
  }
</style>
