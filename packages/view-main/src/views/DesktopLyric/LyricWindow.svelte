<script lang="ts">
  import { onMount } from 'svelte'

  interface LrcLine {
    time: number
    text: string
    ext?: string
  }

  let lines = $state.raw<LrcLine[]>([])
  let activeIndex = $state(-1)
  let playing = $state(false)
  let offset = $state(0)
  let rate = $state(1)
  let title = $state('')

  let baseTime = 0 // 基准歌词时间(ms)
  let baseClock = 0 // 对应的 performance.now()
  let raf = 0

  const timeExp = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g
  const parseLrc = (lrc: string | null): LrcLine[] => {
    if (!lrc) return []
    const result: LrcLine[] = []
    for (const raw of lrc.split('\n')) {
      timeExp.lastIndex = 0
      const text = raw.replace(timeExp, '').trim()
      let m: RegExpExecArray | null
      timeExp.lastIndex = 0
      while ((m = timeExp.exec(raw))) {
        const min = parseInt(m[1])
        const sec = parseInt(m[2])
        const ms = m[3] ? parseInt(m[3].padEnd(3, '0')) : 0
        result.push({ time: min * 60000 + sec * 1000 + ms, text })
      }
    }
    return result.sort((a, b) => a.time - b.time)
  }

  const mergeExt = (base: LrcLine[], ext: LrcLine[]) => {
    if (!ext.length) return base
    const map = new Map(ext.map((l) => [l.time, l.text]))
    return base.map((l) => ({ ...l, ext: map.get(l.time) }))
  }

  const setLyrics = (lrc: string | null, tlrc: string | null) => {
    lines = mergeExt(parseLrc(lrc), parseLrc(tlrc))
    updateActive(currentTime())
  }

  const currentTime = () => {
    if (!playing) return baseTime
    return baseTime + (performance.now() - baseClock) * rate
  }

  const updateActive = (t: number) => {
    const time = t + offset
    let idx = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= time) idx = i
      else break
    }
    if (idx != activeIndex) activeIndex = idx
  }

  const tick = () => {
    updateActive(currentTime())
    if (playing) raf = requestAnimationFrame(tick)
  }
  const startClock = (fromMs: number) => {
    baseTime = fromMs
    baseClock = performance.now()
    playing = true
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(tick)
  }
  const pauseClock = () => {
    baseTime = currentTime()
    playing = false
    cancelAnimationFrame(raf)
  }
  const stopClock = () => {
    playing = false
    baseTime = 0
    cancelAnimationFrame(raf)
    activeIndex = -1
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAction = (action: any) => {
    switch (action?.action) {
      case 'set_info':
        title = `${action.data.name ?? ''} - ${action.data.singer ?? ''}`
        setLyrics(action.data.lrc, action.data.tlrc)
        if (action.data.isPlay) startClock(action.data.played_time ?? 0)
        else {
          baseTime = action.data.played_time ?? 0
          updateActive(baseTime)
        }
        break
      case 'set_lyric':
        setLyrics(action.data.lrc, action.data.tlrc)
        break
      case 'set_play':
        startClock(typeof action.data == 'number' ? action.data : currentTime())
        break
      case 'set_pause':
        pauseClock()
        break
      case 'set_stop':
        stopClock()
        break
      case 'set_offset':
        offset = action.data ?? 0
        updateActive(currentTime())
        break
      case 'set_playbackRate':
        rate = action.data || 1
        break
      // set_info 的 send_analyser_data_array 暂不处理(无可视化)
    }
  }

  const bindPort = (port: MessagePort) => {
    port.onmessage = ({ data }) => {
      handleAction(data)
    }
    try {
      port.start()
    } catch {}
    // 主动拉取当前状态
    port.postMessage({ action: 'get_info' })
  }

  // 锁定:整窗鼠标穿透(到 dock/桌面),hover 到锁按钮时临时可点用于解锁
  let locked = $state(false)
  let lockBtnEl = $state<HTMLButtonElement | undefined>(undefined)
  const lyricWin = () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__lyricWin as { setIgnoreMouse: (b: boolean) => void; setLock: (b: boolean) => void } | undefined
  const applyLockState = (l: boolean) => {
    locked = l
    if (!l) lyricWin()?.setIgnoreMouse(false) // 解锁:恢复整窗可交互
  }
  const toggleLock = () => {
    const next = !locked
    applyLockState(next)
    lyricWin()?.setLock(next)
  }
  const onMouseMove = (e: MouseEvent) => {
    if (!locked) return
    const r = lockBtnEl?.getBoundingClientRect()
    const over = !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    lyricWin()?.setIgnoreMouse(!over) // 仅悬停锁按钮时可点
  }

  onMount(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    const root = document.getElementById('root')
    if (root) {
      root.style.display = ''
      root.style.background = 'transparent'
      root.style.backgroundColor = 'transparent'
      root.style.backgroundImage = 'none'
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    w.__onLyricPort = bindPort
    if (w.__pendingLyricPort) {
      bindPort(w.__pendingLyricPort)
      w.__pendingLyricPort = null
    }
    // 锁定状态:主进程下发初始值
    w.__onLyricLockState = applyLockState
    if (typeof w.__pendingLyricLock == 'boolean') {
      applyLockState(w.__pendingLyricLock)
      w.__pendingLyricLock = undefined
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
    }
  })

  const cur = $derived(activeIndex >= 0 ? lines[activeIndex] : null)
  const next = $derived(activeIndex + 1 < lines.length ? lines[activeIndex + 1] : null)
</script>

<div class="desktop-lyric" class:locked>
  <div class="drag-bar" aria-hidden="true"></div>
  <div class="lyric-controls">
    <button
      bind:this={lockBtnEl}
      type="button"
      class="ctrl-btn"
      onclick={toggleLock}
      aria-label={locked ? '解锁桌面歌词' : '锁定(鼠标穿透)'}
      title={locked ? '解锁桌面歌词' : '锁定后鼠标穿透到下层'}
    >
      {#if locked}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 7.9-1" />
        </svg>
      {/if}
    </button>
  </div>
  <div class="lyric-body">
    {#if cur}
      <div class="line cur">
        <span class="text">{cur.text || ' '}</span>
        {#if cur.ext}
          <span class="ext">{cur.ext}</span>
        {/if}
      </div>
      {#if next}
        <div class="line next">
          <span class="text">{next.text}</span>
        </div>
      {/if}
    {:else}
      <div class="line cur placeholder">
        <span class="text">{title || 'Any Listen 桌面歌词'}</span>
      </div>
    {/if}
  </div>
</div>

<style lang="less">
  :global(html),
  :global(body),
  :global(#root) {
    margin: 0;
    padding: 0 !important;
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
    box-shadow: none !important;
    overflow: hidden;
    user-select: none;
  }
  // app.less 给 #root 加了一个铺满全屏的 ::before 白色遮罩,歌词窗必须干掉它
  :global(#root::before) {
    display: none !important;
    background: transparent !important;
    opacity: 0 !important;
  }
  .desktop-lyric {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    padding: 10px 24px;
    text-align: center;
    background: transparent;
  }
  .drag-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    -webkit-app-region: drag;
    cursor: move;
  }
  .desktop-lyric.locked .drag-bar {
    -webkit-app-region: no-drag;
    cursor: default;
  }
  .lyric-controls {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 2;
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.2s ease;
    -webkit-app-region: no-drag;
  }
  // 未锁:hover 整窗才显示;已锁:常显一个淡锁(方便找到去解锁),hover 变亮
  .desktop-lyric:hover .lyric-controls {
    opacity: 1;
  }
  .desktop-lyric.locked .lyric-controls {
    opacity: 0.4;
  }
  .desktop-lyric.locked:hover .lyric-controls {
    opacity: 1;
  }
  .ctrl-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    color: #fff;
    cursor: pointer;
    background-color: rgb(0 0 0 / 45%);
    border: 1px solid rgb(255 255 255 / 25%);
    border-radius: 50%;
    -webkit-app-region: no-drag;

    svg {
      width: 15px;
      height: 15px;
    }
    &:hover {
      background-color: rgb(0 0 0 / 70%);
    }
  }
  .desktop-lyric.locked .ctrl-btn {
    color: rgb(64, 150, 255);
    border-color: rgb(64 150 255 / 60%);
  }
  .lyric-body {
    position: relative;
    z-index: 1;
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    align-items: center;
    pointer-events: none;
  }
  .line {
    line-height: 1.25;

    .text {
      display: block;
      font-weight: 700;
      text-shadow:
        0 2px 6px rgba(0, 0, 0, 0.55),
        0 0 2px rgba(0, 0, 0, 0.7);
    }
    .ext {
      display: block;
      margin-top: 2px;
      font-size: 18px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.85);
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.55);
    }
  }
  .cur .text {
    font-size: 38px;
    color: rgb(64, 150, 255);
  }
  .next .text {
    font-size: 24px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.75);
  }
  .placeholder .text {
    color: rgba(255, 255, 255, 0.85);
    font-size: 28px;
  }
</style>
