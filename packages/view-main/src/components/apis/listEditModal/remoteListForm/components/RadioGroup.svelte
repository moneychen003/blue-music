<script lang="ts">
  import type { Snippet } from 'svelte'
  import TitleContent from './TitleContent.svelte'

  let {
    name,
    desc,
    children,
  }: {
    name?: string
    desc?: string
    children?: Snippet
  } = $props()
</script>

<TitleContent {name} {desc}>
  <div class="settings-item-radio-group">
    {#if children}
      {@render children()}
    {/if}
  </div>
</TitleContent>

<style lang="less">
  .settings-item-radio-group {
    display: flex;
    flex-flow: row wrap;
    gap: 8px;
    margin-top: 5px;
    margin-bottom: 5px;
    margin-left: 16px;
  }
</style>
