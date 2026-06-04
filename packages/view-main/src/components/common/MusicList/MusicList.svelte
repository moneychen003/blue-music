<script lang="ts">
  import { settingState } from '@/modules/setting/store/state'
  import Header from './Header.svelte'
  import { playMusic } from './List/action'
  import List from './List/index.svelte'
  import type { ListInfo } from './type'
  import { updateSetting } from '@/modules/setting/store/action'
  import { getRandom } from '@/shared'
  import type { ComponentExports } from 'svelte'
  import MiniHeader from './MiniHeader.svelte'
  import Loading from '@/components/base/Loading.svelte'
  let {
    loading = false,
    error = false,
    source = 'local',
    showheader = true,
    miniheader = false,
    list,
    listinfo,
    onscroll,
    onsave,
    oncollect,
    onreload,
  }: {
    loading?: boolean
    error?: boolean
    source?: AnyListen.Player.SourceType
    showheader?: boolean
    miniheader?: boolean
    list: AnyListen.Music.MusicInfo[]
    listinfo: ListInfo
    onscroll?: (pos: number) => void
    onsave?: () => Promise<void>
    oncollect?: () => Promise<void>
    onreload?: () => void
  } = $props()
  let multimode = $state(false)
  let finding = $state(false)
  let duplicate = $state(false)
  let listsort = $state(false)
  let musicList = $state<ComponentExports<typeof List> | null>(null)

  export const setScrollPosition = (number: number, animate?: boolean) => {
    musicList?.setScrollPosition(number, animate)
  }
  export const setScrollIndex = (number: number, animate?: boolean) => {
    musicList?.setScrollIndex(number, animate)
  }
  export const getScrollPosition = () => {
    return musicList?.getScrollPosition() ?? 0
  }
  /** 切换批量选择模式(外部 hero ··· 调用) */
  export const toggleMultiSelect = () => {
    multimode = !multimode
  }
  export const isMultiSelect = () => multimode
</script>

<div class="view-container container" class:loading>
  {#if showheader}
    {#if miniheader}
      <MiniHeader
        disabled={loading || error}
        musiccount={list.length}
        {source}
        saveable={listinfo.saveable}
        {multimode}
        {finding}
        onfind={() => {
          finding = !finding
        }}
        onduplicate={() => {
          duplicate = true
        }}
        onmulti={() => {
          multimode = !multimode
        }}
        onplay={() => {
          void playMusic(
            listinfo.id,
            list,
            list[0],
            source,
            {
              ...(listinfo.listMeta ?? { extensionId: '', source: '' }),
            },
            true
          )
        }}
        onplayrandom={async () => {
          if (settingState.setting['player.togglePlayMethod'] != 'random') {
            await updateSetting({ 'player.togglePlayMethod': 'random' })
          }
          void playMusic(
            listinfo.id,
            list,
            list[getRandom(0, list.length)],
            source,
            {
              ...(listinfo.listMeta ?? { extensionId: '', source: '' }),
            },
            true
          )
        }}
        onsort={() => {
          listsort = true
        }}
        onsave={async () => {
          await onsave?.()
        }}
      />
    {:else}
      <Header
        disabled={loading || error}
        {listinfo}
        musiccount={list.length}
        {source}
        saveable={listinfo.saveable}
        {multimode}
        {finding}
        onfind={() => {
          finding = !finding
        }}
        onduplicate={() => {
          duplicate = true
        }}
        onmulti={() => {
          multimode = !multimode
        }}
        onplay={() => {
          void playMusic(
            listinfo.id,
            list,
            list[0],
            source,
            {
              ...(listinfo.listMeta ?? { extensionId: '', source: '' }),
            },
            true
          )
        }}
        onplayrandom={async () => {
          if (settingState.setting['player.togglePlayMethod'] != 'random') {
            await updateSetting({ 'player.togglePlayMethod': 'random' })
          }
          void playMusic(
            listinfo.id,
            list,
            list[getRandom(0, list.length)],
            source,
            {
              ...(listinfo.listMeta ?? { extensionId: '', source: '' }),
            },
            true
          )
        }}
        onsort={() => {
          listsort = true
        }}
        onsave={async () => {
          await onsave?.()
        }}
        collectible={listinfo.collectible}
        collected={listinfo.collected}
        oncollect={async () => {
          await oncollect?.()
        }}
      />
    {/if}
  {/if}
  <List
    bind:this={musicList}
    {listinfo}
    {list}
    {source}
    {onscroll}
    bind:finding
    bind:multimode
    bind:duplicate
    bind:listsort
    loaded={!loading && !error}
  />
  <Loading {loading} {error} {onreload} />
</div>

<style lang="less">
  .container {
    position: relative;
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
  }
</style>
