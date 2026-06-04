<script lang="ts">
  import Image from '@/components/base/Image.svelte'
  import CommentFloor from './CommentFloor.svelte'
  import { t } from '@/plugins/i18n'
  import { dateFormat2 } from '@/shared'

  let { comments = [], nested = false }: { comments?: AnyListen.Resource.MusicCommentItem[]; nested?: boolean } = $props()
</script>

<div class="container" class:reply-floor={nested}>
  <ul>
    {#each comments as item (item.id)}
      <li class="list-item">
        <div class="content">
          <div class="left">
            <Image src={item.avatar} />
          </div>
          <div class="right">
            <div class="info">
              <div class="base-info">
                <div class="select name">{item.userName}</div>
                <div class="meta-info">
                  {#if item.time}
                    <time class="label">{dateFormat2(item.time)}</time>
                  {/if}
                  {#if item.location}
                    <div class="label">{$t('music_comment.location', { location: item.location })}</div>
                  {/if}
                </div>
              </div>
              {#if item.likedCount != null}
                <div class="likes">
                  <svg
                    class="likes-icon"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 512 512"
                  >
                    <use xlink:href="#icon-thumbs-up"></use>
                  </svg>
                  {item.likedCount}
                </div>
              {/if}
            </div>
            <p class="select comment-text">{item.text}</p>
            {#if item.images?.length}
              <div class="comment-images">
                {#each item.images as url, index (index)}
                  <Image src={url} />
                {/each}
              </div>
            {/if}
          </div>
        </div>
        {#if item.reply?.length}
          <CommentFloor comments={item.reply} nested={true} />
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style lang="less">
  @padding: 15px;

  .list-item {
    border-bottom: 1px dashed var(--color-primary-alpha-700);
  }

  .content {
    display: flex;
    padding: 12px 0;
    font-size: 13px;
    color: var(--color-font);
  }
  .left {
    flex: none;
    align-self: flex-start;
    width: 40px;
    aspect-ratio: 1 / 1;
  }

  .right {
    flex: auto;
    min-width: 0;
    margin-left: 10px;
  }

  .info {
    display: flex;
    flex-flow: row nowrap;
    gap: 15px;
    width: 100%;
    height: 40px;
    line-height: 1.3;
    color: var(--color-450);
  }
  .base-info {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    justify-content: space-evenly;
    min-width: 0;
    height: 100%;
  }
  .meta-info {
    display: flex;
    flex-flow: row nowrap;
    gap: 10px;
    min-width: 0;
    overflow: hidden;
  }
  .name {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-650);
    white-space: nowrap;
  }
  .label {
    flex: none;
    font-size: 12px;
  }
  .likes {
    flex: none;
    align-self: flex-start;
    padding-top: 3px;
    font-size: 11px;
    text-align: right;
  }
  .likes-icon {
    width: 12px;
    height: 12px;
    margin-right: 3px;
    color: var(--color-primary-alpha-500);
  }
  .comment-text {
    font-size: 14px;
    line-height: 1.5;
    text-align: justify;
    word-break: break-all;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }
  .comment-images {
    display: flex;
    flex-flow: row wrap;
    gap: 5px;
    margin-top: 5px;

    :global(.img) {
      max-width: 240px;
    }
  }

  .reply-floor {
    padding: 0 0 0 @padding;
    margin-left: @padding * 2;
    background-color: var(--color-primary-light-500-alpha-700);
    border-radius: 0.5rem;
    &:last-child {
      margin-bottom: 12px;
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .right {
      margin-right: 10px;
    }
  }
</style>
