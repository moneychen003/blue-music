process.env.NODE_ENV = 'production'
process.env.MODE = 'desktop'
// process.env.VITE_CJS_TRACE = 'true'
process.env.VITE_CJS_IGNORE_WARNING = 'true'
process.env.WS_NO_BUFFER_UTIL = 'true'
process.env.WS_NO_UTF_8_VALIDATE = 'true'

// A cross-build must compile target-platform branches, not the build host's UI.
const targetPlatform = process.env.JIDE_TARGET_PLATFORM || process.platform
if (!['darwin', 'linux', 'win32'].includes(targetPlatform)) throw new Error(`Unsupported target platform: ${targetPlatform}`)
for (const flag of ['VITE_IS_MAC', 'VITE_IS_LINUX', 'VITE_IS_WINDOWS']) delete process.env[flag]
switch (targetPlatform) {
  case 'darwin':
    process.env.VITE_IS_MAC = 'true'
    break
  case 'linux':
    process.env.VITE_IS_LINUX = 'true'
    break
  case 'win32':
  default:
    process.env.VITE_IS_WINDOWS = 'true'
    break
}

process.on('SIGINT', () => {
  process.exit(0)
})
process.on('SIGTERM', () => {
  process.exit(0)
})

void import('./bundler/pack-desktop')
