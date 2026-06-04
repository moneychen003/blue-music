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
      iconSize = `${Math.trunc(height * 0.52)}px`
      iconSize2 = `${Math.trunc(height * 0.65)}px`
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
    gap: 16px;
    align-items: center;
    height: 100%;
    padding-right: 18px;
    padding-left: 18px;
  }
  .btn {
    display: flex;
    flex: none;
    // padding: 5px;
    padding: 0;
    align-items: center;
    justify-content: center;
    color: var(--color-font-label);
    cursor: pointer;
    background-color: transparent;
    border: none;
    opacity: 1;
    // height: 52%;
    // margin-top: -2px;
    transition: @transition-fast;
    border-radius: 999px;
    transition-property: color, opacity, background-color, transform;

    &:nth-child(2) {
      width: 42px;
      height: 42px;
      color: rgb(255 255 255);
      background-color: var(--color-primary);
      box-shadow: 0 8px 18px rgb(236 65 65 / 24%);
    }

    // svg {
    //   filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
    // }
    &:hover {
      color: var(--color-primary);
      opacity: 1;
      transform: translateY(-1px);

      &:nth-child(2) {
        color: rgb(255 255 255);
        background-color: var(--color-primary-dark-100);
      }
    }
    &:active {
      opacity: 0.85;
      transform: translateY(0);
    }
  }
</style>
