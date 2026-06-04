import SingleEvent from '@any-listen/web/SimpleSingleEvent'

export const themeChangedEvent = new SingleEvent<[action: AnyListen.ThemeSetting]>()

export const themeListChangedEvent = new SingleEvent<[action: AnyListen.ThemeList]>()
