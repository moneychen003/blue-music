<script lang="ts">
  import { location, query } from '@/plugins/routes'
  import { setLastHistory } from '@/modules/resource/actions'
  import Header from '@/views/Online/Header.svelte'
  import TopSongs from '@/views/Online/TopSongs/TopSongs.svelte'

  $effect(() => {
    setLastHistory($location, { ...$query })
  })
</script>

<div class="view-container top-songs-page">
  <Header activeview="topSongs" />
  <TopSongs />
</div>

<style lang="less">
  .top-songs-page {
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    height: 100%;
    padding-top: 10px;
  }
</style>
