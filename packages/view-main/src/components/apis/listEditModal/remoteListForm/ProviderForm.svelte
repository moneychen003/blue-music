<script lang="ts">
  import { verticalScrollbar } from '@/shared/compositions/verticalScrollbar.svelte'
  import FormItem from './FormItem.svelte'

  let {
    list,
    onchange,
  }: {
    list: AnyListen.Extension.FormValueItem[]
    onchange: (field: string, value: unknown) => void
  } = $props()
</script>

<div class="settings-list-container">
  <div class="settings-list" {@attach verticalScrollbar({ offset: '0' })}>
    {#each list as item (item.field)}
      <FormItem
        {item}
        onchange={(val) => {
          onchange(item.field, val)
        }}
      />
    {/each}
  </div>
</div>

<style lang="less">
  .settings-list-container {
    display: flex;
    flex: auto;
    overflow: hidden;
  }
  .settings-list {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    gap: 4px;
    min-height: 0;
    padding-right: 16px;
    padding-bottom: 6px;
    // padding-right: 20px;
    // padding-left: 12px;
  }
</style>
