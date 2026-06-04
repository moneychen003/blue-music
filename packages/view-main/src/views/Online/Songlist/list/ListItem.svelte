<script lang="ts">
  import { link } from '@/plugins/routes'
  import Image from '@/components/base/Image.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { buildSonglistDetailUrl } from '../../Songlist/shared.svelte'

  let { item, sId }: { item: AnyListen.Resource.SongListItem; sId: string } = $props()
  let url = $derived.by(() => buildSonglistDetailUrl({ id: item.id, sid: sId }))
</script>

<li>
  <a class="list-item" href={url.url} {@attach link()}>
    <div class="image">
      <Image src={item.img} alt={item.name} />
    </div>
    <div class="desc">
      <h4>{item.name}</h4>
      <div>
        <p class="author">{item.author}</p>
        {#if item.time}
          <p class="time">{item.time}</p>
        {/if}
        <div class="songlist-info">
          {#if item.total != null}
            <span><SvgIcon name="music" />{item.total}</span>
          {/if}
          {#if item.play_count != null}
            <span><SvgIcon name="headphones" />{item.play_count}</span>
          {/if}
        </div>
      </div>
    </div>
  </a>
</li>

<style lang="less">
  li {
    display: flex;
  }

  .list-item {
    display: flex;
    // flex: 1;
    flex-flow: row nowrap;
    gap: 8px;
    min-width: 300px;
    // max-width: 440px;
    height: 110px;
    text-decoration: none;
    border-radius: @radius-border;
    transition: opacity @transition-normal;
    &:hover {
      opacity: 0.7;
    }
    .image {
      display: flex;
      flex: none;
      width: auto;
      height: 100%;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      background-position: center;
      background-size: cover;
      border-radius: 4px;
      box-shadow: 0 0 2px 0 rgb(0 0 0 / 20%);
      opacity: 0.9;

      :global(img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .desc {
      flex: auto;
      padding: 2px 15px 2px 0;
      overflow: hidden;
      h4 {
        font-size: 14px;
        line-height: 1.3;
        color: var(--color-font);
        // height: 2.6em;
        text-align: justify;
        .mixin-ellipsis-2();
      }
    }
    .songlist-info {
      display: flex;
      flex-flow: row nowrap;
      gap: 15px;
      margin-top: 6px;
      font-size: 12px;
      line-height: 1.2;
      // text-indent: 24px;
      color: var(--color-font-label);
      text-align: justify;
      .mixin-ellipsis-1();
      :global(svg) {
        margin-right: 2px;
      }
    }
    .author {
      margin-top: 4px;
      font-size: 12px;
      line-height: 1.3;
      // text-indent: 24px;
      color: var(--color-font-label);
      text-align: justify;
      .mixin-ellipsis-1();
    }
    .time {
      margin-top: 3px;
      font-size: 12px;
      line-height: 1.3;
      // text-indent: 24px;
      color: var(--color-font-label);
      text-align: justify;
      .mixin-ellipsis-1();
    }
  }
</style>
