<script lang="ts">
  import type { SettingListItem } from './settings'
  import SettingCommonItem from './SettingCommonItem.svelte'
  import { query } from '@/plugins/routes'
  import { tick } from 'svelte'

  let {
    item,
  }: {
    item: SettingListItem
  } = $props()
  let domItem: HTMLDivElement | null = $state(null)
  const itemId = $derived(item.type === 'component' ? item.name : item.field)
  const focused = $derived($query.focus == itemId)

  $effect(() => {
    if (!focused) return
    void tick().then(() => {
      domItem?.scrollIntoView({ block: 'center' })
    })
  })
</script>

<div bind:this={domItem} class="settings-item" class:focused>
  {#if item.type === 'component'}
    <item.component />
  {:else}
    <SettingCommonItem {item} />
  {/if}
</div>

<style lang="less">
  .settings-item {
    border-radius: @radius-border;
    transition: background-color @transition-normal, box-shadow @transition-normal;

    &.focused {
      background-color: var(--color-primary-background-hover);
      box-shadow: inset 3px 0 0 var(--color-primary);
    }
  }
</style>
