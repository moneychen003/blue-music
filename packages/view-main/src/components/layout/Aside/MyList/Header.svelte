<script lang="ts">
  import { t } from '@/plugins/i18n'
  import Btn from '@/components/base/Btn.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { showOnlineSonglistImportModal } from '@/components/apis/onlineSonglistImportModal'
  // console.log(params)
</script>

<div class="container">
  <h2>{$t('my_list')}</h2>
  <div class="import">
    <Btn icon min aria-label={$t('user_list_menu__import_online')} onclick={() => showOnlineSonglistImportModal()}>
      <SvgIcon name="plus" />
    </Btn>
  </div>
</div>

<style lang="less">
  .container {
    flex: none;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    padding: 4px 22px 2px;
  }

  h2 {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-font-label);
  }

  .import {
    flex: none;
    margin-right: -5px;

    :global(.btn) {
      color: var(--color-font-label);
      --size: 1.4rem;
    }
  }
</style>
