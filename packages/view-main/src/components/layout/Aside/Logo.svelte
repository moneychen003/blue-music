<script lang="ts">
  import { windowDarg } from '@/shared/browser/widnow.svelte'
</script>

{#snippet logo()}
  <svg class="header-logo" aria-hidden="true" viewBox="0 0 1692.4 253.96" width="90%">
    <use xlink:href="#icon-header-logo2" />
  </svg>
{/snippet}

{#if import.meta.env.VITE_IS_DESKTOP}
  <div class="aside-logo drag-no-any-modal">
    {@render logo()}
  </div>
{/if}
{#if import.meta.env.VITE_IS_WEB}
  <div class="aside-logo" {@attach windowDarg}>
    {@render logo()}
  </div>
{/if}

<style lang="less">
  .aside-logo {
    display: flex;
    flex-flow: row nowrap;
    gap: 8px;
    align-items: center;
    height: @height-toolbar;
    padding: 0 20px;
    // font-weight: bold;
    color: var(--color-primary);
    svg {
      filter: drop-shadow(0 0 4px rgb(0 0 0 / 16%));
    }
  }
  .header-logo {
    min-width: 116px;
    max-width: 156px;
    // color: var(--color-primary-dark-100-alpha-200);
  }
  // .header-name {
  //   min-width: 86px;
  //   max-width: 120px;
  // }
</style>
