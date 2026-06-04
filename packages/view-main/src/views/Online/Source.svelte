<script lang="ts">
  import { extT } from '@/modules/extension/i18n'
  import type { SourceType } from './shared.svelte'

  let {
    list,
    active,
    onchange,
  }: {
    list: SourceType[]
    active?: string
    onchange: (source: SourceType) => void
  } = $props()
</script>

<div class="source-list">
  <div class="list">
    {#each list as source (source.sId)}
      <div
        role="button"
        tabindex="0"
        class="list-item"
        class:active={source.sId == active}
        aria-label={$extT(source.extensionId, source.name)}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            onchange(source)
          }
        }}
        onclick={() => {
          if (source.sId == active) return
          onchange(source)
        }}
      >
        {$extT(source.extensionId, source.name)}
      </div>
    {/each}
  </div>
</div>

<style lang="less">
  .source-list {
    flex: none;
    width: 100%;
    min-width: 0;
    margin-bottom: 8px;
    overflow: hidden;
    background-color: transparent;

    .list {
      display: flex;
      gap: 6px;
      height: 32px;
      overflow-x: auto;
      overflow-y: hidden;
    }
    .list-item {
      position: relative;
      display: flex;
      flex: none;
      align-items: center;
      height: 28px;
      padding: 0 10px;
      font-size: 13px;
      line-height: 28px;
      color: rgb(49 49 51);
      background-color: transparent;
      border-radius: 4px;
      transition: 0.3s ease;
      transition-property: color, background-color;
      .mixin-ellipsis-1();

      &:hover:not(.active) {
        cursor: pointer;
        background-color: var(--color-primary-background-hover);
      }
      &.active {
        color: var(--color-primary);
        font-weight: 600;
        background-color: rgb(236 65 65 / 10%);
      }

    }
  }
</style>
