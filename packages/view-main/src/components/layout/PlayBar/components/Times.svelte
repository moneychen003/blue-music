<script lang="ts">
  import { duration, progress } from '@/modules/player/reactive.svelte'
</script>

<div class="times">
  <span>{$progress.nowPlayTimeStr}</span>
  <span class="dv">/</span>
  <span>{$duration.label}</span>
</div>

<style lang="less">
  .times {
    flex: none;
    padding-left: 10px;
    font-size: 13px;
    color: var(--color-550);
  }
</style>
