<script lang="ts">
  import TogglePlayModeBtn from '@/components/common/TogglePlayModeBtn.svelte'
  import VolumeBtn from '@/components/common/VolumeBtn.svelte'
  import PlaylistBtn from '@/components/common/PlaylistBtn/index.svelte'
  import AddCurrentMusicBtn from '@/components/common/AddCurrentMusicBtn.svelte'
  import QualityBtn from '@/components/common/QualityBtn.svelte'
</script>

<div class="container">
  <PlaylistBtn />
  <QualityBtn />
  <AddCurrentMusicBtn />
  <VolumeBtn />
  <TogglePlayModeBtn />
</div>

<style lang="less">
  .container {
    display: flex;
    flex: none;
    flex-flow: row nowrap;
    gap: 15px;
  }
</style>
