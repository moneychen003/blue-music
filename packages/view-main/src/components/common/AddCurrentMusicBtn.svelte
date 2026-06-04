<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import { showMusicAddModal } from '@/components/apis/musicAddModal'
  import { playMusicInfo } from '@/modules/player/reactive.svelte'
  import { t } from '@/plugins/i18n'

  const addToList = async () => {
    if (!$playMusicInfo) return
    await showMusicAddModal(false, $playMusicInfo.listId, [$playMusicInfo.musicInfo])
  }
</script>

<div class="icon">
  <Btn icon link disabled={!$playMusicInfo} onclick={addToList} aria-label={$t('player__add_to_list')}>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24">
      <use xlink:href="#icon-list-add" />
    </svg>
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
      opacity: 0.5;
      transition-property: opacity;

      &:hover {
        opacity: 0.9;
      }

      &:active {
        opacity: 1;
      }
    }
  }
</style>
