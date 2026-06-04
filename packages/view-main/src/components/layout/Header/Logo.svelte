<script lang="ts">
  import { onDomSizeChanged } from '@any-listen/web'
  import { onMount } from 'svelte'
  let contentDom = $state<HTMLElement>()
  let size = $state('52%')

  onMount(() => {
    let preWidth = 0
    return onDomSizeChanged(contentDom!, (width, height) => {
      if (height % 2 !== 0) {
        height += 1
      }
      if (preWidth == height) return
      preWidth = height
      requestAnimationFrame(() => {
        size = `${Math.trunc(height * 0.52)}px`
      })
      console.log('maclogo')
    })
  })
</script>

<div class="logo" bind:this={contentDom}>
  <svg class="header-logo" aria-hidden="true" viewBox="0 0 132.14 92.1" width={size}>
    <use xlink:href="#icon-header-logo" />
  </svg>
</div>

<style lang="less">
  .logo {
    display: flex;
    flex: none;
    align-items: center;
    height: 100%;
    padding: 0 20px;
    font-weight: bold;
    color: var(--color-nav-font);
    opacity: 0.8;
  }
</style>
