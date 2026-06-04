<script lang="ts">
  import type { ComponentExports } from 'svelte'
  import Header from './Header.svelte'
  import Main from './Main.svelte'

  let header = $state.raw<ComponentExports<typeof Header> | null>(null)
  let main = $state.raw<ComponentExports<typeof Main> | null>(null)
  let currentMusicInfo: AnyListen.Music.MusicInfo | null = null
  let handleRefresh: (() => AnyListen.Music.MusicInfo | null) | undefined

  export const loadComment = async (musicInfo: AnyListen.Music.MusicInfo, onrefresh?: () => AnyListen.Music.MusicInfo | null) => {
    currentMusicInfo = musicInfo
    handleRefresh = onrefresh
    header?.setMusicInfo(musicInfo)
  }
</script>

<div class="comment">
  <Header
    bind:this={header}
    onrefresh={async () => {
      if (handleRefresh) {
        const info = handleRefresh()
        if (info && info !== currentMusicInfo) {
          await loadComment(info, handleRefresh)
          return
        }
      }
      main?.refresh()
    }}
    onsourcechange={(source) => {
      main?.setInfo(currentMusicInfo!, source)
    }}
  />

  <Main bind:this={main} />
</div>

<style lang="less">
  .comment {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    min-height: 0;
    // overflow: hidden;
    transform-origin: 100%;
    transition: @transition-normal;
    transition-property: transform, opacity;
  }
</style>
