<script lang="ts">
  import Portal from '@/components/base/Portal.svelte'
  import type { SourceType } from '../../../shared.svelte'
  import Tags from './Tags.svelte'
  import Sorts from './Sorts.svelte'
  import OpenList from './OpenList.svelte'
  let { source }: { source?: SourceType } = $props()
</script>

<Portal to="#online-header-right">
  <div class="online-songlist-header-right">
    <OpenList {source} />
    <Tags {source} />
    <Sorts {source} />
  </div>
</Portal>

<style lang="less">
  .online-songlist-header-right {
    display: flex;
    flex-flow: row nowrap;
    gap: 10px;
    align-items: center;
  }
</style>
