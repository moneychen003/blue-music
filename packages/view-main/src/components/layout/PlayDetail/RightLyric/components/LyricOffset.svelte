<script lang="ts">
  import { removeMusicLyric, setMusicLyric } from '@/modules/lyric/store/action'
  import { setLyricOffset } from '@/modules/player/actions'
  import { musicInfo } from '@/modules/player/reactive.svelte'
  import { setMusicInfo } from '@/modules/player/store/actions'
  import { playerState } from '@/modules/player/store/state'
  import { t } from '@/plugins/i18n'
  import { debounce } from '@/shared'
  let offset = $state(0)
  let offsetDisabled = $state(true)
  let originOffset = $state(0)
  let info: {
    lyric: string
    tlyric: string | null
    rlyric: string | null
    awlyric: string | null
    rawlyric: string | null
    id: string
    name: string
    singer: string
    interval: string
  } = {
    lyric: '',
    tlyric: null,
    rlyric: null,
    awlyric: null,
    rawlyric: null,
    id: '',
    name: '',
    singer: '',
    interval: '',
  }

  const offsetTagRxp = /(?:^|\n)\s*\[offset:\s*(\S+(?:\d+)*)\s*\]/
  const offsetTagAllRxp = /(^|\n)\s*\[offset:\s*(\S+(?:\d+)*)\s*\]/g

  $effect(() => {
    if (
      $musicInfo.id == info.id &&
      $musicInfo.lrc == info.lyric &&
      $musicInfo.tlrc == info.tlyric &&
      $musicInfo.rlrc == info.rlyric &&
      $musicInfo.awlrc == info.awlyric
    ) {
      return
    }
    const disabled = !$musicInfo.lrc
    offsetDisabled = disabled
    if (disabled) {
      offset = 0
      originOffset = 0
      return
    }
    info = {
      lyric: $musicInfo.lrc!,
      tlyric: $musicInfo.tlrc,
      rlyric: $musicInfo.rlrc,
      awlyric: $musicInfo.awlrc,
      rawlyric: $musicInfo.rawlrc,
      id: $musicInfo.id!,
      name: $musicInfo.name,
      singer: $musicInfo.singer,
      interval: playerState.playMusicInfo?.musicInfo.interval || '',
    }
    offset = getOffset(info.lyric)
    originOffset = getOffset(info.rawlyric)
  })

  const saveLyric = debounce((id: string, info: AnyListen.Music.LyricInfo) => {
    void setMusicLyric(id, info)
  })
  const removeLyric = debounce((id: string) => {
    void removeMusicLyric(id)
  })

  const getOffset = (lrc: string | null): number => {
    if (!lrc) return 0
    const match = offsetTagRxp.exec(lrc)
    if (match) {
      const val = parseInt(match[1])
      return Number.isNaN(val) ? 0 : val
    }
    return 0
  }

  const updateLyric = (newOffset: number) => {
    if (!info.id) return
    if (offsetTagRxp.test(info.lyric)) {
      info.lyric = info.lyric.replace(offsetTagAllRxp, `$1[offset:${newOffset}]`)
      info.tlyric &&= info.tlyric.replace(offsetTagAllRxp, `$1[offset:${newOffset}]`)
      info.awlyric &&= info.awlyric.replace(offsetTagAllRxp, `$1[offset:${newOffset}]`)
      info.rlyric &&= info.rlyric.replace(offsetTagAllRxp, `$1[offset:${newOffset}]`)
    } else {
      info.lyric &&= `[offset:${newOffset}]\n${info.lyric}`
      info.tlyric &&= `[offset:${newOffset}]\n${info.tlyric}`
      info.awlyric &&= `[offset:${newOffset}]\n${info.awlyric}`
      info.rlyric &&= `[offset:${newOffset}]\n${info.rlyric}`
    }
    if (newOffset == originOffset) {
      removeLyric(info.id)
    } else {
      saveLyric(info.id, {
        name: info.name,
        singer: info.singer,
        interval: info.interval,
        lyric: info.lyric,
        tlyric: info.tlyric,
        rlyric: info.rlyric,
        awlyric: info.awlyric,
      })
    }
    setMusicInfo({
      lrc: info.lyric,
      tlrc: info.tlyric,
      rlrc: info.rlyric,
      awlrc: info.awlyric,
    })
    setLyricOffset(newOffset)
  }

  const setOffset = (step: number) => {
    offset += step
    updateLyric(offset)
  }
  const offsetReset = () => {
    if (offset == originOffset) return
    offset = originOffset
    updateLyric(originOffset)
  }
</script>

<div class="group">
  <div class="sub-group">
    <div class="title">{$t('lyric_menu.offset', { offset })}</div>
    <button class="btn title-btn" disabled={offsetDisabled || offset == originOffset} onclick={offsetReset}>
      {$t('lyric_menu.offset_reset')}
    </button>
  </div>
  <div class="sub-group">
    <button
      class="btn"
      disabled={offsetDisabled}
      data-ignore-tip
      aria-label={$t('lyric_menu.offset_add_10')}
      onclick={() => setOffset(10)}>+ 10ms</button
    >
    <button
      class="btn"
      disabled={offsetDisabled}
      data-ignore-tip
      aria-label={$t('lyric_menu.offset_dec_10')}
      onclick={() => setOffset(-10)}>- 10ms</button
    >
  </div>
  <div class="sub-group">
    <button
      class="btn"
      disabled={offsetDisabled}
      data-ignore-tip
      aria-label={$t('lyric_menu.offset_add_100')}
      onclick={() => setOffset(100)}>+ 100ms</button
    >
    <button
      class="btn"
      disabled={offsetDisabled}
      data-ignore-tip
      aria-label={$t('lyric_menu.offset_dec_100')}
      onclick={() => setOffset(-100)}>- 100ms</button
    >
  </div>
</div>
