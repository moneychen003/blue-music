<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import { musicInfo } from '@/modules/player/reactive.svelte'
  import { collectMusic, setCollectStatus, uncollectMusic } from '@/modules/player/store/playerActions'
  import { t } from '@/plugins/i18n'

  const toggleCollect = async () => {
    if (!$musicInfo.id) return
    if ($musicInfo.collect) {
      uncollectMusic()
      setCollectStatus(false)
      return
    }
    await collectMusic()
    setCollectStatus(true)
  }
</script>

<div class="icon" class:active={$musicInfo.collect}>
  <Btn icon link disabled={!$musicInfo.id} onclick={toggleCollect} aria-label={$musicInfo.collect ? $t('player__uncollect') : $t('player__collect')}>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 512 512">
      <use xlink:href="#icon-love" />
    </svg>
  </Btn>
</div>

<style lang="less">
  .icon :global {
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      color: inherit !important;
      opacity: 0.5;
      transition-property: opacity, color;

      &:hover {
        opacity: 0.9;
      }

      &:active {
        opacity: 1;
      }
    }
  }

  .active :global(.btn) {
    color: var(--color-primary) !important;
    opacity: 0.95;
  }
</style>
