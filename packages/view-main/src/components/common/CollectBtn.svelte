<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import { showNotify } from '@/components/apis/notify'
  import { playerState } from '@/modules/player/store/state'
  import { musicInfo } from '@/modules/player/reactive.svelte'
  import { collectMusic, setCollectStatus, uncollectMusic } from '@/modules/player/store/playerActions'
  import { t } from '@/plugins/i18n'

  let pending = $state(false)
  const toggleCollect = async () => {
    const music = playerState.playMusicInfo?.musicInfo
    if (!music || pending) return
    const id = music.id
    const wasCollected = $musicInfo.collect
    pending = true
    try {
      const collected = wasCollected ? await uncollectMusic(music) : await collectMusic(music)
      // A slow write must never update the next track's favorite state.
      if ($musicInfo.id === id) setCollectStatus(collected)
    } catch {
      showNotify('收藏操作失败，状态未改变，请重试')
    } finally {
      pending = false
    }
  }

</script>

<div class="icon" class:active={$musicInfo.collect}>
  <Btn icon link disabled={!$musicInfo.id} loading={pending} aria-pressed={$musicInfo.collect} onclick={toggleCollect} aria-label={$musicInfo.collect ? $t('player__uncollect') : $t('player__collect')}>
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
        fill={$musicInfo.collect ? 'currentColor' : 'none'}
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </Btn>
</div>

<style lang="less">
  .icon :global {
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
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
