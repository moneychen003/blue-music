<script lang="ts">
  import ControlBtns from './ControlBtns.svelte'
  import SearchInput from './SearchInput.svelte'
  import { windowDarg } from '@/shared/browser/widnow.svelte'
</script>

{#if import.meta.env.VITE_IS_DESKTOP}
  <div class="toolbar drag-no-any-modal">
    <div class="left">
      <SearchInput />
    </div>
    {#if !import.meta.env.VITE_IS_MAC}
      <ControlBtns />
    {/if}
  </div>
{/if}
{#if import.meta.env.VITE_IS_WEB}
  <div class="toolbar" {@attach windowDarg}>
    <div class="left">
      <SearchInput />
    </div>
    <ControlBtns />
  </div>
{/if}

<style lang="less" module>
  .toolbar {
    position: relative;
    z-index: 2;
    display: flex;
    flex: none;
    flex-flow: row nowrap;
    align-items: center;
    height: @height-toolbar;
    background-color: var(--color-main-background);
    border-bottom: 1px solid var(--color-border);
    // justify-content: space-between;
    // background-color: var(--background-color);
    // border-bottom: 1px solid var(--color-border);

    // &:before {
    //   .mixin-after();
    //   left: 0;
    //   top: 0;
    //   width: 100%;
    //   height: 100%;
    //   background-color: var(--color-main-background);
    //   opacity: .9;
    //   z-index: -1;
    // }
  }
  .left {
    display: flex;
    flex: auto;
    flex-flow: row nowrap;
    // gap: 25px;
    align-items: center;
    height: 100%;
    margin-left: 24px;
    :global {
      .search-input {
        --width: 36%;
        --max-width: 360px;
        --min-width: 260px;
        // background-color: transparent;
        // border-bottom: 2px solid var(--color-primary-background);
        &::placeholder {
          font-size: 0.98em;
          color: var(--color-button-font);
        }
      }
    }
  }
  .right {
    display: flex;
    flex: none;
    gap: 10px;
    align-items: center;
    height: 100%;
    padding-right: 14px;

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      color: var(--color-font-label);
      cursor: pointer;
      background: transparent;
      border: 0;
      border-radius: 6px;
      transition: background-color 0.18s ease, color 0.18s ease;

      &:hover {
        color: var(--color-font);
        background: var(--color-primary-background-hover);
      }
    }
  }
  .profile {
    display: flex;
    gap: 6px;
    align-items: center;
    max-width: 190px;
    color: var(--color-font);
  }
  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    font-size: 13px;
    font-weight: 800;
    color: rgb(255 255 255);
    background: linear-gradient(135deg, #f4c35b, #e85d5d);
    border-radius: 50%;
  }
  .name {
    max-width: 110px;
    font-size: 14px;
    font-weight: 700;
    .mixin-ellipsis-1();
  }
  .vip {
    padding: 1px 5px;
    font-size: 10px;
    color: #ffd4ac;
    background: rgb(118 77 56 / 45%);
    border: 1px solid rgb(255 194 142 / 28%);
    border-radius: 999px;
  }

  // .logo {
  //   box-sizing: border-box;
  //   padding: 0 @height-toolbar * .4;
  //   height: @height-toolbar;
  //   color: var(--color-primary);
  //   flex: none;
  //   text-align: center;
  //   line-height: @height-toolbar;
  //   font-weight: bold;
  // }
  // .search {
  //   margin-left: 20px;
  //   :global(.searchInput) {
  //     background-color: transparent;
  //     border-bottom: 2px solid var(--color-primary-background);
  //     &::placeholder {
  //       color: var(--color-button-font);
  //       font-size: .98em;
  //     }
  //   }
  // }
</style>
