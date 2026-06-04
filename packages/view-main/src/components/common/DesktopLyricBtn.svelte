<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import { useSettingValue } from '@/modules/setting/reactive.svelte'
  import { updateSetting } from '@/modules/setting/store/action'

  const enable = useSettingValue('desktopLyric.enable')
</script>

<div class="icon" class:on={enable.val}>
  <Btn
    icon
    link
    onclick={() => {
      void updateSetting({ 'desktopLyric.enable': !enable.val })
    }}
    aria-label="桌面歌词"
  >
    <span>桌词</span>
  </Btn>
</div>

<style lang="less">
  .icon :global {
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 24px;
      padding: 0;
      color: inherit !important;
      opacity: 0.55;
      transition-property: opacity, color;

      span {
        font-size: 13px;
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
  .icon.on :global(.btn) {
    color: var(--color-primary) !important;
    opacity: 1;
  }
</style>
