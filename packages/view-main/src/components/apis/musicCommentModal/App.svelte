<script lang="ts">
  import MusicComment from '@/components/common/MusicComment/musicComment.svelte'
  import Modal from '@/components/material/Modal.svelte'
  import { nextTick } from '@any-listen/web/SimpleSingleEvent'
  import type { ComponentExports } from 'svelte'

  let {
    onafterleave,
  }: {
    onafterleave: () => void
  } = $props()

  let visible = $state(false)
  // let musicInfo = $state.raw<AnyListen.Music.MusicInfo | null>(null)
  let musicComment = $state.raw<ComponentExports<typeof MusicComment> | null>(null)

  export const show = (_musicInfo: AnyListen.Music.MusicInfo, onrefresh: () => AnyListen.Music.MusicInfo | null) => {
    visible = true
    nextTick(() => {
      musicComment?.loadComment(_musicInfo, onrefresh)
    })
  }
</script>

<Modal bind:visible teleport="#root" width="65%" maxwidth="90rem" height="80%" maxheight="80%" {onafterleave}>
  <main class="main">
    <MusicComment bind:this={musicComment} />
  </main>
</Modal>

<style lang="less">
  .main {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    // width: 460px;
    min-height: 0;
    padding: 10px;
  }
</style>
