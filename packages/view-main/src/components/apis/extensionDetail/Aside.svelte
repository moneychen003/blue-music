<script lang="ts">
  import { t } from '@/plugins/i18n'
  import { verticalScrollbar } from '@/shared/compositions/verticalScrollbar.svelte'
  import { EXTENSION_ENGINE } from '@any-listen/common/constants'
  import Btn from '@/components/base/Btn.svelte'
  import { openUrl } from '@/shared/ipc/app'
  import { dateFormat } from '@/shared'

  let {
    ext,
    localExt,
  }: {
    ext: AnyListen.Extension.Extension | AnyListen.IPCExtension.RemoteOnlineDetail
    localExt?: AnyListen.Extension.Extension
  } = $props()
</script>

<div class="aside">
  <div class="aside__content" {@attach verticalScrollbar({ offset: '0' })}>
    <div class="meta-item">
      <span class="meta-label">{$t('extension.id')}</span>
      <span class="meta-value meta-id code">{ext.id}</span>
    </div>
    {#if ext.license}
      <div class="meta-item">
        <span class="meta-label">{$t('extension.license')}</span>
        <span class="meta-value">{ext.license}</span>
      </div>
    {/if}
    {#if ext.target_engine}
      <div class="meta-item">
        <span class="meta-label">{$t('extension.target_engine')}</span>
        <span class="meta-value"
          >{$t('extension.target_engine_val', { target: ext.target_engine, current: EXTENSION_ENGINE })}</span
        >
      </div>
    {/if}
    {#if localExt}
      <div class="meta-item">
        <span class="meta-label">{$t('extension.load_timestamp')}</span>
        <span class="meta-value">{localExt.loaded ? `${localExt.loadTimestamp}ms` : '-'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">{$t('extension.install_updated_timestamp')}</span>
        <span class="meta-value">{dateFormat(localExt.updatedTimestamp || localExt.installedTimestamp, 'Y-M-D h:m:s')}</span>
      </div>
    {/if}

    {#if 'create_timestamp' in ext}
      <div class="meta-item">
        <span class="meta-label">{$t('extension.create_timestamp')}</span>
        <span class="meta-value">{dateFormat(ext.create_timestamp, 'Y-M-D h:m:s')}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">{$t('extension.updated_timestamp')}</span>
        <span class="meta-value">{dateFormat(ext.update_timestamp, 'Y-M-D h:m:s')}</span>
      </div>
    {/if}

    {#if ext.homepage}
      <div class="meta-item">
        <span class="meta-label">{$t('extension.links')}</span>

        {#if ext.homepage}
          <Btn
            link
            onclick={() => {
              void openUrl(ext.homepage!)
            }}
          >
            {$t('extension.homepage')}
          </Btn>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style lang="less">
  .aside {
    position: relative;
    display: flex;
    flex: none;
    width: 25%;
    min-width: 120px;
    max-width: 230px;
    min-height: 0;
    overflow: hidden;

    &__content {
      display: flex;
      flex: auto;
      flex-flow: column nowrap;
      gap: 12px;
      padding-left: 12px;
    }
  }

  .meta-item {
    display: flex;
    flex-flow: column nowrap;
    gap: 4px;
    align-items: baseline;
    font-size: 0.82em;

    :global(button.link) {
      color: inherit;
      text-decoration: underline;
    }
  }

  .meta-label {
    flex: none;
    min-width: 56px;
    font-size: 0.9em;
    color: var(--color-font-label);
  }

  .meta-value {
    flex: auto;
    min-width: 0;
    color: var(--color-font);
    word-break: break-all;
  }

  .meta-id {
    font-size: 0.95em;
    color: var(--color-font-label);
  }
</style>
