import type { HOTKEY_Type } from '@any-listen/common/hotKey'

export interface InitState {
  config: AnyListen.HotKey.HotKeyConfigAll<HOTKEY_Type>
  isEditingHotKey: boolean
}

// const empty = {}
export const hotkeyState: InitState = {
  isEditingHotKey: false,
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
}
