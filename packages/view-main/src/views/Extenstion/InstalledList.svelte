<script lang="ts">
  import Empty from '@/components/material/Empty.svelte'
  import { extensionList } from '@/modules/extension/reactive.svelte'
  import ListItem from './ListItem.svelte'
  import type { viewTypes } from './shared'
  import { verticalScrollbar } from '@/shared/compositions/verticalScrollbar.svelte'
  import { showExtensionDetailModal } from '@/components/apis/extensionDetail'
  let { type }: { type: Omit<(typeof viewTypes)[number], 'online'> } = $props()
  let list = $derived(
    type == 'installed'
      ? $extensionList
      : type == 'enabled'
        ? $extensionList.filter((e) => e.enabled)
        : $extensionList.filter((e) => !e.enabled)
  )
</script>

<div class="container">
  {#if list.length}
    <ul class="list" {@attach verticalScrollbar({ offset: '0.22rem' })}>
      {#each list as ext (ext.id)}
        <ListItem
          {ext}
          onshowdetail={async () => {
            await showExtensionDetailModal(ext)
          }}
        />
      {/each}
    </ul>
  {:else}
    <Empty />
  {/if}
</div>

<style lang="less">
  .container {
    position: relative;
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    min-height: 0;
    margin-top: 15px;
  }
  .list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    min-height: 0;
    padding: 0 16px 16px;
    overflow: hidden;
  }
</style>
