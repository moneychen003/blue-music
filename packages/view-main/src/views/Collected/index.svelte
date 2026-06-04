<script lang="ts">
  import Image from '@/components/base/Image.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import Empty from '@/components/material/Empty.svelte'
  import { collectedLists, uncollectResource, refreshCollectedLists } from '@/modules/collectedList/store'
  import { pushRoute } from '@/modules/resource/actions'
  import { buildSonglistDetailUrl } from '@/views/Online/Songlist/shared.svelte'
  import { showNotify } from '@/components/apis/notify'
  import { onMount } from 'svelte'

  onMount(() => {
    void refreshCollectedLists()
  })

  const openItem = (item: AnyListen.List.CollectedListInfo) => {
    // 目前可浏览的在线详情为歌单;专辑暂复用歌单详情入口
    const { path, meta } = buildSonglistDetailUrl({ id: item.syncId, sid: item.source })
    pushRoute(path, meta)
  }

  const handleUncollect = async (e: MouseEvent, item: AnyListen.List.CollectedListInfo) => {
    e.stopPropagation()
    try {
      await uncollectResource(item.id)
      showNotify('已取消收藏')
    } catch (err) {
      showNotify((err as Error).message)
    }
  }
</script>

<div class="collected-view">
  <div class="head">
    <h2>我的收藏</h2>
    <span class="count">{$collectedLists.length} 个歌单/专辑</span>
  </div>
  {#if $collectedLists.length}
    <div class="grid">
      {#each $collectedLists as item (item.id)}
        <div
          class="card"
          role="button"
          tabindex="0"
          onclick={() => {
            openItem(item)
          }}
          onkeydown={(e) => {
            if (e.key == 'Enter') openItem(item)
          }}
        >
          <div class="cover">
            <Image src={item.pic} />
            <button
              type="button"
              class="uncollect"
              aria-label="取消收藏"
              onclick={(e) => {
                void handleUncollect(e, item)
              }}
            >
              <SvgIcon name="love" />
            </button>
            {#if item.type == 'album'}
              <span class="tag">专辑</span>
            {/if}
          </div>
          <strong class="name" title={item.name}>{item.name}</strong>
          {#if item.author}
            <span class="sub" title={item.author}>{item.author}</span>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <Empty label="还没有收藏的歌单/专辑,去精选页打开一个歌单点「收藏」吧" />
  {/if}
</div>

<style lang="less">
  .collected-view {
    display: flex;
    flex-flow: column nowrap;
    height: 100%;
    padding: 16px 18px;
    overflow-y: auto;
    box-sizing: border-box;
  }
  .head {
    display: flex;
    flex: none;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 22px;
    }
    .count {
      font-size: 13px;
      color: var(--color-font-label);
    }
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 18px 16px;
  }
  .card {
    display: flex;
    flex-flow: column nowrap;
    gap: 6px;
    cursor: pointer;
    outline: none;

    &:hover .uncollect {
      opacity: 1;
    }
  }
  .cover {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 10px;
    background-color: var(--color-primary-background);

    :global(img) {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.25s ease;
    }
  }
  .card:hover .cover :global(img) {
    transform: scale(1.04);
  }
  .uncollect {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    color: #fff;
    cursor: pointer;
    background-color: rgb(0 0 0 / 45%);
    border: none;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s ease;

    :global(svg) {
      width: 16px;
      height: 16px;
      color: var(--color-primary);
    }
    &:hover {
      background-color: rgb(0 0 0 / 65%);
    }
  }
  .tag {
    position: absolute;
    bottom: 8px;
    left: 8px;
    padding: 1px 6px;
    font-size: 11px;
    color: #fff;
    background-color: rgb(0 0 0 / 50%);
    border-radius: 4px;
  }
  .name {
    font-size: 14px;
    .mixin-ellipsis-2();
  }
  .sub {
    font-size: 12px;
    color: var(--color-font-label);
    .mixin-ellipsis-1();
  }
</style>
