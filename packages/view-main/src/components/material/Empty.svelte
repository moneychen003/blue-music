<script lang="ts">
  import { t } from '@/plugins/i18n'
  let { label }: { label?: string } = $props()
</script>

<div class="no-item">
  <p>{label || $t('no_item')}</p>
</div>

<style lang="less">
  .no-item {
    position: relative;
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
    height: 100%;

    p {
      margin-top: -10%;
      font-size: var(--font-size, 1.5rem);
      color: var(--color-font-label);
    }
  }
</style>
