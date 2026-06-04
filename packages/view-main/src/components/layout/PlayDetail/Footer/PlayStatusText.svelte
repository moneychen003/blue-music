<script lang="ts">
  import { playerPlaying, statusText } from '@/modules/player/reactive.svelte'
  let status = $derived($playerPlaying ? '' : $statusText)
</script>

<div class="play-status">
  {status}
</div>

<style lang="less">
  .play-status {
    position: absolute;
    bottom: 3px;
    left: 0;
    box-sizing: content-box;
    width: 100%;
    height: 16px;
    font-size: 12px;
    color: var(--color-font-label);
    text-align: center;
    pointer-events: none;

    .mixin-ellipsis-1();
  }
</style>
