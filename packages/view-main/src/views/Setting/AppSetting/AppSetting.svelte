<script lang="ts">
  import { query, replace } from '@/plugins/routes'
  import SettingList from './SettingList.svelte'
  import SettingView from './SettingView.svelte'
  import { settings } from './settings'

  const activeSetting = $derived(Object.values(settings).find((e) => e.id == $query.id) ?? settings[0])
</script>

<div class="settings-app-container">
  {#if settings.length}
    <SettingList
      active={activeSetting.id}
      onchange={(id: string) => {
        void replace('/settings', { type: 'app', id })
      }}
    />
  {/if}
  {#if activeSetting}
    <SettingView settings={activeSetting} />
  {/if}
</div>

<style lang="less">
  .settings-app-container {
    display: flex;
    flex-flow: row nowrap;
    height: 100%;
    min-height: 0;
    padding-top: 10px;
  }
</style>
