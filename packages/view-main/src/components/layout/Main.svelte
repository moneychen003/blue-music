<script>
  import Router from '@/plugins/svelte-spa-router/Router.svelte'
  import routes from '@/plugins/routes'
</script>

<div class="view" id="view">
  <Router {routes} />
</div>

<style lang="less">
  .view {
    position: relative;
    z-index: 1;
    flex: auto;
    > :global(.view-container) {
      position: absolute !important;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    // background: #fff;
    // overflow: hidden;
  }
</style>
