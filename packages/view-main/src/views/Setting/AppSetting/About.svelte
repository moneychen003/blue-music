<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import TitleContent from '../components/TitleContent.svelte'
  import { t } from '@/plugins/i18n'
  import { openUrl } from '@/shared/ipc/app'
</script>

<TitleContent>
  <p>
    {$t('settings__about_p1')}
  </p>
  <p>
    {$t('settings__about_p2')}
  </p>
  <p>
    {$t('settings__about_p3')}
  </p>
  <p>
    {$t('settings__about_p4')}
    <Btn
      link
      onclick={() => {
        void openUrl('https://github.com/moneychen003/blue-music')
      }}
    >
      https://github.com/moneychen003/blue-music
    </Btn>
  </p>
  <p class="thanks">
    {$t('settings__about_thanks')}
    <Btn
      link
      onclick={() => {
        void openUrl('https://github.com/any-listen/any-listen')
      }}
    >
      https://github.com/any-listen/any-listen
    </Btn>
  </p>
</TitleContent>

<style lang="less">
  .thanks {
    margin-top: 10px;
    font-size: 13px;
    color: var(--color-font-label);
  }
  p {
    margin-bottom: 6px;
    font-size: 14px;

    :global(button.link) {
      color: inherit;
      text-decoration: underline;
    }
  }
</style>
