<script lang="ts">
  // import { appSetting } from '@/store/setting'
  import { link, location, query } from '@/plugins/routes'
  import { t } from '@/plugins/i18n'
  import { LIST_IDS } from '@any-listen/common/constants'
  import { useExtensionError, useExtensionNewVersionNum } from '@/modules/extension/reactive.svelte'

  const newExtVerNum = useExtensionNewVersionNum()
  const extensionError = useExtensionError()

  let menus = $derived(
    [
      {
        to: '/curated',
        name: '精选',
        icon: '#icon-album',
        iconSize: '0 0 425.2 425.2',
        enable: true,
      },
      {
        to: '/topSongs',
        name: '排行榜',
        icon: '#icon-topSongs',
        iconSize: '0 0 425.2 425.2',
        enable: true,
      },
      {
        to: '/liked',
        name: '我喜欢的音乐',
        icon: '#icon-love',
        iconSize: '0 0 444.87 391.18',
        enable: true,
      },
      {
        to: '/recent',
        name: '最近播放',
        icon: '#icon-memories',
        iconSize: '0 0 24 24',
        enable: true,
      },
      {
        to: '/collected',
        name: '我的收藏',
        icon: '#icon-album',
        iconSize: '0 0 425.2 425.2',
        enable: true,
      },
      {
        to: '/media-library',
        name: '更多',
        icon: '#icon-album',
        iconSize: '0 0 425.2 425.2',
        enable: true,
      },
      {
        to: '/download',
        name: $t('download'),
        icon: '#icon-download-2',
        iconSize: '0 0 425.2 425.2',
        // 下载是桌面专属(web 在线听,不写本地文件)
        enable: !!import.meta.env.VITE_IS_DESKTOP,
      },
      {
        to: '/settings',
        name: $t('setting'),
        icon: '#icon-settings',
        iconSize: '0 0 24 24',
        enable: true,
      },
      {
        to: '/extenstion',
        name: $t('extenstion'),
        icon: '#icon-puzzle',
        iconSize: '0 0 24 24',
        enable: true,
        hidden: true,
      },
    ].filter((m) => m.enable)
  )

  let menuSections = $derived([
    {
      title: '',
      items: menus.filter((m) => ['/curated', '/topSongs'].includes(m.to)),
    },
    {
      title: '我的',
      items: menus.filter((m) => ['/liked', '/recent', '/collected', '/media-library'].includes(m.to)),
    },
    {
      title: '工具',
      items: menus.filter((m) => ['/download', '/settings'].includes(m.to)),
    },
  ])

  let activePath = $derived.by(() => {
    if ($location == '/library' && $query.id == LIST_IDS.LAST_PLAYED) {
      return '/recent'
    } else if ($location == '/topSongs' || ($location == '/online' && $query.t == 'topSongs')) {
      return '/topSongs'
    } else if ($location.startsWith('/online/')) {
      return '/online'
    } else if ($location == '/playlist-detail') {
      return '/liked'
    }
    return menus.some((m) => m.to == $location) ? $location : $location == '/' ? menus[0].to : ''
  })
  // let activePath = ''
</script>

{#snippet listItem(item: {
  to: string
  name: string
  icon: string
  iconSize: string
  enable: boolean
  badgeNum?: number
  waringBadge?: boolean
  onclick?: (e: MouseEvent) => void
})}
  <li class="nav-item" role="presentation">
    <a
      class="link"
      class:active={activePath == item.to}
      role="tab"
      data-ignore-tip
      aria-selected={activePath == item.to}
      href={item.to}
      onclick={item.onclick}
      aria-label={item.name}
      {@attach link({ disabled: !!item.onclick })}
    >
      <!-- <a class="link" class:active={activePath == item.to} role="tab" href={item.to} aria-label={item.name}> -->
      <div class="left">
        <div class="icon">
          <svg viewBox={item.iconSize}>
            <use xlink:href={item.icon} />
          </svg>
        </div>
        <span class="nav-name">{item.name}</span>
      </div>
      <div class="right">
        {#if item.waringBadge}
          <div class="icon" style="color: var(--color-font-error);">
            <svg viewBox={item.iconSize}>
              <use xlink:href="#icon-error" />
            </svg>
          </div>
        {/if}
        {#if item.badgeNum}
          <span class="badge" aria-hidden="true">{item.badgeNum}</span>
        {/if}
      </div>
    </a>
  </li>
{/snippet}
{#snippet extensonItem()}
  {@render listItem({
    to: '/extenstion',
    name: $t('extenstion'),
    icon: '#icon-puzzle',
    iconSize: '0 0 24 24',
    enable: true,
    waringBadge: extensionError.val,
    badgeNum: newExtVerNum.val > 0 ? newExtVerNum.val : undefined,
  })}
{/snippet}

<div class="aside-nav" role="menu">
  {#each menuSections as section (section.title)}
    {#if section.items.length}
      <section class="nav-section" aria-label={section.title}>
        {#if section.title}
          <h2>{section.title}</h2>
        {/if}
        <ul>
          {#each section.items as item (item.to)}
            {#if !item.hidden}
              {@render listItem(item)}
            {/if}
          {/each}
        </ul>
      </section>
    {/if}
  {/each}
  <section class="nav-section" aria-label="插件">
    <h2>插件</h2>
    <ul>
      {@render extensonItem()}
    </ul>
  </section>
</div>

<style lang="less">
  .aside-nav {
    display: flex;
    flex: none;
    flex-flow: column nowrap;
    gap: 18px;
    padding: 8px 12px 0;
  }
  .nav-section {
    display: flex;
    flex-flow: column nowrap;
    gap: 4px;

    h2 {
      padding: 0 10px;
      margin: 0 0 2px;
      font-size: 12px;
      font-weight: 500;
      line-height: 18px;
      color: var(--color-font-label);
    }

    ul {
      display: flex;
      flex-flow: column nowrap;
      gap: 2px;
      padding: 0;
      margin: 0;
    }
  }
  .nav-item {
    position: relative;
  }
  .link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 36px;
    padding: 0 10px;
    color: var(--color-primary-font);
    text-decoration: none;
    cursor: pointer;
    // font-size: 12px;
    outline: none;
    border-radius: 6px;
    transition: @transition-fast;
    transition-property: background-color, opacity;
    .mixin-ellipsis-1();

    &.active {
      cursor: default;
      // border-left-color: @color-theme-active;
      color: var(--color-button-font-selected);
      font-weight: 600;
      background-color: var(--color-primary-background-selected);

      &::before {
        position: absolute;
        top: 9px;
        bottom: 9px;
        left: 0;
        width: 3px;
        content: '';
        background-color: var(--color-primary);
        border-radius: 999px;
      }
    }

    &:hover {
      // color: var(--color-primary-font);

      &:not(.active) {
        background-color: var(--color-primary-background-hover);
      }
    }
    &:active:not(.active) {
      background-color: var(--color-primary-light-300-alpha-600);
      opacity: 0.6;
    }
  }

  .left {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .right {
    display: flex;
    flex: none;
    gap: 3px;
    align-items: center;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    font-size: 10px;
    color: var(--color-primary-font);
    background-color: var(--color-primary-background);
    border-radius: 8px;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    color: inherit;
    // margin-bottom: 5px;
    // margin-right: 6px;
    & > svg {
      height: 20px;
    }
  }
  .nav-name {
    font-size: 14px;
    line-height: 1.2;
  }
</style>
