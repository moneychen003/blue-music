const fs = require('fs').promises
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')

// 包含 macOS 常见语言代码的列表
const locales = [
  'af',
  'en',
  'hr',
  'mr',
  'sv',
  'am',
  'en_GB',
  'hu',
  'ms',
  'sw',
  'es',
  'nb',
  'ta',
  'es_419',
  'id',
  'nl',
  'te',
  'ar',
  'et',
  'it',
  'pl',
  'th',
  'bg',
  'fa',
  'ja',
  'pt_BR',
  'tr',
  'bn',
  'fi',
  'kn',
  'pt_PT',
  'uk',
  'ca',
  'fil',
  'ko',
  'ro',
  'ur',
  'cs',
  'fr',
  'ru',
  'vi',
  'da',
  'gu',
  'lt',
  'sk',
  'zh_CN',
  'de',
  'he',
  'lv',
  'sl',
  'zh_TW',
  'el',
  'hi',
  'ml',
  'sr',
]

const macLanguagesInfoPlistStrings = locales.reduce((acc, locale) => {
  const name = locale === 'zh_CN' ? '技得音乐' : locale === 'zh_TW' ? '技得音樂' : 'Jide Music'
  acc[locale] = { CFBundleDisplayName: name, CFBundleName: name }
  return acc
}, {})

// https://github.com/electron-userland/electron-builder/issues/4630
// https://github.com/electron-userland/electron-builder/issues/4630#issuecomment-782020139

module.exports = async (context) => {
  const { electronPlatformName, appOutDir, packager } = context
  if (electronPlatformName !== 'darwin') return

  const resPath = `${appOutDir}/${packager.appInfo.productFilename}.app/Contents/Resources`

  // 创建APP语言包文件
  await Promise.all(
    Object.entries(macLanguagesInfoPlistStrings).map(async ([lang, config]) => {
      let infos = Object.entries(config)
        .map(([k, v]) => `"${k}" = "${v}";`)
        .join('\n')
      await fs.mkdir(`${resPath}/${lang}.lproj`, { recursive: true })
      return fs.writeFile(`${resPath}/${lang}.lproj/InfoPlist.strings`, infos)
    })
  )
  // Remove build-only Finder metadata that blocks signing, not quarantine.
  for (const attribute of ['com.apple.FinderInfo', 'com.apple.ResourceFork']) {
    await promisify(execFile)('/usr/bin/xattr', ['-dr', attribute, `${appOutDir}/${packager.appInfo.productFilename}.app`])
      .catch((error) => { if (error.code !== 1) throw error })
  }

}
