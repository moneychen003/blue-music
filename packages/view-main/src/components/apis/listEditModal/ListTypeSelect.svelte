<script lang="ts">
  import Radio from '@/components/base/Radio.svelte'
  import { t } from '@/plugins/i18n'
  let {
    value = $bindable(),
    disabled,
  }: {
    value: AnyListen.List.UserListType
    disabled: boolean
  } = $props()

  const listType: AnyListen.List.UserListType[] = ['general', 'local', 'remote', 'online']
</script>

<div class="container">
  {#each listType as type (type)}
    <Radio
      id={`new_list_type_${type}`}
      value={type}
      name="new_list_type"
      disabled={disabled || type == 'online'}
      label={$t(`edit_list_modal__list_${type}`)}
      checked={value == type}
      onselect={(val) => {
        value = val
      }}
    />
  {/each}
</div>

<style lang="less">
  .container {
    display: flex;
    flex-flow: row wrap;
    gap: 15px;
    padding-bottom: 6px;
    font-size: 14px;
  }
</style>
