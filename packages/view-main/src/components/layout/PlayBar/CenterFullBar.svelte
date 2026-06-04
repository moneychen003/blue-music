<script>
  import PlayInfo from './components/PlayInfo.svelte'
  import Pic from './components/Pic.svelte'
  import ControlBtns from './components/ControlBtns.svelte'
  import PlayerProgressBar from '@/components/common/PlayerProgressBar.svelte'
  import CenterControlLayout from './components/CenterControlLayout.svelte'
  import Times from './components/Times.svelte'
  // export let params = {}

  // console.log(params)
</script>

<CenterControlLayout>
  {#snippet left()}
    <Pic />
    <PlayInfo />
  {/snippet}
  {#snippet right()}
    <Times />
    <ControlBtns />
  {/snippet}
  <div class="progress">
    <PlayerProgressBar />
  </div>
</CenterControlLayout>

<style lang="less">
  .progress {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    z-index: 1;
    box-sizing: border-box;
    padding-bottom: 6px;
    margin: 0 10px;
    // height: 15px;
    :global {
      .progress {
        height: 2px;
        background-color: transparent;
        border-radius: 0;
      }
      .progress-bar2 {
        background-color: var(--color-primary-light-100-alpha-800);
      }
      .progress-bar3 {
        background-color: var(--color-primary-light-100-alpha-600);
      }
    }
  }
</style>
