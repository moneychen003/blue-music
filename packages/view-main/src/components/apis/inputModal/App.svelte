<script lang="ts">
  import Modal from '@/components/material/Modal.svelte'
  import Btn from '@/components/base/Btn.svelte'
  import { extensionList } from '@/modules/extension/reactive.svelte'
  import { extI18n } from '@/modules/extension/i18n'
  import { t } from '@/plugins/i18n'
  import { CANCELED_ERROR_MSG } from '@any-listen/common/constants'
  import InputItem from '@/components/material/form/InputItem.svelte'

  let {
    onafterleave,
  }: {
    onafterleave: () => void
  } = $props()

  let visible = $state(false)
  let options = $state.raw<AnyListen.IPCCommon.InputDialogOptions>({})
  let errorMessage = $state('')
  let value = $state('')
  let extId = $state('')
  let promise: [(result: string) => void, (error: Error) => void] | null = null
  let extensionName = $derived.by(() => {
    if (!extId) return ''
    const ext = $extensionList.find((ext) => ext.id === extId)
    return ext ? extI18n.t(extId, ext.name) : ''
  })

  const closeModal = () => {
    visible = false
  }

  const handleComfirm = async () => {
    errorMessage &&= ''
    if (options.validateInput) {
      const err = await options.validateInput(value)
      if (err) {
        // eslint-disable-next-line require-atomic-updates
        errorMessage = err
        return
      }
    }
    promise?.[0](value)
    closeModal()
  }

  const handleAfterLeave = () => {
    onafterleave?.()
  }
  export const show = async (_extId: string, _options: AnyListen.IPCCommon.InputDialogOptions) => {
    extId = _extId
    options = _options
    value = _options.value || ''
    visible = true
    return new Promise<string>((resolve, reject) => {
      promise = [resolve, reject]
    })
  }
  export const hide = () => {
    closeModal()
    promise?.[1](new Error(CANCELED_ERROR_MSG))
  }

  // $effect(() => {
  //   if (!visible) return
  // })
</script>

<Modal
  bind:visible
  teleport="#root"
  minheight="8.75rem"
  bgclose={false}
  closebtn={false}
  title={extensionName}
  onafterleave={handleAfterLeave}
>
  <div class="main">
    <InputItem
      autofocus
      desc={options.prompt}
      id={`input_${extId}`}
      name={options.title}
      bind:value
      password={options.password}
      placeholder={options.placeholder}
    />
    <p class="error-tip">{errorMessage}</p>
  </div>
  <div class="footer">
    <Btn onclick={hide}>{$t('btn_cancel')}</Btn>
    <Btn onclick={handleComfirm}>{$t('btn_confirm')}</Btn>
  </div>
</Modal>

<style lang="less">
  .main {
    flex: auto;
    // max-width: 320px;
    min-width: 320px;
    min-height: 40px;
    padding: 15px 15px 0;
    font-size: 14px;
    white-space: pre-line;
  }

  .error-tip {
    min-height: 36px;
    margin-top: 8px;
    font-size: 12px;
    color: var(--color-font-error);
  }

  .footer {
    display: flex;
    flex: none;
    flex-flow: row nowrap;
    gap: 15px;
    justify-content: flex-end;
    padding: 15px;

    :global(.btn) {
      min-width: 70px;
    }
  }
</style>
