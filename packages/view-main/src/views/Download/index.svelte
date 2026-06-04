<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import Loading from '@/components/base/Loading.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import Empty from '@/components/material/Empty.svelte'
  import { showSimpleConfirmModal } from '@/components/apis/dialog'
  import { showNotify } from '@/components/apis/notify'
  import { i18n, t, type Message } from '@/plugins/i18n'
  import {
    cancelDownload,
    clearDownloadList,
    getDownloadList,
    pauseDownload,
    removeDownloadList,
    resumeDownload,
  } from '@/shared/ipc/list'
  import { sizeFormate } from '@/shared'
  import { buildSourceLabel } from '@any-listen/common/tools'
  import { onMount } from 'svelte'
  import { showOpenDialog, openDirInExplorer } from '@/shared/ipc/app'
  import { updateSetting } from '@/modules/setting/store/action'
  import { useSettingValue } from '@/modules/setting/reactive.svelte'

  const savePath = useSettingValue('download.savePath')
  const chooseDownloadDir = async () => {
    const { canceled, filePaths } = await showOpenDialog({ title: '选择下载目录', properties: ['openDirectory'] })
    if (canceled || !filePaths.length) return
    await updateSetting({ 'download.savePath': filePaths[0] })
  }

  // 下载音质(与播放音质独立)。源最高到 Hi-Res,母带/全景多数源不提供,故只给这四档
  const downloadQuality = useSettingValue('download.quality')
  const qualityOptions: Array<{ id: AnyListen.Music.Quality; label: string }> = [
    { id: '128k', label: '标准' },
    { id: '320k', label: '极高' },
    { id: 'flac', label: '无损' },
    { id: 'flac24bit', label: 'Hi-Res' },
  ]
  const setDownloadQuality = (q: AnyListen.Music.Quality) => {
    void updateSetting({ 'download.quality': q })
  }

  const statusKeyMap: Record<AnyListen.Download.DownloadTaskStatus, keyof Message> = {
    run: 'download.status.run',
    waiting: 'download.status.waiting',
    pause: 'download.status.pause',
    error: 'download.status.error',
    completed: 'download.status.completed',
  }

  let list = $state.raw<AnyListen.Download.ListItem[]>([])
  let selectedIds = $state.raw<string[]>([])
  let loading = $state(false)
  let error = $state(false)
  let errorMessage = $state('')

  const selectedIdSet = $derived(new Set(selectedIds))
  const allSelected = $derived(list.length > 0 && selectedIds.length == list.length)

  const loadList = async () => {
    loading = true
    error = false
    try {
      list = [...(await getDownloadList())]
      const validIds = new Set(list.map((task) => task.id))
      selectedIds = selectedIds.filter((id) => validIds.has(id))
    } catch (err) {
      error = true
      errorMessage = (err as Error).message
    } finally {
      loading = false
    }
  }

  const getProgress = (task: AnyListen.Download.ListItem) => {
    const value = task.progress || (task.total ? (task.downloaded / task.total) * 100 : task.isComplate ? 100 : 0)
    return Math.max(0, Math.min(100, value))
  }

  const getStatusKey = (status: AnyListen.Download.DownloadTaskStatus) => statusKeyMap[status]

  const getSizeText = (task: AnyListen.Download.ListItem) => {
    if (!task.total) return sizeFormate(task.downloaded)
    return `${sizeFormate(task.downloaded)} / ${sizeFormate(task.total)}`
  }

  const getTaskTitle = (task: AnyListen.Download.ListItem) => {
    return task.metadata.fileName || task.metadata.musicInfo.name
  }

  const getTaskPath = (task: AnyListen.Download.ListItem) => {
    return task.metadata.filePath || i18n.t('download.unknown_path')
  }

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      selectedIds = selectedIdSet.has(id) ? selectedIds : [...selectedIds, id]
    } else {
      selectedIds = selectedIds.filter((item) => item != id)
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    selectedIds = checked ? list.map((task) => task.id) : []
  }

  const handleRemove = async (ids: string[]) => {
    if (!ids.length) return
    const confirmed = await showSimpleConfirmModal(
      i18n.t(ids.length == 1 ? 'download.remove_confirm' : 'download.remove_selected_confirm', { count: ids.length }),
      { confirmBtn: i18n.t('btn_remove') }
    )
    if (!confirmed) return
    await removeDownloadList(ids)
    const removeIdSet = new Set(ids)
    list = list.filter((task) => !removeIdSet.has(task.id))
    selectedIds = selectedIds.filter((id) => !removeIdSet.has(id))
    showNotify(i18n.t('download.remove_done', { count: ids.length }))
  }

  const handleClear = async () => {
    if (!list.length) return
    const confirmed = await showSimpleConfirmModal(i18n.t('download.clear_confirm'), { confirmBtn: i18n.t('btn_clear') })
    if (!confirmed) return
    await clearDownloadList()
    list = []
    selectedIds = []
    showNotify(i18n.t('download.clear_done'))
  }

  // 静默刷新(不触发 loading 闪烁),用于轮询进度
  const refreshList = async () => {
    try {
      const next = await getDownloadList()
      list = [...next]
      const validIds = new Set(list.map((task) => task.id))
      selectedIds = selectedIds.filter((id) => validIds.has(id))
    } catch {
      /* 轮询失败忽略,下次再试 */
    }
  }

  const handlePause = async (id: string) => {
    try {
      await pauseDownload(id)
    } finally {
      void refreshList()
    }
  }
  const handleResume = async (id: string) => {
    try {
      await resumeDownload(id)
    } finally {
      void refreshList()
    }
  }
  const handleCancel = async (id: string) => {
    try {
      await cancelDownload(id)
      list = list.filter((t) => t.id != id)
      selectedIds = selectedIds.filter((sid) => sid != id)
    } catch {
      void refreshList()
    }
  }

  onMount(() => {
    void loadList()
    // 有进行中任务时每秒轮询进度(下载在主进程跑,无推送通道,这里拉取)
    const timer = setInterval(() => {
      if (list.some((t) => t.status == 'run' || t.status == 'waiting')) void refreshList()
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  })
</script>

<div class="view-container download-container">
  <header class="download-header">
    <div class="title">
      <h2>{$t('download')}</h2>
      <p>{$t('download.summary', { count: list.length })}</p>
    </div>
    <div class="actions">
      <Btn icontext onclick={loadList}>
        <SvgIcon name="refresh" />
        {$t('download.action.refresh')}
      </Btn>
      <Btn icontext outline disabled={!selectedIds.length} onclick={() => handleRemove(selectedIds)}>
        <SvgIcon name="delete" />
        {$t('download.action.remove_selected')}
      </Btn>
      <Btn icontext outline disabled={!list.length} onclick={handleClear}>
        <SvgIcon name="eraser" />
        {$t('download.action.clear')}
      </Btn>
    </div>
  </header>

  {#if import.meta.env.VITE_IS_DESKTOP}
    <div class="download-dir">
      <span class="dir-label">下载音质</span>
      <div class="quality-seg">
        {#each qualityOptions as opt (opt.id)}
          <button type="button" class:active={downloadQuality.val == opt.id} onclick={() => setDownloadQuality(opt.id)}>
            {opt.label}
          </button>
        {/each}
      </div>
      <span class="dir-spacer"></span>
    </div>
    <div class="download-dir">
      <span class="dir-label">下载到</span>
      <span class="dir-path" title={savePath.val || ''}>{savePath.val || '默认(系统下载目录 / music)'}</span>
      <span class="dir-hint">· 自动按歌手分子目录</span>
      <span class="dir-spacer"></span>
      <Btn icontext outline onclick={chooseDownloadDir}>更改目录</Btn>
      {#if savePath.val}
        <Btn icontext outline onclick={() => openDirInExplorer(savePath.val)}>打开</Btn>
      {/if}
    </div>
  {/if}

  <section class="download-panel">
    {#if list.length}
      <div class="list-head">
        <label class="check">
          <input
            type="checkbox"
            checked={allSelected}
            aria-label={$t('btn_select_all')}
            onchange={(event) => {
              toggleSelectAll(event.currentTarget.checked)
            }}
          />
        </label>
        <span>{$t('download.column.task')}</span>
        <span>{$t('download.column.progress')}</span>
        <span>{$t('download.column.status')}</span>
        <span>{$t('download.column.path')}</span>
        <span class="head-action">{$t('download.column.action')}</span>
      </div>
      <div class="list-body">
        {#each list as task (task.id)}
          {@const musicInfo = task.metadata.musicInfo}
          {@const sourceLabels = buildSourceLabel(musicInfo)}
          {@const progress = getProgress(task)}
          <article class="task-row">
            <label class="check">
              <input
                type="checkbox"
                checked={selectedIdSet.has(task.id)}
                aria-label={getTaskTitle(task)}
                onchange={(event) => {
                  toggleSelect(task.id, event.currentTarget.checked)
                }}
              />
            </label>
            <div class="task-main">
              <div class="music-title" title={getTaskTitle(task)}>{getTaskTitle(task)}</div>
              <div class="music-meta">
                <span title={musicInfo.singer}>{musicInfo.singer || '--'}</span>
                <span title={musicInfo.meta.albumName}>{musicInfo.meta.albumName || '--'}</span>
                <span>{task.metadata.quality}</span>
                <span>{task.metadata.ext}</span>
                {#each sourceLabels as label (label)}
                  <span>{label}</span>
                {/each}
              </div>
            </div>
            <div class="progress-cell">
              <div class="progress-top">
                <span>{progress.toFixed(0)}%</span>
                <span>{getSizeText(task)}</span>
              </div>
              <div class="progress-bar" aria-hidden="true">
                <div class="progress-bar-value" style={`width: ${progress}%;`}></div>
              </div>
            </div>
            <div class={['status', `status-${task.status}`]}>
              <span>{$t(getStatusKey(task.status))}</span>
              {#if task.statusText}
                <em title={task.statusText}>{task.statusText}</em>
              {:else if task.speed}
                <em>{task.speed}/s</em>
              {/if}
            </div>
            <div class="path" title={getTaskPath(task)}>{getTaskPath(task)}</div>
            <div class="row-actions">
              {#if task.status == 'run' || task.status == 'waiting'}
                <Btn icontext outline onclick={() => handlePause(task.id)} aria-label="暂停">暂停</Btn>
              {:else if task.status == 'pause' || task.status == 'error'}
                <Btn icontext outline onclick={() => handleResume(task.id)} aria-label="继续">继续</Btn>
              {/if}
              {#if !task.isComplate}
                <Btn icontext outline onclick={() => handleCancel(task.id)} aria-label="取消">取消</Btn>
              {/if}
              <Btn icon outline onclick={() => handleRemove([task.id])} aria-label={$t('btn_remove')}>
                <SvgIcon name="delete" />
              </Btn>
            </div>
          </article>
        {/each}
      </div>
    {:else if !loading && !error}
      <Empty label={$t('download.empty')} />
    {/if}
    <Loading {loading} {error} {errorMessage} onreload={loadList} />
  </section>
</div>

<style lang="less">
  .download-container {
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    min-width: 0;
    font-size: 14px;
  }

  .download-header {
    display: flex;
    flex: none;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--color-border);
  }

  .title {
    min-width: 0;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    p {
      margin: 4px 0 0;
      color: var(--color-font-label);
    }
  }

  .actions {
    display: flex;
    flex: none;
    gap: 8px;
    align-items: center;
  }

  .download-dir {
    display: flex;
    flex: none;
    gap: 8px;
    align-items: center;
    margin-bottom: 10px;
    padding: 8px 12px;
    font-size: 13px;
    background: var(--color-primary-background);
    border-radius: 8px;

    .dir-label {
      color: var(--color-font-label);
    }
    .dir-path {
      max-width: 46%;
      overflow: hidden;
      color: var(--color-font);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dir-hint {
      color: var(--color-font-label);
    }
    .dir-spacer {
      flex: auto;
    }
  }
  .quality-seg {
    display: flex;
    gap: 4px;

    button {
      padding: 3px 12px;
      font-size: 13px;
      color: var(--color-font-label);
      cursor: pointer;
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      transition: all 0.15s ease;

      &:hover {
        color: var(--color-font);
      }
      &.active {
        color: var(--color-button-font-selected);
        background: var(--color-primary);
        border-color: transparent;
      }
    }
  }

  .download-panel {
    position: relative;
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    min-height: 0;
    padding: 12px 16px 16px;
  }

  .list-head,
  .task-row {
    display: grid;
    grid-template-columns: 32px minmax(180px, 1.35fr) minmax(180px, 0.85fr) minmax(100px, 0.45fr) minmax(180px, 1fr) 44px;
    gap: 10px;
    align-items: center;
    min-width: 760px;
  }

  .list-head {
    flex: none;
    padding: 0 10px 8px;
    font-size: 12px;
    color: var(--color-font-label);
    border-bottom: 1px solid var(--color-border);
  }

  .head-action {
    text-align: center;
  }

  .list-body {
    flex: auto;
    min-height: 0;
    // 始终显示滚动条(macOS 默认覆盖式会隐藏,1000+ 任务时难定位)
    overflow-y: scroll;

    &::-webkit-scrollbar {
      width: 10px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 5px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: var(--color-font-label);
    }
  }

  .task-row {
    padding: 10px;
    border-bottom: 1px solid var(--color-border);
    transition: background-color @transition-fast;

    &:hover {
      background-color: var(--color-primary-background-hover);
    }
  }

  .check {
    display: flex;
    align-items: center;
    justify-content: center;

    input {
      width: 16px;
      height: 16px;
      margin: 0;
    }
  }

  .task-main,
  .progress-cell,
  .status,
  .path {
    min-width: 0;
  }

  .music-title,
  .path,
  .status em,
  .music-meta span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .music-title {
    font-weight: 600;
  }

  .music-meta {
    display: flex;
    gap: 6px;
    min-width: 0;
    margin-top: 5px;
    font-size: 12px;
    color: var(--color-font-label);

    span {
      min-width: 0;
      padding-right: 6px;
      border-right: 1px solid var(--color-border);

      &:last-child {
        border-right: 0;
      }
    }
  }

  .progress-top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--color-font-label);
  }

  .progress-bar {
    height: 6px;
    overflow: hidden;
    background-color: var(--color-primary-light-300-alpha-600);
    border-radius: 3px;
  }

  .progress-bar-value {
    height: 100%;
    background-color: var(--color-primary-alpha-700);
    transition: width @transition-normal;
  }

  .status {
    display: flex;
    flex-flow: column nowrap;
    gap: 3px;

    span {
      font-weight: 600;
    }

    em {
      font-size: 12px;
      font-style: normal;
      color: var(--color-font-label);
    }
  }

  .status-error span {
    color: var(--color-font-error);
  }

  .status-completed span {
    color: var(--color-primary-alpha-900);
  }

  .path {
    color: var(--color-font-label);
  }

  .row-actions {
    display: flex;
    justify-content: center;

    :global(.btn) {
      width: 30px;
      height: 30px;
    }
  }

  @media (width <= 900px) {
    .download-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .actions {
      flex-wrap: wrap;
    }
  }
</style>
