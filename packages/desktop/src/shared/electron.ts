import { app, clipboard, session, shell } from 'electron'

import { isUrl } from './utils'

/**
 * 在资源管理器中打开目录
 * @param {string} dir
 */
export const openDirInExplorer = (dir: string) => {
  shell.showItemInFolder(dir)
}

/**
 * 在浏览器打开URL
 * @param {*} url
 */
export const openUrl = async (url: string) => {
  if (!isUrl(url)) return
  await shell.openExternal(url)
}

/**
 * 复制文本到剪贴板
 * @param str
 */
export const clipboardWriteText = (str: string) => {
  clipboard.writeText(str)
}

/**
 * 从剪贴板读取文本
 * @returns
 */
export const clipboardReadText = (): string => {
  return clipboard.readText()
}

export const encodePath = (path: string): string => {
  // https://github.com/lyswhut/lx-music-desktop/issues/963
  // https://github.com/lyswhut/lx-music-desktop/issues/1461
  return path.replaceAll('%', '%25').replaceAll('#', '%23')
}

export const exitApp = (code = 0) => {
  app.exit(code)
}

export const buildElectronProxyConfig = (host: string, port: string, followSystem = false): Electron.ProxyConfig => {
  if (followSystem) {
    return {
      mode: 'system',
    }
  }
  return host
    ? {
        mode: 'fixed_servers',
        proxyRules: `http://${host}:${port}`,
      }
    : {
        mode: 'direct',
    }
}

export const parseElectronResolvedProxy = (proxyInfo: string): { host: string; port: string } | null => {
  for (const rule of proxyInfo.split(';')) {
    const normalizedRule = rule.trim()
    if (!normalizedRule || normalizedRule.toUpperCase() == 'DIRECT') continue
    const [type = '', address = ''] = normalizedRule.split(/\s+/, 2)
    if (!['PROXY', 'HTTP', 'HTTPS'].includes(type.toUpperCase()) || !address) continue
    const index = address.lastIndexOf(':')
    if (index < 1) return { host: address, port: type.toUpperCase() == 'HTTPS' ? '443' : '80' }
    return {
      host: address.substring(0, index),
      port: address.substring(index + 1),
    }
  }
  return null
}

export const resolveSystemProxy = async () => {
  await session.defaultSession.setProxy({ mode: 'system' })
  return parseElectronResolvedProxy(await session.defaultSession.resolveProxy('https://www.example.com/'))
}

export const trashItem = async (filePath: string) => {
  await shell.trashItem(filePath)
}
