<script lang="ts">
  import { settingState } from '@/modules/setting/store/state'
  import CoverCD from './CoverCD.svelte'
  import CoverSquare from './CoverSquare.svelte'
</script>

{#if settingState.setting['playDetail.coverStyle'] === 'square'}
  <CoverSquare />
{:else}
  <CoverCD />
{/if}
