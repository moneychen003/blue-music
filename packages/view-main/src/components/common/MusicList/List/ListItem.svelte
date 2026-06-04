<script lang="ts">
  import Badge from '@/components/base/Badge.svelte'
  import Image from '@/components/base/Image.svelte'

  // import SvgIcon from '@/components/base/SvgIcon.svelte'
  import type { MouseEventHandler } from 'svelte/elements'
  import { fade } from 'svelte/transition'
  import { buildSourceLabel } from '@any-listen/common/tools'
  import { onMount, tick } from 'svelte'
  import { getMusicPicDelay } from '@/modules/player/store/actions'
  import { pushRoute } from '@/modules/resource/actions'
  // console.log(querystring)
  let {
    musicinfo,
    listid,
    picStyle,
    selected,
    selectedactive,
    multimode,
    playing,
    active,
    oncontextmenu,
    onclick,
  }: {
    musicinfo: AnyListen.Music.MusicInfo
    listid: string
    index: number
    picStyle: string
    playing?: boolean
    selected?: boolean
    active?: boolean
    selectedactive?: boolean
    multimode?: boolean
    oncontextmenu?: MouseEventHandler<HTMLDivElement>
    onclick: (isKey: boolean) => void
  } = $props()

  let sourceLabel = $derived(buildSourceLabel(musicinfo))
  let picUrl = $state<null | string>(null)
  // let isPlaying = $derived(isplaylist && $playInfo.index === index)
  const badgeTypes = ['primary', 'secondary', 'tertiary'] as const

  const handleClick = (event: KeyboardEvent | Event) => {
    if ('key' in event) {
      if (event.repeat || event.key != 'Enter') return
      onclick(true)
    } else {
      onclick(false)
    }
  }

  const toOnlineSearch = (queryType: 'singer' | 'album', text: string | undefined, event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const keyword = text?.trim()
    if (!keyword) return
    pushRoute('/online', {
      t: 'search',
      qt: queryType,
      q: keyword,
    })
  }

  let cancelLoadPic: (() => void) | undefined = undefined
  let retryedLoadPic = false
  const loadPic = () => {
    cancelLoadPic?.()
    cancelLoadPic = getMusicPicDelay({ musicInfo: musicinfo, listId: listid, isRefresh: retryedLoadPic }, (url) => {
      cancelLoadPic = undefined
      void tick().then(() => {
        picUrl = url
      })
    })
  }

  onMount(() => {
    retryedLoadPic = false
    loadPic()
    return () => {
      cancelLoadPic?.()
    }
  })
</script>

<div
  class="container"
  class:selected
  class:active
  class:selectedactive
  role="button"
  tabindex="0"
  onkeydown={handleClick}
  onclick={handleClick}
  {oncontextmenu}
>
  {#if multimode}
    <div class="checkbox" class:checked={selected} aria-hidden="true">
      {#if selected}
        <svg viewBox="0 0 24 24"><use xlink:href="#icon-check-true" /></svg>
      {/if}
    </div>
  {/if}
  <div class="pic" style={picStyle}>
    {#if playing}
      <div class="play-icon" transition:fade={{ delay: 200 }}>
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <use xlink:href="#icon-play" />
        </svg>
      </div>
    {/if}
    <Image
      src={picUrl}
      onerror={() => {
        picUrl = null
        if (retryedLoadPic) return
        retryedLoadPic = true
        loadPic()
      }}
    />
  </div>
  <div class="list-item-cell auto name">
    <div class="select name" aria-label={musicinfo.name}>{musicinfo.name}</div>
    <div class="label">
      {#each sourceLabel as label, index (index)}
        <Badge {label} opacity={0.7} type={badgeTypes[index % badgeTypes.length]} />
      {/each}
    </div>
  </div>
  <div class="list-item-cell" style="flex: 0 0 22%;">
    {#if musicinfo.singer}
      <button
        type="button"
        class="select meta-link"
        aria-label={musicinfo.singer}
        onclick={(event) => {
          toOnlineSearch('singer', musicinfo.singer, event)
        }}
      >
        {musicinfo.singer}
      </button>
    {:else}
      <span class="select">--</span>
    {/if}
  </div>
  <div class="list-item-cell" style="flex: 0 0 22%;">
    {#if musicinfo.meta.albumName}
      <button
        type="button"
        class="select meta-link"
        aria-label={musicinfo.meta.albumName}
        onclick={(event) => {
          toOnlineSearch('album', musicinfo.meta.albumName, event)
        }}
      >
        {musicinfo.meta.albumName}
      </button>
    {:else}
      <span class="select">--</span>
    {/if}
  </div>
  <div class="list-item-cell" style="flex: 0 0 9%;">
    <span class="no-select">{musicinfo.interval || '--/--'}</span>
  </div>
</div>

<style lang="less">
  .container {
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    gap: 10px;
    align-items: center;
    height: 100%;
    padding: 5px;
    font-size: 13px;
    background-color: transparent;
    border: 1px dashed transparent;
    border-radius: @radius-border;
    transition: 0.3s ease;
    transition-property: color, background-color, opacity, border-color;
    // &:hover {
    //   .num {
    //     opacity: 0.6;
    //   }
    // }

    &:not(.active, .selected) {
      &:hover {
        background-color: var(--color-primary-background-hover);
      }
    }
    &.selected {
      background-color: var(--color-primary-background-selected);
    }
    &.active {
      background-color: var(--color-primary-background-active);
    }
    &.selectedactive {
      border-color: var(--color-primary-alpha-700);
    }
  }
  // .active {
  //   background-color: var(--color-primary-background);
  // }

  .checkbox {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-left: 2px;
    color: #fff;
    // 深底 + 半透明白边:在普通行/红色播放行/选中高亮行上都看得清
    background-color: rgb(0 0 0 / 35%);
    border: 1.5px solid rgb(255 255 255 / 65%);
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 25%);
    transition: 0.2s ease;
    transition-property: background-color, border-color;

    &.checked {
      // 选中:主色填充 + 白边白勾,即使压在红色选中行上也突出
      background-color: var(--color-primary);
      border-color: #fff;
    }
    svg {
      width: 12px;
      height: 12px;
      color: #fff;
    }
  }
  .pic {
    position: relative;
    flex: none;
    // background-color: var(--color-primary-light-200-alpha-900);
    // display: flex;
    // align-items: center;
    // justify-content: center;
    border-radius: @radius-border;
    // overflow: hidden;
    // user-select: none;
    // flex: none;
    // > span {
    //   // width: 100%;
    //   // height: 80%;
    //   color: var(--color-primary-light-400-alpha-200);
    //   font-size: 18px;
    //   font-family: Consolas, 'Courier New', monospace;
    //   span {
    //     padding-left: 2px;
    //   }
    // }
    :global(.pic) {
      transition: opacity @transition-normal;
    }
  }
  // .num {
  //   position: absolute;
  //   bottom: 0;
  //   right: 0;
  //   .nobreak;
  //   .center;
  //   opacity: 0;
  //   transition: opacity .2s ease;
  //   padding-left: 2px;
  //   padding-right: 2px;
  //   font-size: 11px;
  //   line-height: 1.2;
  //   color: var(--color-button-font);
  //   background-color: var(--color-button-background);
  //   border-top-left-radius: @radius-border;
  //   border-bottom-right-radius: @radius-border;
  // }
  .play-icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 6px;
    color: var(--color-button-font);

    + :global(.pic) {
      opacity: 0.1;
    }
  }

  // .right {
  //   flex: auto;
  //   display: flex;
  //   flex-flow: row nowrap;
  //   font-size: 14px;
  //   gap: 2px;
  //   min-width: 0;
  //   span {
  //     .mixin-ellipsis-1();
  //   }
  // }

  .list-item-cell {
    // padding: 0 6px;
    position: relative;
    flex: none;
    // transition:  0.3s cubic-bezier(0.4, 0, 0.2, 1);
    line-height: 16px;
    vertical-align: middle;
    .mixin-ellipsis-1();

    &.auto {
      flex: auto;
    }

    &.name {
      display: flex;
      flex-flow: column nowrap;
      // gap: 4px;
      justify-content: center;
      overflow: hidden;
      text-overflow: initial;
      white-space: initial;

      > .name {
        .mixin-ellipsis-1();

        padding: 2px 0;
      }
    }
    .label {
      display: flex;
      flex-flow: row nowrap;
      gap: 8px;
      padding: 2px 0;
      :global(.badge) {
        padding: 0;
      }
    }

    .meta-link {
      display: block;
      max-width: 100%;
      padding: 0;
      color: inherit;
      text-align: left;
      cursor: pointer;
      background: transparent;
      border: none;
      transition: color @transition-normal;
      .mixin-ellipsis-1();

      &:hover {
        color: var(--color-primary);
        text-decoration: underline;
        text-underline-offset: 3px;
      }
    }
    // .badge {
    //   margin-left: 3px;
    //   opacity: 0.85;
    // }

    // &.meta {
    //   font-size: 12px;
    //   color: var(--color-font-label);
    // }
  }
</style>
