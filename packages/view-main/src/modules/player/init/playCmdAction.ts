import { onRelease } from '@/modules/app/shared'
import { appEvent } from '@/modules/app/store/event'
import { hotkeyState } from '@/modules/hotkey/store/state'
import { createUnsubscriptionSet } from '@/shared'

import { onPlayerCreated } from '../shared'
import { collectMusic, dislikeMusic, pause, play, skipNext, skipPrev, togglePlay, uncollectMusic } from '../store/actions'

// 空格键播放/暂停:聚焦输入框/可编辑区时不触发;若用户已在快捷键设置里自定义绑了 space,交给原系统避免重复
const handleSpaceToggle = (event: KeyboardEvent) => {
  if (event.key != ' ' && event.code != 'Space') return
  if (event.repeat) return
  const target = event.target as HTMLElement | null
  if (target) {
    const tag = target.tagName
    if (tag == 'INPUT' || tag == 'TEXTAREA' || tag == 'SELECT' || target.isContentEditable) return
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (hotkeyState.config?.local?.keys?.['space']) return
  event.preventDefault()
  togglePlay()
}

let unregistered = createUnsubscriptionSet()
export const initPlayCmdAction = () => {
  onRelease(unregistered.clear.bind(unregistered))
  onPlayerCreated(() => {
    unregistered.register((unregistered) => {
      document.addEventListener('keydown', handleSpaceToggle)
      unregistered.add(() => {
        document.removeEventListener('keydown', handleSpaceToggle)
      })
      unregistered.add(
        appEvent.on('executeCommand', (cmd, ...args) => {
          switch (cmd) {
            case 'play':
              play()
              break
            case 'pause':
              pause()
              break
            case 'playToggle':
              togglePlay()
              break
            case 'next':
              void skipNext()
              break
            case 'previous':
              void skipPrev()
              break
            case 'favorite':
              void collectMusic()
              break
            case 'unfavorite':
              uncollectMusic()
              break
            case 'dislike':
              void dislikeMusic()
              break
            default:
              break
          }
        })
      )
    })
  })
}
