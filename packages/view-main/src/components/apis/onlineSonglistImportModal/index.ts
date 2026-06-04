import { mount, tick, unmount } from 'svelte'

import { onDesconnected } from '@/modules/app/shared'

export const showOnlineSonglistImportModal = async (listInfo?: AnyListen.List.MyListInfo | null) => {
  const App = (await import('./App.svelte')).default
  const app = mount(App, {
    target: document.getElementById('root')!,
    props: {
      onafterleave() {
        void unmount(app, { outro: true })
      },
    },
  })
  const unsub = onDesconnected(() => {
    void unmount(app, { outro: true })
    unsub()
  })
  void tick()
    .then(() => {
      app.show(listInfo)
    })
    .finally(() => {
      unsub()
    })
}
