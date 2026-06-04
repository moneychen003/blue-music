import type { ClientCall, ExposeFunctions, MainCall } from '.'

// 暴露给后端的方法
export const createExposeTheme = (client: ClientCall) => {
  return {
    async themeChanged(event, setting) {
      return client.themeChanged(setting)
    },
    async themeListChanged(event, list) {
      return client.themeListChanged(list)
    },
  } as const satisfies Partial<ExposeFunctions>
}

// 暴露给前端的方法
export const createClientTheme = (main: MainCall) => {
  return {
    async getThemeSetting() {
      return main.getThemeSetting()
    },
    async getThemeList() {
      return main.getThemeList()
    },
    async saveTheme(theme) {
      return main.saveTheme(theme)
    },
    async removeTheme(id) {
      return main.removeTheme(id)
    },
  } satisfies Partial<AnyListen.IPC.ServerIPC>
}
