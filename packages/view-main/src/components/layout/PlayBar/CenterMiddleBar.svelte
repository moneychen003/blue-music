<script>
  import PlayInfo from './components/PlayInfo.svelte'
  import Pic from './components/Pic.svelte'
  import ControlBtns from './components/ControlBtns.svelte'
  import MiddlePlayProgress from './components/MiddlePlayProgress.svelte'
  import CenterControlLayout from './components/CenterControlLayout.svelte'
  // export let params = {}

  // console.log(params)
</script>

<CenterControlLayout>
  {#snippet left()}
    <Pic />
    <PlayInfo />
  {/snippet}
  {#snippet right()}
    <div class="progress">
      <MiddlePlayProgress />
    </div>
    <ControlBtns />
  {/snippet}
</CenterControlLayout>

<style lang="less">
  .progress {
    display: flex;
    flex: auto;
    padding-left: 10px;
    contain: layout;

    :global(> .middle-play-progress) {
      width: 100%;
    }
  }
</style>
