<script lang="ts">
  import Pagination from '@/components/material/Pagination.svelte'
  import { getLocation } from '@/plugins/routes'
  import { urlParamKeyMap } from '../../shared.svelte'
  import { verticalScrollbar } from '@/shared/compositions/verticalScrollbar.svelte'
  import ListItem from './ListItem.svelte'
  import Loading from '@/components/base/Loading.svelte'
  import Empty from '@/components/material/Empty.svelte'
  import { pushRoute } from '@/modules/resource/actions'

  let {
    list,
    listInfo,
    sId,
    onreload,
  }: {
    list: AnyListen.Resource.SongListItem[]
    listInfo: {
      total: number
      page: number
      limit: number
      loading: boolean
      error: boolean
    }
    sId: string
    onreload?: () => void
  } = $props()
</script>

<div class="songlist-list">
  <div class="list-container">
    <ul {@attach verticalScrollbar({ offset: '0.22rem' })}>
      {#each list as item (item.id)}
        <ListItem {item} {sId} />
      {/each}
    </ul>
  </div>
  {#if listInfo.total > listInfo.limit}
    <div class="pagination">
      <Pagination
        count={listInfo.total}
        page={listInfo.page}
        limit={listInfo.limit}
        onclick={(page) => {
          const loc = getLocation()
          pushRoute(loc.location, {
            ...loc.query,
            [urlParamKeyMap.page]: page,
          })
        }}
      />
    </div>
  {/if}
  {#if !list.length && !listInfo.loading && !listInfo.error}
    <Empty />
  {/if}
  <Loading loading={listInfo.loading} error={listInfo.error} {onreload} />
</div>

<style lang="less">
  .songlist-list {
    position: relative;
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .list-container {
    position: relative;
    display: flex;
    flex: auto;
    min-height: 0;
    // margin-top: 15px;

    ul {
      display: grid;
      flex: 1;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      align-content: flex-start;
      min-height: 0;
      padding: 0 16px 16px;
      overflow: hidden;
    }
  }

  .pagination {
    display: flex;
    flex: none;
    justify-content: center;
    padding: 10px 0;
  }
</style>
