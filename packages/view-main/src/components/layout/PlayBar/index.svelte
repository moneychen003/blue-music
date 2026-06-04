<script>
  import MiniBar from './MiniBar.svelte'
  import MiddleBar from './MiddleBar.svelte'
  import FullBar from './FullBar.svelte'
  import CenterBar from './CenterBar.svelte'
  import CenterMiddleBar from './CenterMiddleBar.svelte'
  import CenterFullBar from './CenterFullBar.svelte'
  import { useSettingValue } from '@/modules/setting/reactive.svelte'

  const playBarProgressStyle = useSettingValue('common.playBarProgressStyle')
</script>

{#if playBarProgressStyle.val == 'mini'}
  <MiniBar />
{:else if playBarProgressStyle.val == 'middle'}
  <MiddleBar />
{:else if playBarProgressStyle.val == 'full'}
  <FullBar />
{:else if playBarProgressStyle.val == 'centerControlMiddle'}
  <CenterMiddleBar />
{:else if playBarProgressStyle.val == 'centerControlFull'}
  <CenterFullBar />
{:else}
  <CenterBar />
{/if}
