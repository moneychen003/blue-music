<script lang="ts">
  import PlayerProgressBar from '@/components/common/PlayerProgressBar.svelte'
  import { duration, progress } from '@/modules/player/reactive.svelte'
</script>

<div class="middle-play-progress">
  <span>{$progress.nowPlayTimeStr}</span>
  <div class="progress">
    <PlayerProgressBar />
  </div>
  <!-- <span style="margin: 0 1px;">/</span> -->
  <span>{$duration.label}</span>
</div>

<style lang="less">
  .middle-play-progress {
    // padding-left: 10px;
    display: flex;
    // position: relative;
    flex: none;
    flex-flow: row nowrap;
    align-items: center;
    width: 30%;
    font-size: 13px;
    color: var(--color-550);
  }
  .progress {
    // width: 160px;
    position: relative;
    // position: absolute;
    // top: 0;
    // left: 0;
    // width: 100%;
    flex: auto;
    padding: 8px 0;
    // padding-bottom: 6px;
    margin: 0 8px;
  }
</style>
