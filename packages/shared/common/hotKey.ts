import { APP_EVENT_NAMES } from './constants'

const viewMain = [
  `${APP_EVENT_NAMES.viewMainName}_min`,
  `${APP_EVENT_NAMES.viewMainName}_toggle_min`,
  `${APP_EVENT_NAMES.viewMainName}_toggle_hide`,
  `${APP_EVENT_NAMES.viewMainName}_toggle_close`,
  `${APP_EVENT_NAMES.viewMainName}_focus_search_input`,
] as const

const player = [
  `${APP_EVENT_NAMES.playerName}_toggle_play`,
  `${APP_EVENT_NAMES.playerName}_next`,
  `${APP_EVENT_NAMES.playerName}_prev`,
  `${APP_EVENT_NAMES.playerName}_volume_up`,
  `${APP_EVENT_NAMES.playerName}_volume_down`,
  `${APP_EVENT_NAMES.playerName}_volume_mute`,
  `${APP_EVENT_NAMES.playerName}_music_love`,
  `${APP_EVENT_NAMES.playerName}_music_unlove`,
  `${APP_EVENT_NAMES.playerName}_music_dislike`,
] as const

const winDesktopLyric = [
  `${APP_EVENT_NAMES.winLyricName}_toggle_visible`,
  `${APP_EVENT_NAMES.winLyricName}_toggle_lock`,
  `${APP_EVENT_NAMES.winLyricName}_toggle_always_top`,
] as const

export const HOTKEY_VIEW_MAIN = viewMain
export const HOTKEY_PLAYER = player
export const HOTKEY_WIN_DESKTOP_LYRIC = winDesktopLyric

export type HOTKEY_VIEW_MAIN_Type = (typeof HOTKEY_VIEW_MAIN)[number]
export type HOTKEY_PLAYER_Type = (typeof HOTKEY_PLAYER)[number]
export type HOTKEY_WIN_DESKTOP_LYRIC_Type = (typeof HOTKEY_WIN_DESKTOP_LYRIC)[number]

export type HOTKEY_Type = HOTKEY_VIEW_MAIN_Type | HOTKEY_PLAYER_Type | HOTKEY_WIN_DESKTOP_LYRIC_Type
