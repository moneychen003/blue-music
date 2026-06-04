<script>
  import Btn from '@/components/base/Btn.svelte'
  import Input from '@/components/base/Input.svelte'
  import { connectIPC } from '@/modules'
  import { appEvent } from '@/modules/app/store/event'
  import { t, i18n } from '@/plugins/i18n'
  import { IPC_CODE } from '@any-listen/common/constants'
  import { onMount } from 'svelte'

  let value = $state('')
  let errorMessage = $state('')

  const handleSubmit = () => {
    errorMessage = ''
    connectIPC(value)
  }
  onMount(() => {
    return appEvent.on('connectFailed', (message) => {
      switch (message) {
        case IPC_CODE.abnormalDisconnection:
          errorMessage = i18n.t('login.abnormal_disconnection')
          break
        case IPC_CODE.authFailed:
          errorMessage = i18n.t('login.auth_failed')
          break
        case IPC_CODE.msgBlockedIp:
          errorMessage = i18n.t('login.blocked_ip')
          break
        default:
          errorMessage = message
          break
      }
    })
  })
</script>

<div class="view-container container">
  <div class="login-content">
    <h2 class="login-title">Any Listen</h2>
    <form
      class="login-form"
      onsubmit={(event) => {
        event.preventDefault()
        handleSubmit()
      }}
    >
      <Input type="password" placeholder={$t('login_label')} bind:value />
      <Btn rawtype="submit">{$t('submit')}</Btn>
    </form>
    <p class="login-tip-message">{errorMessage}</p>
  </div>
</div>

<style lang="less">
  .container {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: #fff;
  }
  .login-content {
    display: flex;
    flex-direction: column;
    max-width: 350px;
    // align-items: center;
    // justify-content: center;
  }
  .login-title {
    font-size: 20px;
    color: var(--color-primary-dark-300-alpha-200);
    text-align: center;
  }
  .login-form {
    display: flex;
    flex-direction: row;
    width: 100%;
    margin-top: 26px;
    // align-items: center;
    // justify-content: center;

    :global {
      .btn {
        flex: none;
        height: 30px;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
      .input {
        flex: auto;
        height: 30px;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }
    }
  }
  .login-tip-message {
    margin-top: 10px;
    font-size: 14px;
    color: var(--color-font-label);
  }
</style>
