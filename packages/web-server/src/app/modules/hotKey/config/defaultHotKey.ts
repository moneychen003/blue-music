import type { HOTKEY_Type } from '@any-listen/common/hotKey'

const local: AnyListen.HotKey.HotKeyConfig<HOTKEY_Type> = {
  enable: true,
  keys: {
    'mod+f5': 'player_toggle_play',
    'mod+arrowleft': 'player_prev',
    'mod+arrowright': 'player_next',
    f1: 'view_main_focus_search_input',
  },
}

const global: AnyListen.HotKey.HotKeyConfig<HOTKEY_Type> = {
  enable: false,
  keys: {},
}

export default {
  local,
  global,
}
