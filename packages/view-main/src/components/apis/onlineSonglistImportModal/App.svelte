<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import Input from '@/components/base/Input.svelte'
  import Selection from '@/components/base/Selection.svelte'
  import Modal from '@/components/material/Modal.svelte'
  import { showNotify } from '@/components/apis/notify'
  import { extT } from '@/modules/extension/i18n'
  import { addListMusics, createUserList, setFetchingListStatus } from '@/modules/musicLibrary/store/actions'
  import { musicLibraryState } from '@/modules/musicLibrary/store/state'
  import { songlistDetailAll, songlistDetailAllWithInfo } from '@/modules/resource/songlist/detail/actions'
  import { guessSonglistSourceId, parseSonglistInput } from '@/modules/resource/songlist/url'
  import { getSourceId, useResourceList } from '@/views/Online/shared.svelte'
  import { i18n, t } from '@/plugins/i18n'

  let {
    onafterleave,
  }: {
    onafterleave: () => void
  } = $props()

  let visible = $state(false)
  let loading = $state(false)
  let text = $state('')
  let selectedSourceId = $state('')
  let targetList = $state<AnyListen.List.MyListInfo | null>(null)

  let resourceList = useResourceList('songlist')
  let sourceList = $derived<Array<{ id: string; sId: string; name: string; extensionId: string }>>(
    (resourceList.val.songlist ?? []).map((item) => ({
      id: item.id,
      sId: getSourceId(item),
      name: $extT(item.extensionId, item.name),
      extensionId: item.extensionId,
    }))
  )

  export const show = (listInfo?: AnyListen.List.MyListInfo | null) => {
    targetList = listInfo ?? null
    text = ''
    selectedSourceId = sourceList[0]?.sId ?? ''
    visible = true
  }

  const closeModal = () => {
    if (loading) return
    visible = false
  }

  const importIntoTargetList = async (
    target: AnyListen.List.MyListInfo,
    source: { extensionId: string; id: string },
    songlistId: string
  ) => {
    setFetchingListStatus(target.id, true)
    try {
      const list = await songlistDetailAll(source.extensionId, source.id, songlistId)
      await addListMusics(target.id, list)
      showNotify(i18n.t('user_list__import_online_playlist_success', { count: list.length }))
      visible = false
    } catch (err) {
      showNotify(i18n.t('user_list__import_playlist_failed', { err: (err as Error).message }))
    } finally {
      setFetchingListStatus(target.id, false)
    }
  }

  const importAsNewList = async (source: { extensionId: string; id: string }, songlistId: string) => {
    try {
      const { list, info } = await songlistDetailAllWithInfo(source.extensionId, source.id, songlistId)
      const name = info?.name?.trim() || text.trim() || '导入的歌单'
      const newListId = await createUserList(musicLibraryState.userLists.length, {
        id: '',
        type: 'general',
        name,
        parentId: null,
        meta: {
          createTime: 0,
          updateTime: 0,
          playCount: 0,
          posTime: 0,
          songCount: 0,
          pic: '',
          desc: '',
        },
      })
      if (newListId) await addListMusics(newListId, list)
      showNotify(i18n.t('user_list__import_online_playlist_success', { count: list.length }))
      visible = false
    } catch (err) {
      showNotify(i18n.t('user_list__import_playlist_failed', { err: (err as Error).message }))
    }
  }

  const handleSubmit = async () => {
    if (loading) return
    const parsed = parseSonglistInput(text)
    if (!parsed) {
      showNotify(i18n.t('user_list__import_online_playlist_invalid'))
      return
    }
    if (!sourceList.length) {
      showNotify(i18n.t('user_list__import_online_playlist_source_empty'))
      return
    }
    const sid = guessSonglistSourceId(parsed.platform, sourceList) || selectedSourceId
    const source = sourceList.find((s) => s.sId == sid) ?? sourceList[0]
    loading = true
    try {
      if (targetList) {
        await importIntoTargetList(targetList, source, parsed.id)
      } else {
        await importAsNewList(source, parsed.id)
      }
    } finally {
      loading = false
    }
  }

  $effect(() => {
    if (!visible || selectedSourceId || !sourceList.length) return
    selectedSourceId = sourceList[0].sId
  })

  $effect(() => {
    if (!visible || !text) return
    const parsed = parseSonglistInput(text)
    if (!parsed?.platform) return
    const sid = guessSonglistSourceId(parsed.platform, sourceList)
    if (sid) selectedSourceId = sid
  })
</script>

<Modal bind:visible teleport="#root" bgclose={!loading} keyclose={!loading} {onafterleave} width="76%" maxwidth="720px" minheight="0">
  <main class="main">
    <h2>{targetList ? $t('user_list__import_online_playlist_title') : '导入网易云歌单为新列表'}</h2>
    <p>
      {#if targetList}
        {$t('user_list__import_online_playlist_tip', { name: targetList.name })}
      {:else}
        粘贴歌单链接，将自动以歌单原名新建一个列表并导入歌曲。
      {/if}
    </p>
    <div class="input-content">
      <div class="select">
        <Selection bind:value={selectedSourceId} list={sourceList} itemkey="sId" itemname="name" />
      </div>
      <div class="input">
        <Input
          bind:value={text}
          trim
          autofocus
          disabled={loading}
          placeholder={$t('user_list__import_online_playlist_placeholder')}
          onsubmit={() => {
            void handleSubmit()
          }}
        />
      </div>
    </div>
    <div class="footer">
      <Btn disabled={loading} outline onclick={closeModal}>{$t('btn_cancel')}</Btn>
      <Btn disabled={loading || !text.trim()} onclick={handleSubmit}>{$t('btn_confirm')}</Btn>
    </div>
  </main>
</Modal>

<style lang="less">
  .main {
    display: flex;
    flex-flow: column nowrap;
    min-height: 0;
    padding: 0 15px 15px;

    h2 {
      padding: 15px 0 8px;
      font-size: 16px;
      color: var(--color-font);
    }

    p {
      margin: 0 0 12px;
      font-size: 13px;
      color: var(--color-font-label);
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
        width: 160px;
        height: 100%;
      }

      .button {
        height: 100%;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
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
    flex: none;
    flex-flow: row nowrap;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 18px;
  }
</style>
