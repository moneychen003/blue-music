import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
// Explicit, read-only upstream availability probe. No browser session or user profile is read.
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import vm from 'node:vm'
const root = path.resolve(process.argv[2] || '.')
const { installBundledExtension } = await import(
  pathToFileURL(path.join(root, 'packages/desktop/src/modules/extension/bundled.ts'))
)
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'jide-gd-live-'))
let actions,
  calls = 0
try {
  assert.equal(await installBundledExtension(path.join(root, 'extensions'), path.join(temp, 'extension')), 'installed')
  const api = {
    env: { version: '1.2.1' },
    logcat: { info() {}, warn() {}, error() {} },
    utils: { crypto: {}, dataConverter: {}, iconv: {}, zlib: {} },
    configuration: { getConfigs: async () => [false, '', ''], onConfigChanged() {} },
    app: { showMessage: async () => {} },
    registerResourceAction: (value) => {
      actions = value
    },
    request: async (url, options) => {
      calls++
      assert.equal(new URL(url).hostname, 'music-api.gdstudio.xyz')
      assert.equal(new URL(url).protocol, 'https:')
      const args = [
        '--disable',
        '--silent',
        '--show-error',
        '--location',
        '--max-redirs',
        '3',
        '--proto',
        '=https',
        '--max-time',
        '30',
        '--write-out',
        '\n%{http_code}',
      ]
      for (const [key, value] of Object.entries(options.headers || {})) {
        assert(!/authorization|cookie/i.test(key))
        args.push('-H', `${key}: ${value}`)
      }
      args.push(url)
      const output = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
      const at = output.lastIndexOf('\n')
      return { statusCode: Number(output.slice(at + 1)), body: JSON.parse(output.slice(0, at)) }
    },
  }
  vm.runInNewContext(await fs.readFile(path.join(temp, 'extension/ext/gdstudio/main.js'), 'utf8'), {
    require: () => api,
    Map,
    Set,
    Date,
    setTimeout,
    clearTimeout,
  })
  await Promise.resolve()
  await assert.rejects(actions.musicSearch({ source: 'tencent', name: 'Beethoven', limit: 1, page: 1 }), /未配置签名/)
  assert.equal(calls, 0)
  const result = await actions.musicSearch({ source: 'netease', name: 'Beethoven', limit: 1, page: 1 })
  assert(result.list.length > 0)
  const audio = await actions.musicUrl({ source: 'netease', musicInfo: result.list[0], quality: '128k' })
  assert.equal(new URL(audio.url).protocol, 'https:')
  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        observedAt: new Date().toISOString(),
        calls,
        source: 'netease',
        track: result.list[0].name,
        quality: audio.quality,
        audioHost: new URL(audio.url).hostname,
        missingSigner: 'explicit error; no network',
        privateCredentials: 'none',
        playback: 'not tested',
      },
      null,
      2
    )
  )
} finally {
  await fs.rm(temp, { recursive: true, force: true })
}
