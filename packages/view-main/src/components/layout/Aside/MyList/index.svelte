<script>
  import Header from './Header.svelte'
  import List from './List.svelte'
  // console.log(params)
</script>

<div class="container">
  <Header />
  <List />
</div>

<style lang="less">
  .container {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    margin-top: 18px;
    overflow: hidden;
  }
</style>
