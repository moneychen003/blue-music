<script>
  import PlayInfo from './components/PlayInfo.svelte'
  import Pic from './components/Pic.svelte'
  import ControlBtns from './components/ControlBtns.svelte'
  import MiniPlayProgress from './components/MiniPlayProgress.svelte'
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
    <MiniPlayProgress />
    <ControlBtns />
  {/snippet}
</CenterControlLayout>

<style lang="less">
</style>
