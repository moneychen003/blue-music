import { mount, tick, unmount } from 'svelte'

import { onDesconnected } from '@/modules/app/shared'

export const showMusicAddModal = async (isMove: boolean, listId: string, musicInfos: AnyListen.Music.MusicInfo[]) => {
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
      app.show(isMove, listId, musicInfos)
    })
    .finally(() => {
      unsub()
    })
}
