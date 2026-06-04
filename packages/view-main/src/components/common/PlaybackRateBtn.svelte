<script lang="ts">
  import PopupBtn from '@/components/material/PopupBtn.svelte'
  import { t } from '@/plugins/i18n'
  import Checkbox from '@/components/base/Checkbox.svelte'
  import SliderBar from '@/components/base/SliderBar.svelte'
  import { useSettingValue } from '@/modules/setting/reactive.svelte'
  import { updateSetting } from '@/modules/setting/store/action'
  import { actions } from '@/shared/actions'
  import { usePlaybackRate } from '@/modules/player/reactive.svelte'
  import type { WheelEventHandler } from 'svelte/elements'

  const preservesPitch = useSettingValue('player.preservesPitch')
  const playbackRate = usePlaybackRate()
  const handleUpdatePlaybackRate = (val: number) => {
    actions.exec('player.setPlaybackRate', Math.round(val) / 100)
  }
  const handleWheel: WheelEventHandler<HTMLButtonElement> = (event) => {
    actions.exec('player.setPlaybackRate', Math.round(playbackRate.val * 100 + -event.deltaY / 100) / 100)
  }

  const updatePreservesPitch = (enabled: boolean) => {
    void updateSetting({ 'player.preservesPitch': enabled })
  }
</script>

<PopupBtn onwheel={handleWheel} aria-label={$t('player__playback_rate', { rate: playbackRate.val })}>
  <div class="icon" class:active={playbackRate.val != 1}>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24">
      <use xlink:href="#icon-speed" />
    </svg>
  </div>
  {#snippet content()}
    <div class="setting">
      <div class="info">
        <span>{playbackRate.val.toFixed(2)}x</span>
        <Checkbox
          id="player__playback_preserves_pitch"
          checked={preservesPitch.val}
          label={$t('player__playback_preserves_pitch')}
          onchange={updatePreservesPitch}
        />
      </div>
      <SliderBar step={1} value={playbackRate.val * 100} min={50} max={180} onchange={handleUpdatePlaybackRate} />
    </div>
  {/snippet}
</PopupBtn>

<style lang="less">
  // .container {
  //   flex: none;
  //   height: 100%;
  // }

  .icon {
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    // color: var(--color-button-font);
    justify-content: center;
    width: 24px;
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
    &.active {
      svg {
        color: var(--color-primary);
        opacity: 0.8;
      }
    }
  }

  .setting {
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    width: 300px;
    padding: 2px 3px;

    :global(.slider) {
      width: 100%;
    }
  }

  .info {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    span {
      line-height: 1.2;
    }
  }
</style>
