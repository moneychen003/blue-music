<script lang="ts">
  import { onMount, tick } from 'svelte'
  import CommentFloor from './CommentFloor.svelte'
  import Pagination from '@/components/material/Pagination.svelte'
  import { t } from '@/plugins/i18n'
  import Btn from '@/components/base/Btn.svelte'
  import { findMusic } from '@/modules/resource/search/music/actions'
  import Loading from '@/components/base/Loading.svelte'
  import { musicComment } from '@/modules/resource/musicComment/action'
  import { verticalScrollbar } from '@/shared/compositions/verticalScrollbar.svelte'

  interface CommentState {
    isLoading: boolean
    isLoadError: boolean
    page: number
    total: number
    maxPage: number
    nextPage: number
    limit: number
    key: string
    list: AnyListen.Resource.MusicCommentItem[]
    musicInfo: AnyListen.Music.MusicInfoOnline | null
    source: AnyListen.IPCResource.SourceItem | null
  }

  let domTabMain: HTMLElement | null = $state(null)
  let domCommentHot: HTMLDivElement | null = $state(null)
  let domCommentNew: HTMLDivElement | null = $state(null)

  let currentMusicInfo = $state.raw<AnyListen.Music.MusicInfoOnline | null>(null)
  let currentSource: AnyListen.IPCResource.SourceItem | null = null
  let tabActiveId = $state<'hot' | 'new'>('hot')
  let available = $state(false)

  const createCommentState = (): CommentState => ({
    isLoading: false,
    isLoadError: false,
    page: 1,
    total: 0,
    maxPage: 1,
    nextPage: 1,
    limit: 20,
    list: [],
    key: '',
    musicInfo: currentMusicInfo,
    source: currentSource,
  })
  let hotComment = $state<CommentState>(createCommentState())
  let newComment = $state<CommentState>(createCommentState())
  let commonState = $state({
    loading: false,
    error: false,
  })

  const updateTabOffset = async () => {
    await tick()
    setTimeout(() => {
      handleToggleTab(tabActiveId, true)
    })
  }

  const loadCommentList = async (type: 'hot' | 'new', page: number, limit: number) => {
    if (!currentMusicInfo || !currentSource) return

    const getState = () => {
      return type == 'hot' ? hotComment : newComment
    }
    const state = getState()
    state.isLoadError = false
    state.isLoading = true
    const key = `${currentSource.id}-${currentMusicInfo.id}-${type}`
    state.key = key

    try {
      const result = await musicComment({
        extensionId: currentSource.extensionId,
        source: currentSource.id,
        musicInfo: currentMusicInfo,
        page,
        limit,
        type,
      })
      console.log(result)
      if (getState().key != key) return
      state.isLoading = false
      state.total = result.total
      state.maxPage = Math.max(1, Math.ceil(result.total / result.limit))
      state.page = result.page
      state.limit = result.limit
      state.list = result.list
      if (type == 'hot') {
        void tick().then(() => {
          domCommentHot?.scrollTo({ top: 0, behavior: 'smooth' })
        })
      } else {
        void tick().then(() => {
          domCommentNew?.scrollTo({ top: 0, behavior: 'smooth' })
        })
      }
    } catch (error) {
      console.log(error)
      if (getState().key != key) return
      state.isLoadError = true
      state.isLoading = false
    }
  }

  const handleToggleHotCommentPage = (page: number) => {
    hotComment.nextPage = page
    void loadCommentList('hot', page, hotComment.limit)
  }

  const handleToggleCommentPage = (page: number) => {
    newComment.nextPage = page
    void loadCommentList('new', page, newComment.limit)
  }

  const handleToggleTab = (id: 'hot' | 'new', force = false) => {
    if (!force && tabActiveId == id) return
    switch (id) {
      case 'hot':
        domTabMain?.scrollTo({ left: 0, behavior: force ? 'instant' : 'smooth' })
        break
      case 'new':
        domTabMain?.scrollTo({ left: domTabMain.clientWidth, behavior: force ? 'instant' : 'smooth' })
        break
    }
    tabActiveId = id
  }

  const loadComment = async () => {
    if (!currentMusicInfo) return
    hotComment = createCommentState()
    newComment = createCommentState()
    void loadCommentList('hot', hotComment.page, hotComment.limit)
    void loadCommentList('new', newComment.page, newComment.limit)
  }

  onMount(() => {
    const handleResize = () => {
      void updateTabOffset()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })

  export const refresh = async () => {
    if (!lastInfo) return
    await setInfo(lastInfo.musicInfo, lastInfo.source)
  }

  let lastInfo: {
    musicInfo: AnyListen.Music.MusicInfo
    source: AnyListen.IPCResource.SourceItem
  } | null = null
  export const setInfo = async (musicInfo: AnyListen.Music.MusicInfo, source: AnyListen.IPCResource.SourceItem | null) => {
    if (!source) {
      lastInfo = null
      currentMusicInfo = null
      currentSource = null
      available = false
      hotComment = createCommentState()
      newComment = createCommentState()
      return
    }
    available = true
    lastInfo = { musicInfo, source }
    if (musicInfo.isLocal || musicInfo.meta.source !== source.id) {
      currentMusicInfo = null
      commonState.loading = true
      currentMusicInfo = await findMusic({
        extensionId: source.extensionId,
        source: source.id,
        name: musicInfo.name,
        artist: musicInfo.singer,
        albumName: musicInfo.meta.albumName,
        interval: musicInfo.interval,
        strict: false,
      })
        .catch((error) => {
          commonState.error = true
          throw error
        })
        .finally(() => {
          commonState.loading = false
        })
      void updateTabOffset()
    } else {
      currentMusicInfo = musicInfo
    }
    currentSource = source
    if (!currentMusicInfo) {
      available = false
      hotComment = createCommentState()
      newComment = createCommentState()
      return
    }
    await loadComment()
  }
</script>

<div class="comment-main">
  {#if available}
    <header class="tab-header">
      <button type="button" class="comment-type" class:active={tabActiveId == 'hot'} onclick={() => handleToggleTab('hot')}
        >{$t('music_comment.hot_title')} ({hotComment.total})</button
      >
      <button type="button" class="comment-type" class:active={tabActiveId == 'new'} onclick={() => handleToggleTab('new')}
        >{$t('music_comment.new_title')} ({newComment.total})</button
      >
    </header>
    <main class="tab-main" bind:this={domTabMain}>
      {#if currentMusicInfo}
        <div class="tab-content">
          <div class="tab-content-scroll" bind:this={domCommentHot} {@attach verticalScrollbar({ offset: '0' })}>
            {#if hotComment.isLoadError}
              <Btn
                onclick={() => {
                  if (!currentMusicInfo) return
                  void loadCommentList('hot', hotComment.nextPage, hotComment.limit)
                }}
              >
                {$t('music_comment.hot_load_error')}
              </Btn>
            {:else if hotComment.isLoading && !hotComment.list.length}
              <p class="comment-label">{$t('music_comment.hot_loading')}</p>
            {:else if !hotComment.list.length}
              <p class="comment-label">{$t('music_comment.no_content')}</p>
            {:else}
              <div class:loading={hotComment.isLoading} class="comment-floor">
                <CommentFloor comments={hotComment.list} />
              </div>
            {/if}
            <div class="pagination">
              <Pagination
                count={hotComment.total}
                btnlength={5}
                limit={hotComment.limit}
                page={hotComment.page}
                onclick={handleToggleHotCommentPage}
              />
            </div>
          </div>
        </div>
        <div class="tab-content">
          <div class="tab-content-scroll" bind:this={domCommentNew} {@attach verticalScrollbar({ offset: '0' })}>
            {#if newComment.isLoadError}
              <Btn
                onclick={() => {
                  if (!currentMusicInfo) return
                  void loadCommentList('new', newComment.nextPage, newComment.limit)
                }}
              >
                {$t('music_comment.new_load_error')}
              </Btn>
            {:else if newComment.isLoading && !newComment.list.length}
              <p class="comment-label">{$t('music_comment.new_loading')}</p>
            {:else if !newComment.list.length}
              <p class="comment-label">{$t('music_comment.no_content')}</p>
            {:else}
              <div class:loading={newComment.isLoading} class="comment-floor">
                <CommentFloor comments={newComment.list} />
              </div>
            {/if}
            <div class="pagination">
              <Pagination
                count={newComment.total}
                btnlength={5}
                limit={newComment.limit}
                page={newComment.page}
                onclick={handleToggleCommentPage}
              />
            </div>
          </div>
        </div>
      {/if}
    </main>
  {:else}
    <p class="unavailable">{$t('music_comment.unavailable')}</p>
  {/if}
  <Loading loading={commonState.loading} error={commonState.error} onreload={refresh} />
</div>

<style lang="less">
  .comment-main {
    position: relative;
    display: flex;
    flex: auto;
    flex-direction: column;
    min-height: 0;
    background-color: var(--color-primary-light-400-alpha-700);
    border-radius: 4px;
  }

  .tab-header {
    display: flex;
    flex-flow: row nowrap;
    gap: 15px;
    padding: 0 15px;
  }

  .tab-main {
    display: flex;
    flex: auto;
    flex-flow: row nowrap;
    overflow: hidden;
    // scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
  }

  .tab-content {
    position: relative;
    flex-shrink: 0;
    width: 100%;
  }

  .tab-content-scroll {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0 15px;
  }

  .comment-label {
    padding: 15px;
    font-size: 14px;
    color: var(--color-font-label);
  }

  .comment-type {
    padding: 5px;
    margin: 5px 0;
    font-size: 13px;
    cursor: pointer;
    background: none;
    border: none;
    transition: @transition-normal;
    transition-property: opacity, color;

    &:hover {
      opacity: 0.7;
    }

    &.active {
      color: var(--color-primary);
    }
  }

  .comment-floor {
    opacity: 1;
    transition: opacity @transition-normal;

    &.loading {
      opacity: 0.4;
    }
  }

  .pagination {
    padding: 10px 0;
  }

  .unavailable {
    flex: auto;
    padding-top: 10%;
    font-size: 14px;
    color: var(--color-font-label);
    text-align: center;
  }
</style>
