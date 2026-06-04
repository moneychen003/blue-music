<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    children,
    padding,
  }: {
    children: Snippet
    padding?: boolean
  } = $props()
</script>

<div class="player">
  <div class="bg"></div>
  <div class="player-inner" class:padding>
    {@render children()}
  </div>
</div>

<style lang="less">
  .player {
    position: relative;
    // padding: 6px;
    z-index: 2;
    height: @height-player;
    background-color: var(--color-main-background);
    border-top: 1px solid var(--color-border);
    // border-top: 3px solid var(--color-border);
    // display: flex;
    // flex-flow: row nowrap;
    // align-items: center;
    contain: size layout style;
    // box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
    // border-top-left-radius: 8px;
    // border-top-right-radius: 8px;
    // backdrop-filter: blur(4px);
    // * {
    //   box-sizing: border-box;
    // }

    // &:before {
    //   .mixin-after();
    //   left: 0;
    //   top: 0;
    //   width: 100%;
    //   height: 100%;
    //   box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
    //   border-top-left-radius: 8px;
    //   border-top-right-radius: 8px;
    //   // background-color: var(--color-main-background);
    //   // opacity: 0.9;
    //   z-index: -1;
    //   backdrop-filter: blur(4px);
    //   transition: @transition-normal;
    //   transition-property: opacity;
    // }
  }
  .bg {
    width: 100%;
    height: 100%;
    background-color: color-mix(in srgb, var(--color-main-background) 94%, white 6%);
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    box-shadow: none;
    opacity: 1;
    // border-top: 1px solid var(--color-primary-light-300-alpha-800);
    // z-index: -1;
    backdrop-filter: none;
    transition: @transition-normal;
    transition-property: opacity;
  }
  .player-inner {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    width: 100%;
    height: 100%;
    contain: strict;
    transition: @transition-normal;
    transition-property: opacity;
    &.padding {
      padding-right: 10px;
    }
  }
</style>
