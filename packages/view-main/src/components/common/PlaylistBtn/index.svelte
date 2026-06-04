<script lang="ts">
  import PopupBtn from '@/components/material/PopupBtn.svelte'
  import { t } from '@/plugins/i18n'
  // import Header from './Header.svelte'
  // import type { TabType } from './shared'
  import QueueList from './QueueList.svelte'
  import { tick } from 'svelte'

  let render = $state(false)
  // let activeTab = $state<TabType>('queue')
</script>

<PopupBtn
  height="32rem"
  aria-label={$t('player__list')}
  onvisible={(visible) => {
    void tick().then(() => {
      render = visible
    })
  }}
>
  <div class="icon">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 192 192">
      <use xlink:href="#icon-playlist" />
    </svg>
  </div>
  {#snippet content()}
    <div class="container">
      <!-- <Header bind:active={activeTab} /> -->
      {#if render}
        <!-- {#if activeTab == 'queue'} -->
        <QueueList />
        <!-- {:else} -->
        <!-- {/if} -->
      {/if}
    </div>
  {/snippet}
</PopupBtn>

<style lang="less">
  // .container {
  //   flex: none;
  //   height: 100%;
  // }

  .icon {
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    // color: var(--color-button-font);
    justify-content: center;
    width: 24px;
    padding: 0;
    cursor: pointer;
    transition: color @transition-normal;

    svg {
      opacity: 0.5;
      transition: @transition-fast;
      transition-property: opacity, color;
      // filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
    }
    &:hover {
      svg {
        opacity: 0.9;
      }
    }
    &:active {
      svg {
        opacity: 1;
      }
    }
  }

  .container {
    display: flex;
    flex-flow: column nowrap;
    gap: 10px;
    width: 500px;
    min-height: 300px;
    max-height: 100%;
  }
</style>
