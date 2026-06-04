<script lang="ts">
  import { skipNext, skipPrev, togglePlay } from '@/modules/player/actions'
  import { playing } from '@/modules/player/reactive.svelte'
  import { t } from '@/plugins/i18n'
  import { onDomSizeChanged } from '@any-listen/web'
  import { onMount } from 'svelte'
  let domContainer: HTMLDivElement | null = $state(null)
  let iconSize = $state('42px')
  let iconSize2 = $state('46px')

  onMount(() => {
    if (!domContainer) return
    return onDomSizeChanged(domContainer, (width, height) => {
      iconSize = `${Math.trunc(height * 0.72)}px`
      iconSize2 = `${Math.trunc(height * 0.85)}px`
    })
  })
</script>

<div class="container" bind:this={domContainer}>
  <button class="btn" aria-label={$t('player__prev')} onclick={async () => skipPrev()}>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <use xlink:href="#icon-skip-prev" />
    </svg>
  </button>
  <button class="btn" aria-label={$playing ? $t('player__pause') : $t('player__play')} onclick={togglePlay}>
    {#if $playing}
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width={iconSize2} height={iconSize2} viewBox="0 0 24 24">
        <use xlink:href="#icon-pause" />
      </svg>
    {:else}
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width={iconSize2} height={iconSize2} viewBox="0 0 24 24">
        <use xlink:href="#icon-play" />
      </svg>
    {/if}
  </button>
  <button class="btn" aria-label={$t('player__next')} onclick={async () => skipNext()}>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <use xlink:href="#icon-skip-next" />
    </svg>
  </button>
</div>

<style lang="less">
  .container {
    display: flex;
    flex: none;
    flex-flow: row nowrap;
    gap: 18px;
    align-items: center;
    height: 100%;
    padding-right: 30px;
    padding-left: 30px;
  }
  .btn {
    display: flex;
    flex: none;
    // padding: 5px;
    padding: 0;
    color: var(--color-button-font);
    cursor: pointer;
    background-color: transparent;
    border: none;
    opacity: 1;
    transition: @transition-fast;
    transition-property: color, opacity;
    &:hover {
      opacity: 0.8;
    }
    &:active {
      opacity: 0.6;
    }
  }
</style>
