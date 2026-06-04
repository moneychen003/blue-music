<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import { t } from '@/plugins/i18n'
  import type { TabType } from './shared'
  let { active = $bindable() }: { active: TabType } = $props()
</script>

<div class="header">
  <Btn
    outline={active != 'queue'}
    onclick={() => {
      active = 'queue'
    }}>{$t('playlist__queue')}</Btn
  >
  <Btn
    outline={active != 'history'}
    onclick={() => {
      active = 'history'
    }}>{$t('playlist__history')}</Btn
  >
</div>

<style lang="less">
  .header {
    display: flex;
    flex-flow: row nowrap;
    gap: 10px;
  }
</style>
