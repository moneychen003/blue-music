<script lang="ts">
  import Header from './Header.svelte'
  import { location, query } from '@/plugins/routes'
  import { urlParamKeyMap, viewResourceMap, viewTypes } from './shared.svelte'
  import Search from './Search/Search.svelte'
  import Songlist from './Songlist/Songlist.svelte'
  import TopSongs from './TopSongs/TopSongs.svelte'
  import Album from './Album/Album.svelte'
  import Singer from './Singer/Singer.svelte'
  import { resourceList } from '@/modules/extension/reactive.svelte'
  import Empty from '@/components/material/Empty.svelte'
  import { setLastHistory } from '@/modules/resource/actions'

  type ViewType = (typeof viewTypes)[number] | undefined
  let activeView = $derived.by<ViewType>(() => {
    let type = $query[urlParamKeyMap.type] as ViewType
    type = viewTypes.find((t) => t == type)
    const resList = Object.keys($resourceList.resources) as AnyListen.Extension.ResourceAction[]
    if (type) {
      const resKeys = viewResourceMap[type]
      if (resKeys.some((r) => resList.includes(r))) {
        return type
      }
    }
    type = Object.entries(viewResourceMap).find(([, resKeys]) => {
      return resKeys.some((r) => resList.includes(r))
    })?.[0] as ViewType
    if (type) return type
  })

  $effect(() => {
    setLastHistory($location, { ...$query })
  })
</script>

<div class="view-container container">
  {#if activeView}
    <Header activeview={activeView} />
    {#if activeView == 'search'}
      <Search />
    {:else if activeView == 'songlist'}
      <Songlist />
    {:else if activeView == 'topSongs'}
      <TopSongs />
    {:else if activeView == 'album'}
      <Album />
    {:else if activeView == 'singer'}
      <Singer />
    {/if}
  {:else}
    <Empty />
  {/if}
</div>

<style lang="less">
  .container {
    // padding: 10px 15px;
    display: flex;
    flex-flow: column nowrap;
    > :global(div) {
      min-height: 0;
    }
  }
</style>
