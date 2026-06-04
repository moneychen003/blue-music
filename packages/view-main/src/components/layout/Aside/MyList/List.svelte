<script lang="ts">
  import ListItem from './ListItem.svelte'
  import Menu from './Menu.svelte'
  import { useListItemHeight } from '@/modules/app/reactive.svelte'
  import type { Position } from '@/components/base/Menu.svelte'
  import { getAllList } from '@/modules/musicLibrary/store/actions'
  import { scrollPointerEvents } from '@/shared/compositions/scrollPointerEvents.svelte'
  import { verticalScrollbar } from '@/shared/compositions/verticalScrollbar.svelte'
  import { defaultLists, useUserList } from '@/modules/musicLibrary/reactive.svelte'
  import type { ComponentExports } from 'svelte'
  import { sortable } from '@/shared/compositions/sortable.svelte'
  import { updateUserListPosition } from './action'
  import { LIST_IDS } from '@any-listen/common/constants'
  // console.log(params)
  const listItemHeight = useListItemHeight(2.55)
  const picStyle = $derived(`height:${listItemHeight.val * 0.56}px; width:${listItemHeight.val * 0.56}px;`)
  // const picStyle = $derived(`height:${listItemHeight.val * 0.5}px;`)

  let menu: ComponentExports<typeof Menu>

  const userLists = useUserList(null)
  // 侧边栏「我的列表」隐藏「我喜欢」(LOVE)——它已由顶部导航「我喜欢的音乐」承载,避免重复
  const visibleDefaults = $derived($defaultLists.filter((l) => l.id != LIST_IDS.LOVE))
  const lists = $derived([...visibleDefaults, ...userLists.val])
  let activeIndex = $state(-1)

  const showMenu = (item: AnyListen.List.MyListInfo | null, position: Position) => {
    menu.show(item, position)
  }
</script>

<div class="list">
  {#await getAllList()}
    <div class="list-container tip">Loading...</div>
  {:then _}
    <div
      class="list-container my-list-container"
      role="list"
      tabindex="-1"
      {@attach scrollPointerEvents}
      {@attach verticalScrollbar({ offset: '0', scrollbarWidth: '0.375rem' })}
      oncontextmenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        activeIndex = -1
        showMenu(null, { x: event.pageX, y: event.pageY })
      }}
    >
      <ul
        class="list"
        {@attach sortable({
          onupdate: (parentId, id, toTargetId, position) => {
            void updateUserListPosition(id, position - visibleDefaults.length)
          },
          filter: 'default-list',
          activeElement: 'my-list-container',
        })}
      >
        {#each lists as item, index (item.id)}
          <li class="list-item draggable-item" class:default-list={item.type == 'default'} data-id={item.id}>
            <ListItem
              listInfo={item}
              active={activeIndex == index}
              {index}
              {picStyle}
              oncontextmenu={(event) => {
                event.preventDefault()
                event.stopPropagation()
                activeIndex = index
                showMenu(item, { x: event.pageX, y: event.pageY })
              }}
            />
          </li>
        {/each}
      </ul>
    </div>
  {:catch error}
    <div class="list-container tip">Load failed: {error.message}</div>
  {/await}
</div>
<Menu
  bind:this={menu}
  onhide={() => {
    activeIndex = -1
  }}
/>

<style lang="less">
  .list {
    position: relative;
    height: 100%;
  }
  .list-container {
    position: relative;
    display: block;
    // outline: none;
    height: 100%;
    contain: strict;
  }
  .list-item {
    padding: 1px 12px;
    -webkit-user-drag: revert-layer;
  }
  .tip {
    align-items: center;
    justify-content: center;
  }
</style>
