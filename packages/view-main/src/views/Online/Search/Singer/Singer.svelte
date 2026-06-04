<script lang="ts">
  import type { ResourceListType } from '../../shared.svelte'
  import GroupedMusicSearch from '../GroupedMusicSearch.svelte'

  let { sourceList }: { sourceList: NonNullable<ResourceListType['musicSearch']> } = $props()
</script>

<GroupedMusicSearch {sourceList} mode="singer" />

<style lang="less">
  .container {
  }
</style>
