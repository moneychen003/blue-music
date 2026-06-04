<script>
  import Container from './components/Container.svelte'
  import PlayInfo from './components/PlayInfo.svelte'
  import Pic from './components/Pic.svelte'
  import PlayBtns from './components/PlayBtns.svelte'
  import ControlBtns from './components/ControlBtns.svelte'
  import MiddlePlayProgress from './components/MiddlePlayProgress.svelte'
  // export let params = {}

  // console.log(params)
</script>

<Container padding>
  <Pic />
  <PlayInfo />
  <MiddlePlayProgress />
  <ControlBtns />
  <PlayBtns />
</Container>

<style lang="less">
</style>
