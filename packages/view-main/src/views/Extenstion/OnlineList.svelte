<script lang="ts">
  import Empty from '@/components/material/Empty.svelte'
  import { useOnlineExtensionList } from '@/modules/extension/reactive.svelte'
  import { getOnlineExtensionList } from '@/modules/extension/store/actions'

  // import { extensionList } from '@/modules/extension/reactive'
  import ListItemOnline from './ListItemOnline.svelte'
  import { t } from '@/plugins/i18n'
  import { verticalScrollbar } from '@/shared/compositions/verticalScrollbar.svelte'
  import { showExtensionDetailModal } from '@/components/apis/extensionDetail'
  let loading = $state(false)

  const list = useOnlineExtensionList()

  $effect(() => {
    loading = true
    void getOnlineExtensionList().finally(() => {
      loading = false
    })
  })
</script>

<div class="container">
  {#if list.val.length}
    <ul class="list" {@attach verticalScrollbar({ offset: '0.22rem' })}>
      {#each list.val as ext (ext.id)}
        <ListItemOnline
          {ext}
          onshowdetail={async () => {
            await showExtensionDetailModal(ext)
          }}
        />
      {/each}
    </ul>
  {:else}
    <Empty label={loading ? $t('loading') : ''} />
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
