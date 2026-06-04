<script lang="ts">
  import { onMount } from 'svelte'
  import { query } from '@/plugins/routes'
  import { t } from '@/plugins/i18n'
  import type { SourceType } from '../../../shared.svelte'
  import { songlistUrlParamKeyMap } from '../../shared.svelte'
  import { getData } from '@/modules/resource/songlist/tag/actions'
  import { appEvent } from '@/modules/app/store/event'
  import { replaceRoute } from '@/modules/resource/actions'

  let { source }: { source?: SourceType } = $props()

  let tags = $state.raw<AnyListen.IPCExtension.SonglistTagResult>({ tags: [], hotTags: [] })
  let list = $state.raw<AnyListen.Resource.TagItem[]>([])
  let value = $state('')
  let popupVisible = $state(false)
  let domBtn = $state<HTMLElement | null>(null)
  let domPopup = $state<HTMLElement | null>(null)
  let popupStyle = $state('width: 645px; max-height: 250px; left: 0px; --arrow-left: 20px; --origin-x: 28px;')
  let defaultLabel = $derived($t('online.songlist.tags.default'))

  let groupedList = $derived.by(() => {
    return tags.hotTags.length ? [{ name: $t('online.songlist.tags.hot'), list: [...tags.hotTags] }, ...tags.tags] : tags.tags
  })

  let tagName = $derived.by(() => {
    if (!value) return defaultLabel
    const tag = list.find((item) => item.id == value)
    return tag?.name ?? value
  })

  const handleToggleTag = (id: string) => {
    replaceRoute('/online', { ...$query, [songlistUrlParamKeyMap.tag]: id })
    popupVisible = false
  }

  const handleShow = (evt: MouseEvent) => {
    evt.stopPropagation()
    popupVisible = !popupVisible
    if (popupVisible) setTagPopupStyle()
  }

  const handleHide = (evt?: MouseEvent) => {
    if (
      evt &&
      (evt.target == domBtn ||
        domBtn?.contains(evt.target as HTMLElement) ||
        evt.target == domPopup ||
        domPopup?.contains(evt.target as HTMLElement))
    ) {
      return
    }
    popupVisible = false
  }

  const setTagPopupStyle = () => {
    window.setTimeout(() => {
      const domView = document.getElementById('view')
      if (!domView) return
      const sidePadding = 12
      const arrowWidth = 8
      const minWidth = 180
      const MAX_WIDTH = 1000
      const preferWidth = domView.clientWidth - 150
      const maxWidth = Math.min(MAX_WIDTH, Math.max(minWidth, domView.clientWidth - sidePadding * 2))
      const width = Math.min(Math.max(minWidth, preferWidth), maxWidth)
      const maxHeight = domView.clientHeight * 0.65

      if (!domBtn) {
        popupStyle = `width: ${width}px; max-height: ${maxHeight}px; left: 0px; --arrow-left: 20px; --origin-x: 28px;`
        return
      }

      const viewRect = domView.getBoundingClientRect()
      const btnRect = domBtn.getBoundingClientRect()
      const rootRect = domBtn.parentElement?.getBoundingClientRect()
      if (!rootRect) {
        popupStyle = `width: ${width}px; max-height: ${maxHeight}px; left: 0px; --arrow-left: 20px; --origin-x: 28px;`
        return
      }

      const btnCenter = btnRect.left + btnRect.width / 2
      const minLeft = viewRect.left + sidePadding - rootRect.left
      const maxLeft = viewRect.right - sidePadding - width - rootRect.left
      const rawLeft = btnCenter - rootRect.left - width / 2
      const left = Math.min(Math.max(rawLeft, minLeft), maxLeft)
      const minArrowLeft = 12
      const maxArrowLeft = Math.max(minArrowLeft, width - 12 - arrowWidth * 2)
      const rawArrowLeft = btnCenter - (rootRect.left + left) - arrowWidth
      const arrowLeft = Math.min(Math.max(rawArrowLeft, minArrowLeft), maxArrowLeft)
      const originX = arrowLeft + arrowWidth

      popupStyle = `width: ${width}px; max-height: ${maxHeight}px; left: ${left}px; --arrow-left: ${arrowLeft}px; --origin-x: ${originX}px;`
    }, 50)
  }

  let listSourceId = ''

  $effect(() => {
    if (!source) return
    const sId = source.sId
    void getData(source.extensionId, source.id).then((_tags) => {
      if (source.sId != sId) return
      tags = _tags
      list = [...tags.hotTags, ...tags.tags.map((t) => t.list).flat()]
      listSourceId = sId
    })
  })
  $effect(() => {
    if (!source) return
    const tag = $query[songlistUrlParamKeyMap.tag] || ''
    value = tag
    if (!list.length || tag == '' || listSourceId != source.sId || (tag && list.some((s) => s.id == tag))) return
    replaceRoute('/online', { ...$query, [songlistUrlParamKeyMap.tag]: list[0].id })
  })

  onMount(() => {
    setTagPopupStyle()
    const unsub = appEvent.on('fullscreen', setTagPopupStyle)
    return () => {
      unsub()
    }
  })
</script>

<div class={['tag-list', { active: popupVisible }]}>
  <button bind:this={domBtn} class="label" onclick={handleShow} aria-label={tagName}>
    <span>{tagName}</span>
    <div class="icon">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 451.847 451.847">
        <use xlink:href="#icon-down" />
      </svg>
    </div>
  </button>

  <div bind:this={domPopup} class="popup" style={popupStyle} aria-hidden={!popupVisible} onclick={(evt) => evt.stopPropagation()}>
    <div class="list scroll">
      <button class="tag" onclick={() => handleToggleTag('')}>{defaultLabel}</button>
      {#each groupedList as tagInfo (tagInfo.name)}
        {#if tagInfo.list.length}
          <dl>
            <dt class="type">{tagInfo.name}</dt>
            {#each tagInfo.list as tag (tag.id)}
              <dd>
                <button class="tag" onclick={() => handleToggleTag(tag.id)}>{tag.name}</button>
              </dd>
            {/each}
          </dl>
        {/if}
      {/each}
    </div>
  </div>
</div>

<svelte:document onclickcapture={(evt) => handleHide(evt)} />
<svelte:window onresize={setTagPopupStyle} />

<style lang="less">
  .tag-list {
    position: relative;
    font-size: 12px;

    &.active {
      .label {
        .icon {
          svg {
            transform: rotate(180deg);
          }
        }
      }
      .popup {
        pointer-events: initial;
        opacity: 1;
        transform: scale(1);
      }
    }
  }

  .label {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    max-width: 150px;
    padding: 0 15px;
    color: var(--color-font);
    cursor: pointer;
    background: transparent;
    border: none;
    transition: color @transition-normal;

    span {
      flex: auto;
      padding: 8px 0;
      .mixin-ellipsis-1();
    }

    .icon {
      flex: none;
      margin-left: 7px;
      line-height: 0;

      svg {
        width: 0.8em;
        transform: rotate(0);
        transition: transform 0.2s ease;
      }
    }

    &:hover {
      color: var(--color-primary-font-hover);
    }

    &:active {
      color: var(--color-primary-font-active);
    }
  }

  .popup {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 10;
    display: flex;
    max-height: 250px;
    margin-top: 12px;
    pointer-events: none;
    background-color: var(--color-content-background);
    border-radius: 4px;
    opacity: 0;
    filter: drop-shadow(0 0 4px rgb(0 0 0 / 15%));
    transform: scale(0.95, 0.8);
    transform-origin: var(--origin-x) 0 0;
    transition: 0.25s ease;
    transition-property: transform, opacity;

    &::before {
      position: absolute;
      top: -6px;
      left: var(--arrow-left);
      width: 0;
      height: 0;
      content: ' ';
      border-right: 8px solid transparent;
      border-bottom: 8px solid var(--color-content-background);
      border-left: 8px solid transparent;
    }
  }

  .list {
    box-sizing: border-box;
    padding: 10px;
  }

  dl {
    margin: 0;
  }

  dd {
    display: inline;
    margin: 0;
  }

  .type {
    padding-top: 10px;
    padding-bottom: 3px;
    color: var(--color-font-label);
  }

  .tag {
    display: inline-block;
    padding: 8px 10px;
    margin: 5px;
    cursor: pointer;
    background-color: var(--color-button-background);
    border: none;
    border-radius: @radius-progress-border;
    transition: background-color @transition-normal;

    &:hover {
      background-color: var(--color-button-background-hover);
    }

    &:active {
      background-color: var(--color-button-background-active);
    }
  }
</style>
