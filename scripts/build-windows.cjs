// Cross-platform Windows x64 release build. No upload, signing bypass, or installation.
const { spawnSync } = require('node:child_process')
const path = require('node:path')
const cwd = path.join(__dirname, '..')
const env = { ...process.env, JIDE_TARGET_PLATFORM: 'win32', DESKTOP_ONLY: '1' }
for (const args of [
  ['-F', '@shared/scripts', 'exec', 'ts-node', 'pack-desktop.ts'],
  ['-F', 'desktop', 'pack:win:x64'],
]) {
  const result = spawnSync('pnpm', args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status || 1)
}
