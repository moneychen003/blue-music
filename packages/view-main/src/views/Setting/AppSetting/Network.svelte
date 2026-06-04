<script lang="ts">
  import { updateSetting } from '@/modules/setting/store/action'
  import { t } from '@/plugins/i18n'
  import TitleContent from '../components/TitleContent.svelte'
  import Input from '@/components/base/Input.svelte'
  import Checkbox from '@/components/base/Checkbox.svelte'
  import { settingState } from '@/modules/setting/store/state'
  import { debounce } from '@/shared'
  import { onMount } from 'svelte'
  import { settingEvent } from '@/modules/setting/store/event'

  let enable = $state(settingState.setting['network.proxy.enable'])
  let followSystem = $state(settingState.setting['network.proxy.followSystem'])
  let host = $state(settingState.setting['network.proxy.host'])
  let port = $state(settingState.setting['network.proxy.port'])
  const handleSaveEnabled = debounce((enable: boolean) => {
    void updateSetting({
      'network.proxy.enable': enable,
      'network.proxy.followSystem': enable ? false : followSystem,
    })
  })
  const handleSaveFollowSystem = debounce((followSystem: boolean) => {
    void updateSetting({
      'network.proxy.followSystem': followSystem,
      'network.proxy.enable': followSystem ? false : enable,
    })
  })

  onMount(() => {
    return settingEvent.on('updated', (keys, settings) => {
      if (keys.includes('network.proxy.enable')) {
        enable = settings['network.proxy.enable']!
      }
      if (keys.includes('network.proxy.followSystem')) {
        followSystem = settings['network.proxy.followSystem']!
      }
      if (keys.includes('network.proxy.host')) {
        host = settings['network.proxy.host']!
      }
      if (keys.includes('network.proxy.port')) {
        port = settings['network.proxy.port']!
      }
    })
  })
</script>

<TitleContent name={$t('settings.network.proxy')} desc={$t('settings.network.proxy_desc')}>
  <div class="settings-item-content">
    <div class="gap-top">
      <Checkbox
        id="settings.network.proxy_enable"
        label={$t('settings.network.proxy_enable')}
        checked={enable}
        disabled={!import.meta.env.VITE_IS_DESKTOP}
        onchange={(val) => {
          enable = val
          if (val) followSystem = false
          handleSaveEnabled(val)
        }}
      />
    </div>
    <div class="gap-top">
      <Checkbox
        id="settings.network.proxy_follow_system"
        label={$t('settings.network.proxy_follow_system')}
        checked={followSystem}
        disabled={!import.meta.env.VITE_IS_DESKTOP}
        onchange={(val) => {
          followSystem = val
          if (val) enable = false
          handleSaveFollowSystem(val)
        }}
      />
    </div>
    <div class="gap-top">
      <Input
        id="settings.network.proxy_host"
        placeholder={$t('settings.network.proxy_host_placeholder')}
        value={host}
        disabled={!import.meta.env.VITE_IS_DESKTOP || followSystem}
        onchange={(val) => {
          host = val
        }}
        onblur={() => {
          void updateSetting({
            'network.proxy.host': host.trim(),
          })
        }}
      />
    </div>
    <div class="gap-top">
      <Input
        id="settings.network.proxy_port"
        placeholder={$t('settings.network.proxy_port_placeholder')}
        value={port}
        disabled={!import.meta.env.VITE_IS_DESKTOP || followSystem}
        onchange={(val) => {
          port = val
        }}
        onblur={() => {
          void updateSetting({
            'network.proxy.port': port.trim(),
          })
        }}
      />
    </div>
    {#if import.meta.env.VITE_IS_WEB}
      <div class="gap-top">
        <p class="small">{$t('settings.extension.gh_mirror_hosts_web_tip')}</p>
      </div>
    {/if}
  </div>
</TitleContent>
