import { settingEvent } from './store/event'
import { settingState } from './store/state'
// import { readable } from 'svelte/store'

// export const setting = readable(settingState.setting, (set) => {
//   return settingEvent.on('updated', () => {
//     set(settingState.setting)
//   })
// })

export const useSetting = () => {
  let val = $state.raw(settingState.setting)

  $effect(() => {
    const unsub = settingEvent.on('updated', () => {
      val = settingState.setting
    })
    return unsub
  })

  return {
    get val() {
      return val
    },
  }
}

export const useSettingValue = <T extends keyof AnyListen.AppSetting>(key: T | (() => T)) => {
  const getKey = () => (typeof key === 'function' ? key() : key)
  let val = $state.raw(settingState.setting[getKey()])

  $effect(() => {
    const currentKey = getKey()
    val = settingState.setting[currentKey]
    const unsub = settingEvent.on('updated', (keys) => {
      if (!keys.includes(currentKey)) return
      val = settingState.setting[currentKey]
    })
    return unsub
  })

  return {
    get val() {
      return val
    },
  }
}
