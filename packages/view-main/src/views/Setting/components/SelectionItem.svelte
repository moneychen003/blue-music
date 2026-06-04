<script lang="ts" generics="T extends string | number">
  import Selection from '@/components/base/Selection.svelte'
  import TitleContent from './TitleContent.svelte'
  let {
    name,
    desc,
    value,
    list,
    onchange,
  }: {
    name: string
    desc?: string
    value: T
    list: Array<{ label: string; value: T }>
    onchange: (value: T) => void
  } = $props()
</script>

<TitleContent {name} {desc}>
  <div class="settings-item-selection">
    <Selection {value} {list} itemkey="value" itemname="label" {onchange} />
  </div>
</TitleContent>

<style lang="less">
  .settings-item-selection {
    // :global {
    //   .select {
    //     // margin-top: 5px;
    //     // font-size: 14px;
    //   }
    // }
    margin-left: 16px;
  }
</style>
