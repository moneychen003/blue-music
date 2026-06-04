<script lang="ts">
  import { musicInfo } from '@/modules/player/reactive.svelte'
  import { pushRoute } from '@/modules/resource/actions'
  import { t } from '@/plugins/i18n'

  const toOnlineSearch = (queryType: 'singer' | 'album', text: string | undefined) => {
    const keyword = text?.trim()
    if (!keyword) return
    pushRoute('/online', {
      t: 'search',
      qt: queryType,
      q: keyword,
    })
  }
</script>

<div class="scroll info">
  <p><span>{$t('play_detail.music_name')}</span>{$musicInfo.name}</p>
  <p>
    <span>{$t('play_detail.music_singer')}</span>
    <button
      type="button"
      class="meta-link"
      onclick={() => {
        toOnlineSearch('singer', $musicInfo.singer)
      }}
    >
      {$musicInfo.singer}
    </button>
  </p>
  {#if $musicInfo.album}
    <p>
      <span>{$t('play_detail.music_album')}</span>
      <button
        type="button"
        class="meta-link"
        onclick={() => {
          toOnlineSearch('album', $musicInfo.album)
        }}
      >
        {$musicInfo.album}
      </button>
    </p>
  {/if}
</div>

<style lang="less">
  .info {
    flex: auto;
    width: var(--content-width);
    // padding-bottom: 15px;
    min-height: 0;
    margin-top: 15px;
    p {
      font-size: 16px;
      line-height: 1.5;
      overflow-wrap: break-word;

      span {
        font-size: 14px;
        color: var(--color-font-label);
      }

      .meta-link {
        padding: 0;
        font: inherit;
        color: inherit;
        text-align: left;
        cursor: pointer;
        background: transparent;
        border: none;
        transition: color @transition-normal;

        &:hover {
          color: var(--color-primary);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      }
    }
  }
</style>
