import { IPC_CODE } from '@any-listen/common/constants'
import { onMount } from 'svelte'

import { useSettingValue } from '@/modules/setting/reactive.svelte'
import { i18n, type Message } from '@/plugins/i18n'
import { getFontSizeWithScreen } from '@/shared'

import { extI18n, extI18nMessageChangedEvent } from '../extension/i18n'
import { resourceList } from '../extension/reactive.svelte'
import { extensionState } from '../extension/store/state'
import { settingEvent } from '../setting/store/event'
import { localCommands } from './store/action'
import { appEvent } from './store/event'
import { appState } from './store/state'

export const useAppAeady = () => {
  let appAeady = $state.raw(false)

  const unsubscribe = settingEvent.on('inited', () => {
    appAeady = true
  })
  const unsubscribe2 = appEvent.on('desconnected', () => {
    appAeady = false
  })

  $effect(() => {
    return () => {
      unsubscribe()
      unsubscribe2()
    }
  })

  return {
    get appAeady() {
      return appAeady
    },
  }
}

export const useShowLogin = () => {
  let showLogin = $state.raw(false)

  const unsubscribe = appEvent.on('connected', () => {
    showLogin = false
  })
  const unsubscribe2 = appEvent.on('release', () => {
    showLogin = true
  })
  const unsubscribe3 = appEvent.on('connectFailed', (message) => {
    switch (message) {
      case IPC_CODE.authFailed:
      case IPC_CODE.missingAuthCode:
        showLogin = true
        break
    }
  })

  $effect(() => {
    return () => {
      unsubscribe()
      unsubscribe2()
      unsubscribe3()
    }
  })

  return {
    get showLogin() {
      return showLogin
    },
  }
}

export const useIsFullscreen = () => {
  let isFullscreen = $state.raw(appState.isFullscreen)

  const unsubscribe = appEvent.on('fullscreen', (val) => {
    isFullscreen = val
  })

  $effect(() => {
    return () => {
      unsubscribe()
    }
  })

  return {
    get isFullscreen() {
      return isFullscreen
    },
  }
}

export const useListItemHeight = (height: number) => {
  const fontSize = useSettingValue('common.fontSize')
  let listItemHeight = $state.raw(Math.ceil((appState.isFullscreen ? getFontSizeWithScreen() : fontSize.val) * height))

  $effect(() => {
    return appEvent.on('fullscreen', (val) => {
      listItemHeight = Math.ceil((val ? getFontSizeWithScreen() : fontSize.val) * height)
    })
  })
  return {
    get val() {
      return listItemHeight
    },
  }
}

export const useCommands = () => {
  let list = $state.raw<AnyListen.Extension.Command[]>([])

  onMount(() => {
    const buildCommands = (resourceList: AnyListen.Extension.ResourceList): AnyListen.Extension.Command[] => {
      let cmds: AnyListen.Extension.Command[] = [
        ...localCommands.map((cmd) => {
          const tKey = `command.local.${cmd}.desc`
          const desc = i18n.t(tKey as keyof Message)

          return {
            extensionId: '',
            extensionName: '',
            fullCommand: cmd,
            command: cmd,
            name: i18n.t(`command.local.${cmd}`),
            description: desc === tKey ? undefined : desc,
          } satisfies AnyListen.Extension.Command
        }),
        ...resourceList.commands
          .filter((c) => !c.hidden)
          .map((cmd) => {
            return {
              ...cmd,
              command: `Extension: ${cmd.command}`,
              name: i18n.t('command.space.extension') + extI18n.t(cmd.extensionId, cmd.name),
              description: cmd.description ? extI18n.t(cmd.extensionId, cmd.description) : undefined,
              extensionName: extI18n.t(cmd.extensionId, cmd.extensionName),
            }
          }),
      ]
      return cmds
    }
    const unsub = resourceList.subscribe((res) => {
      list = buildCommands(res)
    })
    const unsub2 = extI18nMessageChangedEvent.on(() => {
      list = buildCommands(extensionState.resourceList)
    })

    return () => {
      unsub()
      unsub2()
    }
  })

  return {
    get val() {
      return list
    },
  }
}
