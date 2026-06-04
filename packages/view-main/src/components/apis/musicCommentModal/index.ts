import { mount, tick, unmount } from 'svelte'

import { onDesconnected } from '@/modules/app/shared'

export const showMusicCommentModal = async (
  musicInfo: AnyListen.Music.MusicInfo,
  onrefresh?: () => AnyListen.Music.MusicInfo | null
) => {
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
      app.show(musicInfo, onrefresh)
    })
    .finally(() => {
      unsub()
    })
}
