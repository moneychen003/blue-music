<script lang="ts">
  import Input from '@/components/base/Input.svelte'
  import Textarea from '@/components/base/Textarea.svelte'
  import TitleContent from './TitleContent.svelte'
  let {
    id,
    name,
    desc,
    value = $bindable(''),
    textarea,
    placeholder,
    onchange,
    password,
    autofocus,
  }: {
    id?: string
    name?: string
    placeholder?: string
    desc?: string
    value: string
    password?: boolean
    textarea?: boolean
    autofocus?: boolean
    onchange?: (value: string) => void
  } = $props()
  // let id = $derived(`${name}_${desc}_${f}`)
</script>

<TitleContent {name} {desc}>
  <div class="settings-item-input">
    {#if textarea}
      <Textarea {id} bind:value {onchange} min {placeholder} {autofocus} />
    {:else}
      <Input {id} bind:value {onchange} {placeholder} {autofocus} type={password ? 'password' : 'text'} />
    {/if}
  </div>
</TitleContent>

<style lang="less">
  .settings-item-input {
    // margin-left: 16px;

    :global {
      input {
        width: 100%;
        // margin-top: 5px;
        max-width: 500px;
      }
      textarea {
        width: 100%;
        min-width: 200px;
        max-width: 500px;
        min-height: 50px;
        margin-top: 5px;
      }
    }
  }
</style>
