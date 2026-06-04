<script lang="ts">
  import { menuLocaltion } from '@/shared/compositions/menuLocaltion.svelte'
  import Portal from '@/components/base/Portal.svelte'
  import { tick } from 'svelte'
  import FontSize from './components/FontSize.svelte'
  import LyricOffset from './components/LyricOffset.svelte'

  let visible = $state(false)
  let location = $state.raw({ x: 0, y: 0 })
  let render = $state(false)
  let anim = $state(false)

  const onHide = () => {
    visible = false
  }

  $effect(() => {
    if (visible) {
      render = true
      void tick().then(() => {
        anim = true
      })
      return
    }
    anim = false
  })

  export const show = (x: number, y: number) => {
    location = { x, y }
    visible = true
  }
</script>

{#if render}
  <Portal to="#root">
    <div
      {@attach menuLocaltion({
        reactives: {
          get visible() {
            return anim
          },
          get location() {
            return location
          },
        },
        onHide,
      })}
      class="container"
      role="toolbar"
      tabindex="-1"
      inert={!anim}
      ontransitionend={() => {
        if (!visible) render = false
      }}
    >
      <FontSize />
      <LyricOffset />
    </div>
  </Portal>
{/if}

<style lang="less">
  .container {
    position: absolute;
    z-index: 10;
    display: flex;
    flex-flow: column nowrap;
    overflow: hidden;
    font-size: 12px;
    outline: none;
    background-color: var(--color-content-background);
    border-radius: @radius-border;
    box-shadow: @shadow-popup;
    opacity: 0;
    transform: scale(0);
    transform-origin: 0 0 0;
    transition: 0.14s ease;
    transition-property: transform, opacity;

    :global {
      .group {
        display: flex;
        flex-direction: column;
      }
      .title {
        flex: auto;
        min-width: 130px;
        padding: 10px 0 10px 10px;
        color: var(--color-font-label);
        white-space: nowrap;
      }
      .sub-group {
        display: flex;
        flex-flow: row nowrap;
      }
      .btn {
        box-sizing: border-box;
        display: flex;
        flex: auto;
        align-items: center;
        justify-content: center;
        min-width: 60px;
        height: 34px;
        padding: 0 10px;
        white-space: nowrap;
        cursor: pointer;
        outline: none;
        background-color: var(--color-content-background);
        border: none;
        transition: @transition-normal;
        transition-property: background-color, opacity;
        .mixin-ellipsis-1();

        &:hover {
          background-color: var(--color-primary-background-hover);
        }
        &:active {
          background-color: var(--color-primary-background-active);
        }
        &[disabled] {
          cursor: default;
          opacity: 0.4;
          &:hover {
            background: none !important;
          }
        }
      }
      .title-btn {
        flex: none;
        min-width: 40px;
        padding: 0 10px;
        opacity: 0.7;

        &[disabled] {
          opacity: 0.3;
        }
      }
    }
  }
</style>
