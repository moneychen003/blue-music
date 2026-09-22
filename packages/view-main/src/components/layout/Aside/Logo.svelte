<script lang="ts">
  import brandIcon from '@/assets/jide-icon.png?inline'
  import { windowDarg } from '@/shared/browser/widnow.svelte'
</script>

{#snippet brand()}
  <img src={brandIcon} alt="" width="34" height="34" />
  <div><strong>技得音乐</strong><span>JIDE MUSIC</span></div>
{/snippet}

{#if import.meta.env.VITE_IS_DESKTOP}
  <div class="aside-logo drag-no-any-modal">{@render brand()}</div>
{:else}
  <div class="aside-logo" {@attach windowDarg}>{@render brand()}</div>
{/if}

<style lang="less">
  .aside-logo { display: flex; flex: none; align-items: center; gap: 11px; min-height: 62px; padding: 0 22px 8px; }
  img { flex: none; border-radius: 10px; }
  div > div { display: flex; flex-direction: column; gap: 4px; }
  strong { font-size: 19px; letter-spacing: 1px; color: var(--color-font); }
  span { font-size: 9px; letter-spacing: 2.2px; color: var(--color-font-label); }
</style>
