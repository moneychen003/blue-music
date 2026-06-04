<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import { musicInfo } from '@/modules/player/reactive.svelte'
  import { setShowPlayDetail } from '@/modules/playDetail/store/action'
  import { t } from '@/plugins/i18n'
</script>

<div class="icon">
  <Btn
    icon
    link
    disabled={!$musicInfo.id}
    onclick={() => {
      setShowPlayDetail(true)
    }}
    aria-label={$t('player__lyrics')}
  >
    <span>词</span>
  </Btn>
</div>

<style lang="less">
  .icon :global {
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      color: inherit !important;
      opacity: 0.55;
      transition-property: opacity, color;

      span {
        font-size: 16px;
        font-weight: 600;
        line-height: 1;
      }

      &:hover {
        color: var(--color-primary) !important;
        opacity: 0.95;
      }

      &:active {
        opacity: 1;
      }
    }
  }
</style>
