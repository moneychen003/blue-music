<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import Input from '@/components/base/Input.svelte'
  import Selection from '@/components/base/Selection.svelte'
  import Modal from '@/components/material/Modal.svelte'
  import type { SourceType } from '../../../shared.svelte'
  import { getSourceId, useResourceList } from '../../../shared.svelte'
  import { t } from '@/plugins/i18n'
  import { openUrl } from '@/shared/ipc/app'
  import { buildTopSongsDetailUrl } from '../../shared.svelte'
  import { extT } from '@/modules/extension/i18n'
  import { pushRoute } from '@/modules/resource/actions'

  let { source }: { source?: SourceType } = $props()

  const FAQ_URL = 'https://lyswhut.github.io/lx-music-doc/desktop/faq/cannot-open-songlist'
  let visible = $state(false)
  let text = $state('')
  let selectedSourceId = $state<string>('')

  let resourceList = useResourceList('songlist')
  let sourceList = $derived<Array<{ id: string; name: string }>>(
    resourceList.val.songlist!.map((item) => ({
      id: getSourceId(item),
      name: $extT(item.extensionId, item.name),
    }))
  )

  const handleSubmit = () => {
    const id = text.trim()
    if (!id) return
    const { path, meta } = buildTopSongsDetailUrl({ id, sid: selectedSourceId || source!.sId })
    pushRoute(path, meta)
    visible = false
  }

  $effect(() => {
    if (!visible) return
    if (source?.sId) selectedSourceId = source.sId
    text = ''
  })
</script>

{#if source}
  <Btn
    min
    link
    --btn-font="var(--color-font)"
    onclick={() => {
      visible = true
    }}
  >
    {$t('online.songlist.open_list')}
  </Btn>
{/if}

<Modal bind:visible teleport="#view" width="76%" maxwidth="800px" minheight="0">
  <main class="main scroll">
    <h2>{$t('online.songlist.open_list.title')}</h2>
    <div class="input-content">
      <div class="select">
        <Selection bind:value={selectedSourceId} list={sourceList} itemkey="id" itemname="name" />
      </div>
      <div class="input">
        <Input
          bind:value={text}
          trim
          autofocus
          placeholder={$t('online.songlist.open_list.placeholder')}
          onsubmit={handleSubmit}
        />
      </div>
    </div>
    <div class="footer">
      <div class="tips">
        <ul>
          <li>{$t('online.songlist.open_list.tip_1')}</li>
        </ul>
      </div>
      <div class="confirm">
        <Btn onclick={handleSubmit}>{$t('online.songlist.open_list.confirm')}</Btn>
      </div>
    </div>
  </main>
</Modal>

<style lang="less">
  .main {
    display: flex;
    flex-flow: column nowrap;
    min-height: 0;
    padding: 0 15px;

    h2 {
      padding: 15px 0 8px;
      font-size: 14px;
      line-height: 1.3;
      color: var(--color-font);
      word-break: break-all;
    }
  }

  .input-content {
    display: flex;
    flex-flow: row nowrap;
  }

  .select {
    width: auto;

    :global {
      .select {
        width: 100%;
        height: 100%;
      }

      .button {
        height: 100%;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      .list-item {
        height: 32px;
        font-size: 13px;
        text-align: center;
      }
    }
  }

  .input {
    flex: auto;

    :global(.input) {
      width: 100%;
      padding: 8px;
      color: var(--color-font);
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }

  .footer {
    display: flex;
    flex-flow: row nowrap;
    align-items: flex-end;
    margin: 50px 0 15px;
  }

  .tips {
    flex: auto;
    font-size: 12px;
    line-height: 1.5;
    color: var(--color-font);

    ul {
      padding-left: 15px;
      list-style: decimal;
    }

    :global(button.link) {
      font-size: inherit;
      text-decoration: underline;
    }
  }

  .confirm {
    :global(.btn) {
      min-width: 80px;
    }
  }
</style>
