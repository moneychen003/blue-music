<script lang="ts">
  import { extT } from '@/modules/extension/i18n'
  import { verticalScrollbar } from '@/shared/compositions/verticalScrollbar.svelte'

  let { ext }: { ext: AnyListen.Extension.Extension | AnyListen.IPCExtension.RemoteOnlineDetail } = $props()
</script>

<div class="readme" {@attach verticalScrollbar({ offset: '0.22rem' })}>
  {#if ext.description}
    <p class="description">{$extT(ext.id, ext.description)}</p>
    <!-- {#if ext.readme}
      <div class="section">
        <h3 class="section__title">{$t('extension.readme')}</h3>
        <div class="section__content">
          <pre class="readme-content">{ext.readme}</pre>
        </div>
      </div>
    {/if} -->
  {/if}
</div>

<style lang="less">
  .readme {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    // width: 80%;
    min-height: 0;
    padding-right: 10px;
  }

  .description {
    padding-left: 8px;
    margin: 0;
    font-size: 0.9em;
    line-height: 1.5;
    color: var(--color-font-label);
    overflow-wrap: anywhere;
    border-left: 5px solid var(--color-border);
  }
</style>
