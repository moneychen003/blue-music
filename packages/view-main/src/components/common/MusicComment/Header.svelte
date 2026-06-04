<script lang="ts">
  import { t } from '@/plugins/i18n'
  import Btn from '@/components/base/Btn.svelte'
  import Selection from '@/components/base/Selection.svelte'
  import { useCommentSources } from '@/modules/resource/musicComment/reactive.svelte'
  import { extT } from '@/modules/extension/i18n'
  import { untrack } from 'svelte'
  let {
    onrefresh,
    onsourcechange,
  }: {
    onrefresh: () => void
    onsourcechange: (source: AnyListen.IPCResource.SourceItem | null) => void
  } = $props()
  let musicInfo = $state.raw<AnyListen.Music.MusicInfo | null>(null)
  let selectedSourceId = $state<string>('')
  let sourceList = useCommentSources()
  let currentSource: AnyListen.IPCResource.SourceItem | null = null
  // let sourceGroup = $derived.by(() => {
  //   let group: Record<string, AnyListen.IPCResource.SourceItem[]> = {}
  //   for (let item of sourceList.val) {
  //     let id = item.id
  //     group[id] ||= []
  //     group[id].push(item)
  //   }
  //   return Object.values(group)
  // })
  let sources = $derived(
    sourceList.val.map((item) => {
      return {
        ...item,
        name: $extT(item.extensionId, item.name),
      }
    })
  )

  $effect(() => {
    if (!sourceList.val.length) {
      onsourcechange(null)
      return
    }
    untrack(() => {
      if (!musicInfo) return
      if (!sourceList.val.some((item) => item.sId === currentSource?.sId)) {
        const newSource =
          (currentSource ? sourceList.val.find((item) => item.id === currentSource?.id) : null) ?? sourceList.val[0]
        currentSource = newSource
        selectedSourceId = newSource.sId
        onsourcechange(newSource)
      }
    })
  })

  export const setMusicInfo = (_musicInfo: AnyListen.Music.MusicInfo, onrefresh?: () => AnyListen.Music.MusicInfo) => {
    musicInfo = _musicInfo
    if (!sourceList.val.length) {
      onsourcechange(null)
      return
    }
    if (_musicInfo.isLocal) {
      if (!currentSource) {
        currentSource = sourceList.val[0]
        selectedSourceId = currentSource.sId
      }
    } else {
      const targetSource = sourceList.val.find((item) => item.id === _musicInfo?.meta.source)
      if (targetSource && currentSource?.id !== targetSource.id) {
        selectedSourceId = targetSource.sId
        currentSource = targetSource
      } else if (!currentSource) {
        currentSource = sourceList.val[0]
        selectedSourceId = currentSource.sId
      }
    }
    onsourcechange(currentSource ?? sourceList.val[0])
  }
</script>

<div class="comment-header">
  <h3>{$t('music_comment.title', { name: musicInfo?.name ?? '' })}</h3>
  <div class="comment-header-btns">
    <div class="select">
      {#if sources.length}
        <Selection
          bind:value={selectedSourceId}
          list={sources}
          itemkey="sId"
          itemname="name"
          onchange={(sId) => {
            let source = sources.find((item) => item.sId === sId)
            if (!source) return
            currentSource = source
            onsourcechange(source)
          }}
        />
      {/if}
    </div>
    <Btn aria-label={$t('music_comment.refresh')} onclick={onrefresh} min icon>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        style="transform: rotate(45deg);"
        viewBox="0 0 24 24"
      >
        <use xlink:href="#icon-refresh"></use>
      </svg>
    </Btn>
    <!-- <button type="button" class="comment-header-btn" aria-label={$t('btn_close')} onclick={() => onclose?.()}>
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24">
          <use xlink:href="#icon-close"></use>
        </svg>
      </button> -->
  </div>
</div>

<style lang="less">
  .comment-header {
    display: flex;
    flex: none;
    flex-flow: row nowrap;
    align-items: center;
    padding-bottom: 5px;

    h3 {
      flex: auto;
      min-width: 0;
      font-size: 14px;
      line-height: 1.2;
      .mixin-ellipsis-1();
    }
  }

  .comment-header-btns {
    display: flex;
    flex: none;
    flex-flow: row nowrap;
    gap: 8px;
    align-items: center;
    color: var(--color-primary);

    :global {
      --size: 28px;
    }
  }

  .select {
    :global {
      --selection-width: 120px;
    }
  }
</style>
