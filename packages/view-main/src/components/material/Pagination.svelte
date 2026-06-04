<script lang="ts">
  import { t } from '@/plugins/i18n'
  let {
    count = 0,
    limit = 10,
    page = 1,
    btnlength = 7,
    onclick,
  }: {
    count?: number
    limit?: number
    page?: number
    btnlength?: number
    onclick: (page: number) => void
  } = $props()

  const maxPage = $derived(Math.ceil(count / limit) || 1)
  const pageEvg = $derived(Math.floor(btnlength / 2))
  const pages = $derived.by(() => {
    if (maxPage <= btnlength) return Array.from({ length: maxPage }, (_, i) => i + 1)
    let start = page - pageEvg > 1 ? (maxPage - page < pageEvg + 1 ? maxPage - (btnlength - 1) : page - pageEvg) : 1
    return Array.from({ length: btnlength }, (_, i) => start + i)
  })
</script>

{#if maxPage > 1}
  <div class="pagination">
    <ul>
      {#if page == 1}
        <li class="disabled">
          <span>
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 451.846 451.847">
              <use xlink:href="#icon-left" />
            </svg>
          </span>
        </li>
      {:else}
        <li>
          <button
            type="button"
            aria-label={$t('pagination__prev')}
            onclick={() => {
              onclick(page - 1)
            }}
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 451.846 451.847">
              <use xlink:href="#icon-left" />
            </svg>
          </button>
        </li>
      {/if}
      {#if maxPage > btnlength && page > pageEvg + 1}
        <li class="first">
          <button
            type="button"
            aria-label={$t('pagination__page', { num: 1 })}
            onclick={() => {
              onclick(1)
            }}
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 451.846 451.847">
              <use xlink:href="#icon-first" />
            </svg>
          </button>
        </li>
      {/if}
      {#each pages as p (p)}
        <li class:active={p == page}>
          {#if page == p}
            <span>{page}</span>
          {:else}
            <button
              type="button"
              aria-label={$t('pagination__page', { num: p })}
              onclick={() => {
                onclick(p)
              }}
            >
              {p}
            </button>
          {/if}
        </li>
      {/each}
      {#if maxPage > btnlength && maxPage - page > pageEvg}
        <li class="last">
          <button
            type="button"
            aria-label={$t('pagination__page', { num: maxPage })}
            onclick={() => {
              onclick(maxPage)
            }}
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 451.846 451.847">
              <use xlink:href="#icon-last" />
            </svg>
          </button>
        </li>
      {/if}
      {#if page == maxPage}
        <li class="disabled">
          <span>
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 451.846 451.847">
              <use xlink:href="#icon-right" />
            </svg>
          </span>
        </li>
      {:else}
        <li>
          <button
            type="button"
            aria-label={$t('pagination__next')}
            onclick={() => {
              onclick(page + 1)
            }}
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 451.846 451.847">
              <use xlink:href="#icon-right" />
            </svg>
          </button>
        </li>
      {/if}
    </ul>
  </div>
{/if}

<style lang="less">
  .pagination {
    display: inline-block;
    background-color: var(--color-button-background);
    // border-top-left-radius: 8px;
    border-radius: @radius-border;
    ul {
      display: flex;
      flex-flow: row nowrap;
      // border: .0625rem solid @theme_color2;
      // border-radius: .3125rem;
      li {
        display: flex;
        line-height: 1.2;
        // margin-right: @padding;
        // color: var(--color-button-font);
        // border: .0625rem solid @theme_line;
        // border-radius: .3125rem;
        transition: 0.4s ease;
        transition-property: all;
        // border-right: none;
        svg {
          height: 1em;
        }
        span,
        button {
          display: block;
          padding: 7px 12px;
          font-size: 13px;
          line-height: 1.2;
          color: var(--color-button-font);
        }
        &.active {
          span {
            background-color: var(--color-button-background-selected);
          }
        }
        button {
          cursor: pointer;
          background-color: transparent;
          border: none;
          // outline: none;
          transition: background-color 0.3s ease;
          &:hover {
            background-color: var(--color-button-background-hover);
          }
          &:active {
            background-color: var(--color-button-background-active);
          }
        }
        &.disabled {
          span {
            opacity: 0.3;
          }
        }
        &:first-child {
          span {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          span,
          button {
            border-top-left-radius: @radius-border;
            border-bottom-left-radius: @radius-border;
          }
          // border-right: .0625rem solid @theme_line;
        }
        &:last-child {
          span {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          span,
          button {
            border-top-right-radius: @radius-border;
            border-bottom-right-radius: @radius-border;
          }
          // border-right: .0625rem solid @theme_line;
        }
        &:first-child,
        &:last-child,
        &.first,
        &.last {
          button {
            line-height: 0;
          }
        }
        &:first-child,
        &:last-child {
          button {
            line-height: 0;
          }
        }
      }
    }
  }
</style>
