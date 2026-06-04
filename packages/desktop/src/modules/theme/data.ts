import { STORE_NAMES } from '@any-listen/common/constants'
import themes from '@any-listen/theme/index.json'

import { appState } from '@/app'
import getStore from '@/shared/store'
import { encodePath, isUrl, joinPath } from '@/shared/utils'

let userThemes: AnyListen.Theme[]
export const getAllThemes = () => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  userThemes ??= getStore(STORE_NAMES.THEME).get<AnyListen.Theme[]>('themes') ?? []
  return {
    themes,
    userThemes,
    dataPath: joinPath(appState.dataPath, 'theme_images'),
  }
}

export const saveTheme = (theme: AnyListen.Theme) => {
  const targetTheme = userThemes.find((t) => t.id === theme.id)
  if (targetTheme) Object.assign(targetTheme, theme)
  else userThemes.push(theme)
  getStore(STORE_NAMES.THEME).set('themes', userThemes)
}

export const removeTheme = (id: string) => {
  const index = userThemes.findIndex((t) => t.id === id)
  if (index < 0) return
  userThemes.splice(index, 1)
  getStore(STORE_NAMES.THEME).set('themes', userThemes)
}

const copyTheme = (theme: AnyListen.Theme): AnyListen.Theme => {
  return {
    ...theme,
    config: {
      ...theme.config,
      extInfo: { ...theme.config.extInfo },
      themeColors: { ...theme.config.themeColors },
    },
  }
}

const neteaseDayChromeColors: Record<string, string> = {
  '--color-primary': 'rgb(45, 130, 235)',
  '--color-primary-dark-100': 'rgb(36, 112, 212)',
  '--color-primary-dark-100-alpha-100': 'rgb(36 112 212 / 90%)',
  '--color-primary-alpha-100': 'rgb(45 130 235 / 90%)',
  '--color-primary-dark-100-alpha-200': 'rgb(36 112 212 / 80%)',
  '--color-primary-alpha-200': 'rgb(45 130 235 / 80%)',
  '--color-primary-dark-100-alpha-300': 'rgb(36 112 212 / 70%)',
  '--color-primary-alpha-300': 'rgb(45 130 235 / 70%)',
  '--color-primary-dark-100-alpha-400': 'rgb(36 112 212 / 60%)',
  '--color-primary-alpha-400': 'rgb(45 130 235 / 60%)',
  '--color-primary-dark-100-alpha-500': 'rgb(36 112 212 / 50%)',
  '--color-primary-alpha-500': 'rgb(45 130 235 / 50%)',
  '--color-primary-dark-100-alpha-600': 'rgb(36 112 212 / 40%)',
  '--color-primary-alpha-600': 'rgb(45 130 235 / 40%)',
  '--color-primary-dark-100-alpha-700': 'rgb(36 112 212 / 30%)',
  '--color-primary-alpha-700': 'rgb(45 130 235 / 30%)',
  '--color-primary-dark-100-alpha-800': 'rgb(36 112 212 / 20%)',
  '--color-primary-alpha-800': 'rgb(45 130 235 / 20%)',
  '--color-primary-dark-100-alpha-900': 'rgb(36 112 212 / 10%)',
  '--color-primary-alpha-900': 'rgb(45 130 235 / 10%)',
  '--color-primary-light-100': 'rgb(92 165 245)',
  '--color-primary-light-100-alpha-100': 'rgb(92 165 245 / 90%)',
  '--color-primary-light-100-alpha-200': 'rgb(92 165 245 / 80%)',
  '--color-primary-light-100-alpha-300': 'rgb(92 165 245 / 70%)',
  '--color-primary-light-100-alpha-400': 'rgb(92 165 245 / 60%)',
  '--color-primary-light-100-alpha-500': 'rgb(92 165 245 / 50%)',
  '--color-primary-light-100-alpha-600': 'rgb(92 165 245 / 40%)',
  '--color-primary-light-100-alpha-700': 'rgb(92 165 245 / 30%)',
  '--color-primary-light-100-alpha-800': 'rgb(92 165 245 / 20%)',
  '--color-primary-light-100-alpha-900': 'rgb(92 165 245 / 10%)',
  '--color-theme': 'rgb(45, 130, 235)',
  '--color-app-background': 'rgb(245 245 247)',
  '--color-main-background': 'rgb(255 255 255)',
  '--color-content-background': 'rgb(255 255 255)',
  '--color-nav-font': 'rgb(49 49 51)',
  '--color-font': 'rgb(49 49 51)',
  '--color-font-label': 'rgb(142 142 147)',
  '--color-primary-font': 'rgb(49 49 51)',
  '--color-primary-font-hover': 'rgb(45 130 235)',
  '--color-primary-font-active': 'rgb(36 112 212)',
  '--color-primary-background': 'rgb(246 246 247)',
  '--color-primary-background-hover': 'rgb(239 239 241)',
  '--color-primary-background-selected': 'rgb(45 130 235 / 10%)',
  '--color-primary-background-active': 'rgb(45 130 235 / 16%)',
  '--color-button-font': 'rgb(86 86 91)',
  '--color-button-font-selected': 'rgb(45 130 235)',
  '--color-button-background': 'rgb(246 246 247)',
  '--color-button-background-selected': 'rgb(45 130 235 / 10%)',
  '--color-button-background-hover': 'rgb(239 239 241)',
  '--color-button-background-active': 'rgb(45 130 235 / 16%)',
  '--color-border': 'rgb(229 229 231)',
}

const neteaseNightChromeColors: Record<string, string> = {
  ...neteaseDayChromeColors,
  '--color-app-background': 'rgb(24 25 32)',
  '--color-main-background': 'rgb(17 18 25)',
  '--color-content-background': 'rgb(17 18 25)',
  '--color-nav-font': 'rgb(225 226 232)',
  '--color-font': 'rgb(225 226 232)',
  '--color-font-label': 'rgb(134 137 148)',
  '--color-primary-font': 'rgb(225 226 232)',
  '--color-primary-font-hover': 'rgb(255 255 255)',
  '--color-primary-font-active': 'rgb(255 255 255)',
  '--color-primary-background': 'rgb(39 40 49)',
  '--color-primary-background-hover': 'rgb(49 50 60)',
  '--color-primary-background-selected': 'rgb(45 130 235)',
  '--color-primary-background-active': 'rgb(45 130 235 / 84%)',
  '--color-button-font': 'rgb(190 192 200)',
  '--color-button-font-selected': 'rgb(255 255 255)',
  '--color-button-background': 'rgb(39 40 49)',
  '--color-button-background-selected': 'rgb(45 130 235)',
  '--color-button-background-hover': 'rgb(49 50 60)',
  '--color-button-background-active': 'rgb(45 130 235 / 84%)',
  '--color-border': 'rgb(42 43 52)',
}

const isNeteaseNightMode = () => {
  const hour = new Date().getHours()
  return hour >= 18 || hour < 7
}

const isAccentColorKey = (key: string) => {
  return (
    key == '--color-theme' ||
    key == '--color-primary' ||
    /^--color-primary-(?:dark|light)-\d+(?:-alpha-\d+)?$/.test(key) ||
    /^--color-primary-alpha-\d+$/.test(key)
  )
}

const pickChromeColors = (colors: Record<string, string>) => {
  const chromeColors: Record<string, string> = {}
  for (const [key, value] of Object.entries(colors)) {
    if (!isAccentColorKey(key)) chromeColors[key] = value
  }
  return chromeColors
}

const getNeteaseRedAccentColors = () => {
  const accentColors: Record<string, string> = {}
  for (const [key, value] of Object.entries(neteaseDayChromeColors)) {
    if (isAccentColorKey(key)) accentColors[key] = value
  }
  return accentColors
}

const getGlobalSkinColors = (isDark: boolean): Record<string, string> => {
  if (isDark) {
    return {
      ...pickChromeColors(neteaseNightChromeColors),
      '--color-primary-background-selected': 'var(--color-primary)',
      '--color-primary-background-active': 'color-mix(in srgb, var(--color-primary) 84%, transparent)',
      '--color-button-font-selected': 'rgb(255 255 255)',
      '--color-button-background-selected': 'var(--color-primary)',
      '--color-button-background-active': 'color-mix(in srgb, var(--color-primary) 84%, transparent)',
    }
  }

  return {
    ...pickChromeColors(neteaseDayChromeColors),
    '--color-app-background': 'color-mix(in srgb, var(--color-primary) 14%, white)',
    '--color-main-background': 'color-mix(in srgb, var(--color-primary) 5%, white)',
    '--color-content-background': 'color-mix(in srgb, var(--color-primary) 7%, white)',
    '--color-primary-background': 'color-mix(in srgb, var(--color-primary) 13%, white)',
    '--color-primary-background-hover': 'color-mix(in srgb, var(--color-primary) 18%, white)',
    '--color-primary-background-selected': 'color-mix(in srgb, var(--color-primary) 22%, white)',
    '--color-primary-background-active': 'color-mix(in srgb, var(--color-primary) 28%, white)',
    '--color-button-font-selected': 'var(--color-primary)',
    '--color-button-background': 'color-mix(in srgb, var(--color-primary) 12%, white)',
    '--color-button-background-selected': 'color-mix(in srgb, var(--color-primary) 22%, white)',
    '--color-button-background-hover': 'color-mix(in srgb, var(--color-primary) 18%, white)',
    '--color-button-background-active': 'color-mix(in srgb, var(--color-primary) 28%, white)',
    '--color-border': 'color-mix(in srgb, var(--color-primary) 16%, rgb(229 229 231))',
  }
}

export const getTheme = () => {
  // fs.promises.readdir()
  const isAutoTheme = appState.appSetting['theme.id'] == 'auto'
  const neteaseNightMode = isNeteaseNightMode()
  let themeId =
    isAutoTheme
      ? neteaseNightMode
        ? appState.appSetting['theme.darkId']
        : appState.appSetting['theme.lightId']
      : appState.appSetting['theme.id']
  // themeId = 'naruto'
  // themeId = 'pink'
  // themeId = 'black'
  let theme = themes.find((theme) => theme.id == themeId)
  if (!theme) {
    userThemes = getStore(STORE_NAMES.THEME).get('themes') ?? []
    theme = userThemes.find((theme) => theme.id == themeId)
    if (theme) {
      if (theme.config.extInfo['--background-image'] != 'none') {
        theme = copyTheme(theme)
        theme.config.extInfo['--background-image'] = isUrl(theme.config.extInfo['--background-image'])
          ? `url(${theme.config.extInfo['--background-image']})`
          : `url(file:///${encodePath(joinPath(appState.dataPath, 'theme_images', theme.config.extInfo['--background-image']))})`
      }
    } else {
      themeId = isAutoTheme && neteaseNightMode ? 'black' : 'green'
      theme = themes.find((theme) => theme.id == themeId) as AnyListen.Theme
    }
  }

  const useDarkSkin = isAutoTheme ? neteaseNightMode : theme.isDark
  const colors: Record<string, string> = {
    ...theme.config.themeColors,
    ...theme.config.extInfo,
    ...getGlobalSkinColors(useDarkSkin),
    // 蓝色强调色在深色/浅色模式都生效(原来只在深色,导致浅色/白天模式仍是基础主题的红)
    ...(isAutoTheme || themeId == 'black' ? getNeteaseRedAccentColors() : {}),
  }

  return {
    id: themeId,
    name: theme.name,
    isDark: useDarkSkin,
    colors,
  }
}
