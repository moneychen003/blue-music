import type { HOTKEY_Type } from '@any-listen/common/hotKey'

export const hotKeyState: {
  /** 临时禁用，用于在编辑快捷键时临时禁用所有快捷键 */
  tempDisable: boolean
  config: AnyListen.HotKey.HotKeyConfigAll<HOTKEY_Type>
  state: AnyListen.HotKey.HotKeyState<HOTKEY_Type>
} = {
  tempDisable: false,
  config: {
    local: {
      enable: false,
      keys: {},
    },
    global: {
      enable: false,
      keys: {},
    },
  },
  state: new Map(),
}
