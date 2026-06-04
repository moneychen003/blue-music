<script lang="ts">
  import Image from '@/components/base/Image.svelte'
  import { scrollListTo } from '@/modules/app/store/action'
  import { setShowPlayDetail } from '@/modules/playDetail/store/commit'
  import { musicInfo } from '@/modules/player/reactive.svelte'
  import { playerState } from '@/modules/player/store/state'
  let pic = $derived($musicInfo.pic)
</script>

<div class="container">
  <button
    type="button"
    class="btn"
    onclick={() => {
      setShowPlayDetail(true)
    }}
    oncontextmenu={() => {
      let mInfo = playerState.playMusicInfo
      if (!mInfo) return
      scrollListTo(mInfo.listId, mInfo.source, mInfo.musicInfo)
    }}
  >
    <Image decoding="auto" loading="eager" src={pic} />
  </button>
</div>

<style lang="less">
  .container {
    flex: none;
    min-width: 0;
    // width: @height-player;
    height: 100%;
    padding: 10px 12px 10px 18px;
  }
  .btn {
    display: block;
    height: 100%;
    aspect-ratio: 1;
    // aspect-ratio: 1;
    padding: 0;
    cursor: pointer;
    background: none;
    border: none;
    transition: opacity @transition-fast;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
    overflow: hidden;

    &:hover {
      opacity: 0.82;
    }

    :global(img) {
      border-radius: 6px;
    }
  }
</style>
