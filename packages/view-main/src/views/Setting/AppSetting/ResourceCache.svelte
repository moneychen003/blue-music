<script lang="ts">
  import { t } from '@/plugins/i18n'
  import TitleContent from '../components/TitleContent.svelte'
  import Btn from '@/components/base/Btn.svelte'
  import { onMount } from 'svelte'
  import { clearCache, getCachePath, getCacheSize, openDirInExplorer } from '@/shared/ipc/app'
  import { sizeFormate } from '@/shared'
  import { showNotify } from '@/components/apis/notify'

  let resourceCacheSize = $state('0 B')
  let cachePath = $state('')

  onMount(() => {
    let mounted = true
    void getCacheSize().then((size) => {
      if (!mounted) return
      resourceCacheSize = sizeFormate(size)
    })
    void getCachePath().then((path) => {
      if (!mounted) return
      cachePath = path
    })

    return () => {
      mounted = false
    }
  })
</script>

<TitleContent name={$t('settings.other.resource_cache')}>
  <div class="settings-item-content">
    <div class="gap-top">
      <p class="p">{$t('settings.other.resource_cache_label')}{resourceCacheSize}</p>
      {#if cachePath}
        <p class="p path-line">
          <span>{$t('settings.other.resource_cache_path')}</span>
          <code>{cachePath}</code>
        </p>
      {/if}
      <p class="p">
        {#if import.meta.env.VITE_IS_DESKTOP && cachePath}
          <Btn
            min
            onclick={() => {
              void openDirInExplorer(cachePath)
            }}
          >
            {$t('settings.other.open_cache_dir')}
          </Btn>
        {/if}
        <Btn
          min
          disabled={resourceCacheSize === '0 B'}
          onclick={async () => {
            await clearCache().catch((err: Error) => {
              console.error('Clear cache error:', err)
              showNotify($t('settings.other.clear_cache_failed', { msg: err.message }))
              throw err
            })
            resourceCacheSize = '0 B'
            showNotify($t('settings.other.clear_cache_success'))
          }}
        >
          {$t('settings.other.clear_cache')}
        </Btn>
      </p>
    </div>
  </div>
</TitleContent>

<style lang="less">
  .path-line {
    display: flex;
    gap: 8px;
    align-items: baseline;
    min-width: 0;

    code {
      max-width: 100%;
      overflow: hidden;
      font-family: monospace;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
</style>
