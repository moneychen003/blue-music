<script>
  import Nav from './Nav.svelte'
  import MyList from './MyList/index.svelte'
</script>

<div class="aside">
  {#if import.meta.env.VITE_IS_MAC}
    <div class="drag-no-any-modal" style="padding-top: calc(env(titlebar-area-height, 30px) + 4px)"></div>
  {:else}
    <div style="height: 12px"></div>
  {/if}
  <Nav />
  <MyList />
</div>

<style lang="less">
  .aside {
    // background-color: var(--color-primary-light-900-alpha-900);
    display: flex;
    flex: none;
    flex-flow: column nowrap;
    width: 224px;
    max-width: 224px;
    // box-shadow: 0 0 5px rgba(0, 0, 0, .3);
    // transition: @transition-normal;
    // transition-property: background-color;
    // background-color: @color-theme-sidebar;
    // background-color: @color-aside-background;
    // border-right: 2px solid var(--color-primary);
    // -webkit-user-select: none;
    background-color: var(--color-app-background);
    border-right: 1px solid var(--color-border);

    // &.fullscreen {
    //   .logo {
    //     display: none;
    //   }
    // }
    // TODO: 兼容MAC
    // :global(.aside-logo + .aside-nav) {
    //   padding-top: 20px;
    // }
  }

  // :global(html.mac .aside-nav) {
  //   padding-top: env(titlebar-area-height, 30px);
  // }
</style>
