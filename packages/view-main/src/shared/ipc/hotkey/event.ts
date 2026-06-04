import type { HOTKEY_Type } from '@any-listen/common/hotKey'
import SingleEvent from '@any-listen/web/SimpleSingleEvent'

export const hotKeyDownEvent = new SingleEvent<[info: AnyListen.HotKey.HotKeyDownInfo]>()

export const hotKeyConfigUpdatedEvent = new SingleEvent<[config: AnyListen.HotKey.HotKeyConfigAll<HOTKEY_Type>]>()
