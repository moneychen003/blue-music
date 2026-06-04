<script lang="ts">
  import PopupBtn from '@/components/material/PopupBtn.svelte'
  import { useSettingValue } from '@/modules/setting/reactive.svelte'
  import { updateSetting } from '@/modules/setting/store/action'
  import { playMusicInfo } from '@/modules/player/reactive.svelte'
  import { t } from '@/plugins/i18n'

  const playQuality = useSettingValue('player.playQuality')
  // 四个标准档常显;母带/全景等仅当前歌曲源真返回该音质时才显示(实测多数源只到 Hi-Res)
  const STANDARD_QUALITYS: AnyListen.Music.Quality[] = ['128k', '320k', 'flac', 'flac24bit']
  const curQualitys = $derived.by(() => {
    const m = $playMusicInfo?.musicInfo
    if (!m || m.isLocal) return undefined
    return m.meta.qualitys
  })
  const qualityOptions: Array<{
    id: AnyListen.Music.Quality
    labelKey: string
    short: string
  }> = [
    { id: '128k', labelKey: 'settings.player.music_quality_128k', short: '标准' },
    { id: '320k', labelKey: 'settings.player.music_quality_320k', short: '极高' },
    { id: 'flac', labelKey: 'settings.player.music_quality_flac', short: '无损' },
    { id: 'flac24bit', labelKey: 'settings.player.music_quality_flac24bit', short: 'Hi-Res' },
    { id: 'dolby', labelKey: 'settings.player.music_quality_dolby', short: '全景' },
    { id: 'master', labelKey: 'settings.player.music_quality_master', short: '母带' },
  ]
  const activeQuality = $derived(qualityOptions.find((q) => q.id == playQuality.val) ?? qualityOptions[0])
  const visibleOptions = $derived(qualityOptions.filter((o) => STANDARD_QUALITYS.includes(o.id) || !!curQualitys?.[o.id]))

  const setQuality = async (id: AnyListen.Music.Quality, event: MouseEvent) => {
    event.stopPropagation()
    await updateSetting({ 'player.playQuality': id })
  }
</script>

<PopupBtn aria-label={$t('player__quality')}>
  <div class="quality-icon" class:active={playQuality.val != '128k'}>{activeQuality.short}</div>
  {#snippet content()}
    <div class="quality-menu">
      {#each visibleOptions as item (item.id)}
        <button
          type="button"
          class:active={item.id == playQuality.val}
          onclick={(event) => {
            void setQuality(item.id, event)
          }}
        >
          <span>{item.short}</span>
          <small>{$t(item.labelKey)}</small>
        </button>
      {/each}
    </div>
  {/snippet}
</PopupBtn>

<style lang="less">
  .quality-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 22px;
    padding: 0 5px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    color: inherit;
    cursor: pointer;
    border: 1px solid currentColor;
    border-radius: @radius-border;
    opacity: 0.5;
    transition: @transition-fast;
    transition-property: opacity, color;

    &:hover,
    &.active {
      color: var(--color-primary);
      opacity: 0.95;
    }
  }

  .quality-menu {
    display: flex;
    flex-flow: column nowrap;
    width: 132px;
    overflow: hidden;
  }

  button {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    color: var(--color-font);
    text-align: left;
    cursor: pointer;
    background-color: transparent;
    border: none;
    transition: @transition-normal;
    transition-property: background-color, color;

    &:hover {
      background-color: var(--color-primary-background-hover);
    }

    &.active {
      color: var(--color-primary);
      background-color: var(--color-primary-background-active);
    }
  }

  small {
    color: var(--color-font-label);
  }
</style>
