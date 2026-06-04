<script lang="ts">
  import { fade } from 'svelte/transition'
  import LyricPlayer from './LyricPlayer.svelte'
  let { introend }: { introend: boolean } = $props()
</script>

<div class="right-lyric">
  {#if introend}
    <div in:fade={{ delay: 5 }} class="right-lyric-content">
      <LyricPlayer />
    </div>
  {/if}
</div>

<style lang="less">
  .right-lyric {
    position: relative;
    flex: auto;
    contain: strict;
  }
  .right-lyric-content {
    position: absolute;
    inset: 0;
    // margin-right: 20px;
  }
</style>
