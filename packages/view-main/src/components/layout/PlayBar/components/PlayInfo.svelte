<script lang="ts">
  import { lyricLine, lyricLines } from '@/modules/lyric/reactive.svelte'
  import { musicInfo, playerPlaying, statusText } from '@/modules/player/reactive.svelte'
  import { useSettingValue } from '@/modules/setting/reactive.svelte'
  import { buildMusicName } from '@any-listen/common/tools'
  import CollectBtn from '@/components/common/CollectBtn.svelte'
  let nameFormat = useSettingValue('download.fileName')

  let status = $derived($playerPlaying && $lyricLines.length ? $lyricLine.text : $statusText)
  let musicLabel = $derived.by(() => {
    const info = $musicInfo
    if (!info.id) return ''
    return buildMusicName(nameFormat.val, info.name, info.singer)
  })
</script>

<div class="container">
  <div class="name-row">
    <p class="name">{musicLabel}</p>
    <CollectBtn />
  </div>
  <p class="status-text">{status}</p>
</div>

<style lang="less">
  .container {
    flex: auto;
    min-width: 0;
    contain: content;
    padding-right: 12px;
  }
  .name-row {
    display: flex;
    flex-flow: row nowrap;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }
  .name {
    flex: none;
    max-width: calc(100% - 32px);
    padding: 2px 0 4px;
    font-size: 14px;
    color: var(--color-font);
    .mixin-ellipsis-1();
  }

  .status-text {
    box-sizing: content-box;
    height: 18px;
    padding-bottom: 3px;
    font-size: 12px;
    color: var(--color-font-label);
    .mixin-ellipsis-1();
  }
</style>
