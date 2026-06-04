<script lang="ts">
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { i18n } from '@/plugins/i18n'
  import { extT } from '@/modules/extension/i18n'
  import { verticalScrollbar } from '@/shared/compositions/verticalScrollbar.svelte'

  let { ext }: { ext: AnyListen.Extension.Extension | AnyListen.IPCExtension.RemoteOnlineDetail } = $props()

  let info = $derived.by(() => {
    const grants = ext.grant?.map((g) => ({ id: g, icon: `ext_grant_${g}`, label: i18n.t(`extension__grant_${g}`) })) ?? []
    const resources =
      ext.contributes?.resource?.map((r) => ({
        id: r.id,
        name: r.name,
        resource: r.resource.map((r) => i18n.t(`extension.resource_${r}`)).join(' / '),
      })) ?? []
    const listProviders = ext.contributes?.listProviders ?? []
    const commands = (ext.contributes?.commands ?? []).filter((c) => !c.hidden)
    const settings = ext.contributes?.settings ?? []
    return { grants, resources, listProviders, commands, settings }
  })
</script>

<div class="content" {@attach verticalScrollbar({ offset: '0.22rem' })}>
  {#if info.grants.length}
    <div class="section">
      <h4 class="section__title">{i18n.t('extension.grants')}</h4>
      <ul class="grant-list">
        {#each info.grants as grant (grant.id)}
          <li class="grant-item">
            <SvgIcon name={grant.icon} />
            <span>{grant.label}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if info.resources.length}
    <div class="section">
      <h4 class="section__title">{i18n.t('extension.resources')}</h4>
      <ul class="contributes-list">
        {#each info.resources as res (res.id)}
          <li class="contributes-item">
            <span class="contributes-name">{$extT(ext.id, res.name)}</span>
            <span class="contributes-badge">{res.resource}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if info.listProviders.length}
    <div class="section">
      <h4 class="section__title">{i18n.t('extension.list_providers')}</h4>
      <ul class="contributes-list">
        {#each info.listProviders as provider (provider.id)}
          <li class="contributes-item">
            <span class="contributes-name">{$extT(ext.id, provider.name)}</span>
            {#if provider.description}
              <span class="contributes-desc">{$extT(ext.id, provider.description)}</span>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if info.settings.length}
    <div class="section">
      <h4 class="section__title">{i18n.t('extension.settings')}</h4>
      <ul class="contributes-list">
        {#each info.settings as setting (setting.field)}
          <li class="contributes-item">
            <span class="contributes-name">{$extT(ext.id, setting.name)}</span>
            {#if setting.description}
              <span class="contributes-desc">{$extT(ext.id, setting.description)}</span>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if info.commands.length}
    <div class="section">
      <h4 class="section__title">{i18n.t('extension.commands')}</h4>
      <ul class="contributes-list">
        {#each info.commands as cmd (cmd.command)}
          <li class="contributes-item">
            <span class="contributes-name">{$extT(ext.id, cmd.name)}</span>
            <code class="contributes-code code">{cmd.command}</code>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style lang="less">
  .content {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    gap: 15px;
    // width: 80%;
    min-height: 0;
    padding-right: 12px;
  }

  .section {
    display: flex;
    flex-flow: column nowrap;
    gap: 6px;

    &__title {
      margin: 0;
      font-size: 0.8em;
      font-weight: 600;
      color: var(--color-font-label);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
  }

  .grant-list {
    display: flex;
    flex-flow: column nowrap;
    gap: 4px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .grant-item {
    display: flex;
    flex-flow: row nowrap;
    gap: 8px;
    align-items: center;
    font-size: 0.88em;
    color: var(--color-font);
  }

  .contributes-list {
    display: flex;
    flex-flow: column nowrap;
    gap: 6px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .contributes-item {
    display: flex;
    flex-flow: column nowrap;
    gap: 2px;
    padding: 6px 8px;
    background: var(--color-primary-light-200-alpha-900);
    border-radius: 6px;
  }

  .contributes-name {
    font-size: 0.88em;
    font-weight: 500;
    color: var(--color-font);
  }

  .contributes-desc {
    font-size: 0.8em;
    color: var(--color-font-label);
    overflow-wrap: anywhere;
  }

  .contributes-badge {
    font-size: 0.78em;
    color: var(--color-font-label);
  }

  .contributes-code {
    font-size: 0.78em;
    color: var(--color-font-label);
  }
</style>
