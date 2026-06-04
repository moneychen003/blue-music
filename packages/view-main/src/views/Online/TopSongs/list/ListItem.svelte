<script lang="ts">
  import { link } from '@/plugins/routes'
  import Image from '@/components/base/Image.svelte'
  import { buildTopSongsDetailUrl } from '../../TopSongs/shared.svelte'

  let { item, sId }: { item: AnyListen.Resource.TopSongsItem; sId: string } = $props()
  let url = $derived(buildTopSongsDetailUrl({ id: item.id, sid: sId }))
</script>

<li aria-label={item.name}>
  <a class="list-item" href={url.url} {@attach link()}>
    <div class="image">
      <Image src={item.pic} alt={item.name} />
    </div>
    <div class="desc">
      <h4>{item.name}</h4>
    </div>
  </a>
</li>

<style lang="less">
  // li {
  //   // display: flex;
  // }

  .list-item {
    display: flex;
    // flex: 1;
    flex-flow: column nowrap;
    gap: 8px;
    min-width: 50px;
    // max-width: 440px;
    // height: 110px;
    text-decoration: none;
    border-radius: @radius-border;
    transition: opacity @transition-normal;
    &:hover {
      opacity: 0.7;
    }
    .image {
      display: flex;
      flex: none;
      width: 100%;
      height: auto;
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
      // padding: 2px 15px 2px 0;
      overflow: hidden;
      h4 {
        font-size: 14px;
        line-height: 1.3;
        color: var(--color-font);
        text-align: center;
        .mixin-ellipsis-1();
      }
    }
  }
</style>
