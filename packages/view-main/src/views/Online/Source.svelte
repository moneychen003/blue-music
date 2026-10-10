<script lang="ts">
  import { extT } from '@/modules/extension/i18n'
  import type { SourceType } from './shared.svelte'
  let { list, active, onchange }: { list: SourceType[]; active?: string; onchange: (source: SourceType) => void } = $props()
  let featured = $derived(list.slice(0, 3))
  const select = (id: string) => {
    const source = list.find((item) => item.sId === id)
    if (source && source.sId !== active) onchange(source)
  }
</script>

<div class="source-list" aria-label="音源选择">
  {#each featured as source, index (source.sId)}
    <button type="button" class:active={source.sId === active} aria-pressed={source.sId === active} onclick={() => select(source.sId)}>
      {index === 0 ? '推荐 · ' : ''}{$extT(source.extensionId, source.name)}
    </button>
  {/each}
  {#if list.length > 3}
    <label>
      <span class="label">全部音源</span>
      <select aria-label="选择其他音源" value={active ?? ''} onchange={(event) => select(event.currentTarget.value)}>
        {#each list as source (source.sId)}
          <option value={source.sId}>{$extT(source.extensionId, source.name)}</option>
        {/each}
      </select>
    </label>
  {/if}
</div>

<style lang="less">
  .source-list { display: flex; flex: none; flex-wrap: wrap; gap: 8px; align-items: center; min-width: 0; margin-bottom: 8px; }
  button, select { min-height: 32px; padding: 4px 10px; font: inherit; font-size: 13px; color: var(--color-font); background: var(--color-button-background); border: 1px solid transparent; border-radius: 6px; }
  button { cursor: pointer; }
  button.active { color: var(--color-primary); background: var(--color-primary-background-selected); }
  button:hover { background: var(--color-primary-background-hover); }
  button:focus-visible, select:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
  label { display: flex; gap: 6px; align-items: center; }
  .label { font-size: 12px; color: var(--color-font-label); }
</style>
