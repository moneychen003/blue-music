<script lang="ts">
  // import { appSetting } from '@/store/setting'
  import { link, location } from '@/plugins/routes'
  import { t } from '@/plugins/i18n'
  import { LIST_IDS } from '@any-listen/common/constants'

  const lastPlayedUrl = `/library?id=${LIST_IDS.LAST_PLAYED}`

  const buttons: Array<{
    to: string
    name: string
    icon: string
    iconSize: string
  }> = [
    {
      to: '/online',
      name: $t('online_resources'),
      icon: '#icon-extenstion',
      iconSize: '0 0 50 50',
    },
    {
      to: lastPlayedUrl,
      name: $t('list_name__last_play'),
      icon: '#icon-settings',
      iconSize: '0 0 512 512',
    },
  ]
</script>

<ul class="aside-footer-menu" role="menu">
  {#each buttons as item (item.to)}
    <li class="menu-item" role="presentation">
      <a
        class="menu-link"
        class:active={$location == item.to}
        role="tab"
        aria-selected={$location == item.to}
        href={item.to}
        aria-label={item.name}
        {@attach link()}
      >
        <div class="menu-icon">
          <svg viewBox={item.iconSize}>
            <use xlink:href={item.icon} />
          </svg>
        </div>
        <span class="menu-name">{item.name}</span>
      </a>
    </li>
  {/each}
</ul>

<style lang="less">
  .aside-footer-menu {
    display: flex;
    flex: none;
    flex-flow: column nowrap;
    padding: 0 12px;
  }
  .menu-item {
    position: relative;
  }
  .link {
    display: flex;
    padding: 10px 15px;
    color: var(--color-primary-font);
    text-decoration: none;
    cursor: pointer;
    // font-size: 12px;
    outline: none;
    border-radius: @radius-border;
    transition: @transition-fast;
    transition-property: background-color, opacity;
    .mixin-ellipsis-1();

    &.active {
      // border-left-color: @color-theme-active;
      background-color: var(--color-primary-light-300-alpha-700);
    }

    &:hover {
      // color: var(--color-primary-font);

      &:not(.active) {
        background-color: var(--color-primary-light-400-alpha-700);
        opacity: 0.8;
      }
    }
    &:active:not(.active) {
      background-color: var(--color-primary-light-300-alpha-600);
      opacity: 0.6;
    }
  }

  .menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 15px;
    // margin-bottom: 5px;
    margin-right: 5px;
    & > svg {
      height: 15px;
    }
  }
  .menu-name {
    font-size: 13px;
    line-height: 1.2;
  }
</style>
