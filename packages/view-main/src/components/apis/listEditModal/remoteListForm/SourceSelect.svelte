<script lang="ts">
  import Radio from '@/components/base/Radio.svelte'
  import { extT } from '@/modules/extension/i18n'
  import { resourceList } from '@/modules/extension/reactive.svelte'
  import { t } from '@/plugins/i18n'
  let {
    value = $bindable(),
    disabled,
  }: {
    value: AnyListen.Extension.ListProviderResource | null
    disabled?: boolean
  } = $props()

  let list = $derived(
    $resourceList.listProvider.map((p) => ({
      value: `${p.extensionId}_${p.id}`,
      name: $extT(p.extensionId, p.name),
      extensionId: p.extensionId,
      source: p.id,
      provider: p,
    }))
  )
</script>

<div class="container">
  <div class="label">{$t('edit_list_modal.remote_list.form_source')}</div>
  <div class="list">
    {#each list as item (item.value)}
      <Radio
        id={item.value}
        value={item.value}
        name="new_list_source"
        {disabled}
        label={item.name}
        checked={value?.extensionId == item.provider.extensionId && value?.id == item.provider.id}
        onselect={() => {
          value = item.provider
        }}
      />
    {/each}
  </div>
</div>

<style lang="less">
  .container {
    display: flex;
    flex-flow: column wrap;
    gap: 3px;
    // padding-bottom: 6px;
  }
  .label {
    font-size: 14px;
  }
  .list {
    display: flex;
    flex-flow: row wrap;
    gap: 15px;
    font-size: 14px;
  }
</style>
