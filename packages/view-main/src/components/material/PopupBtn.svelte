<script lang="ts">
  import type { Snippet } from 'svelte'
  import Popup from '@/components/base/Popup.svelte'
  import type { WheelEventHandler } from 'svelte/elements'
  const {
    autoshow = true,
    children,
    content,
    onwheel,
    'aria-label': arialabel,
    debug,
    height,
    maxheight,
    ontransitionend,
    onvisible,
  }: {
    children: Snippet
    content: Snippet
    debug?: boolean
    height?: string
    maxheight?: number
    onwheel?: WheelEventHandler<HTMLButtonElement>
    autoshow?: boolean
    'aria-label': string
    ontransitionend?: (visible: boolean) => void
    onvisible?: (visible: boolean) => void
  } = $props()

  let visible = $state(false)
  let domBtn = $state<HTMLElement | null>(null)

  const handleShowPopup = (evt: MouseEvent) => {
    if (visible) {
      evt.stopPropagation()
      if (autoshow) return
      handlMsLeave()
    } else {
      handlMsEnter()
    }
    // setTimeout(() => {
    //   // if (!)
    //   visible.value = !visible.value
    // }, 50)
  }

  let timeout: number | null = null
  const handlMsEnter = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    if (visible) return
    timeout = setTimeout(() => {
      visible = true
      onvisible?.(visible)
    }, 100)
  }
  const handlMsLeave = () => {
    if (debug) return
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    if (!visible) return
    timeout = setTimeout(() => {
      timeout = null
      visible = false
      onvisible?.(visible)
    }, 100)
  }

  export const hide = () => {
    visible = false
    onvisible?.(visible)
  }
</script>

<button
  bind:this={domBtn}
  class="container"
  onclick={handleShowPopup}
  onmouseenter={() => {
    if (!autoshow) return
    handlMsEnter()
  }}
  onmouseleave={() => {
    if (!autoshow) return
    handlMsLeave()
  }}
  aria-label={arialabel}
  {onwheel}
>
  {@render children()}
  <Popup
    {visible}
    {height}
    {maxheight}
    btnel={domBtn}
    ontransitionend={() => {
      ontransitionend?.(visible)
    }}
    onmouseenter={handlMsEnter}
    onmouseleave={handlMsLeave}
  >
    {@render content()}
  </Popup>
</button>

<style lang="less">
  .container {
    position: relative;
    display: inline-block;
    padding: 0;
    background-color: transparent;
    border: none;
  }
</style>
