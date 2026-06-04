<script lang="ts">
  import PopupBtn from '@/components/material/PopupBtn.svelte'
  import { t } from '@/plugins/i18n'
  import Btn from '@/components/base/Btn.svelte'
  import { disableExtension, enableExtension, uninstallExtension } from '@/modules/extension/store/actions'
  import type { ComponentExports } from 'svelte'
  let { ext }: { ext: AnyListen.Extension.Extension } = $props()
  let poupBtn = $state<ComponentExports<typeof PopupBtn> | null>(null)
</script>

<PopupBtn bind:this={poupBtn} aria-label={$t('extension__actions')}>
  <div class="icon">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 512 512">
      <use xlink:href="#icon-settings" />
    </svg>
  </div>
  {#snippet content()}
    <div class="menu">
      {#if ext.enabled}
        <Btn
          min
          onclick={() => {
            poupBtn?.hide()
            void disableExtension(ext.id)
          }}>{$t('extension__action_disable')}</Btn
        >
      {:else}
        <Btn
          min
          onclick={() => {
            poupBtn?.hide()
            void enableExtension(ext.id)
          }}>{$t('extension__action_enable')}</Btn
        >
      {/if}
      <Btn
        min
        onclick={() => {
          poupBtn?.hide()
          void uninstallExtension(ext.id)
        }}>{$t('extension__action_uninstall')}</Btn
      >
      <!-- <Btn min>{$t('extension__action_update')}</Btn> -->
    </div>
  {/snippet}
</PopupBtn>

<style lang="less">
  .icon {
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    // color: var(--color-button-font);
    justify-content: center;
    width: 20px;
    padding: 0;
    cursor: pointer;
    transition: color @transition-normal;

    svg {
      opacity: 0.5;
      filter: drop-shadow(0 0 1px rgb(0 0 0 / 20%));
      transition: @transition-fast;
      transition-property: opacity, color;
    }
    &:hover {
      svg {
        opacity: 0.9;
      }
    }
    &:active {
      svg {
        opacity: 1;
      }
    }
  }

  .menu {
    display: flex;
    flex-flow: column nowrap;
    // padding: 2px 3px;
    gap: 6px;
    width: 90px;
  }
</style>
