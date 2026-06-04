<script>
  import Container from './components/Container.svelte'
  import PlayInfo from './components/PlayInfo.svelte'
  import Pic from './components/Pic.svelte'
  import PlayBtns from './components/PlayBtns.svelte'
  import ControlBtns from './components/ControlBtns.svelte'
  import MiniPlayProgress from './components/MiniPlayProgress.svelte'
  // export let params = {}

  // console.log(params)
</script>

<Container padding>
  <Pic />
  <PlayInfo />
  <MiniPlayProgress />
  <ControlBtns />
  <PlayBtns />
</Container>
