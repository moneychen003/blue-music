#!/usr/bin/env node
'use strict'

// Source-level guard plus executable URL policy check. Pass --repo=/absolute/path
// to compare a baseline checkout. --built also checks actual sandbox preload bundles.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const http = require('node:http')
const os = require('node:os')
const crypto = require('node:crypto')

const root = path.resolve((process.argv.find((arg) => arg.startsWith('--repo=')) ?? '').slice(7) || path.join(__dirname, '..'))
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8')
const checks = []
const check = (name, fn) => {
  try { fn(); checks.push([name, true]); console.log(`PASS ${name}`) }
  catch (error) { checks.push([name, false]); console.error(`FAIL ${name}: ${error.message}`) }
}
const main = read('packages/desktop/src/renderer/winMain/main.ts')
const lyric = read('packages/desktop/src/renderer/winLyric/main.ts')
const mainPreload = read('packages/desktop/src/renderer/winMain/preload/index.ts')
const lyricPreload = read('packages/desktop/src/renderer/winLyric/preload/index.ts')
const ipc = read('packages/desktop/src/shared/ipc/main.ts')
const app = read('packages/desktop/src/app/index.ts')
const electron = read('packages/desktop/src/shared/electron.ts')
const frontendMain = read('packages/view-main/src/main.ts')
const frontendLyric = read('packages/view-main/src/views/DesktopLyric/LyricWindow.svelte')
for (const [name, source] of [['main', main], ['lyric', lyric]]) {
  check(`${name} window security preferences`, () => {
    for (const setting of ['contextIsolation: true', 'sandbox: true', 'webSecurity: true', 'nodeIntegration: false', 'nodeIntegrationInWorker: false']) assert.ok(source.includes(setting), `missing ${setting}`)
  })
}
check('isolated preload APIs', () => {
  assert.match(mainPreload, /contextBridge\.exposeInMainWorld\('__anylisten_ipc_init__'/)
  assert.match(lyricPreload, /contextBridge\.exposeInMainWorld\('__lyricWin'/)
  assert.doesNotMatch(mainPreload + lyricPreload, /ELECTRON_DISABLE_SECURITY_WARNINGS/)
  assert.match(read('packages/desktop/src/renderer/winMain/preload/env.ts'), /contextBridge\.exposeInMainWorld\('__anylisten_node_env__'/)
})
check('native lyric ports transferred after renderer ready', () => {
  assert.match(mainPreload, /pageWindow\.postMessage\([^;]+ports\)/)
  assert.match(lyricPreload, /pageWindow\.postMessage\([^;]+\[port\]\)/)
  assert.match(frontendMain, /event\.ports\.length !== 1/)
  assert.match(frontendLyric, /event\.ports\.length === 1/)
  assert.match(frontendMain, /__anylisten_desktop_lyric_bridge__\?\.ready\(\)/)
  assert.match(frontendLyric, /lyricWin\(\)\?\.ready\(applyLockState\)/)
})
check('main and lyric IPC sender/frame checks', () => {
  assert.match(ipc, /if \(!isTrustedSender\(event\)\) return/)
  assert.match(read('packages/desktop/src/renderer/winMain/rendererEvent/index.ts'), /event\.senderFrame === contents\.mainFrame/)
  assert.match(lyric, /event\.senderFrame === contents\.mainFrame/)
})
check('unthrottled background timer is bound to main frame', () => {
  const env = read('packages/desktop/src/renderer/winMain/preload/env.ts')
  assert.match(env, /ipcRenderer\.send\('anylisten-background-timer-set'/)
  assert.match(env, /ipcRenderer\.send\('anylisten-background-timer-clear'/)
  assert.match(main, /ipcMain\.on\('anylisten-background-timer-set'/)
  assert.match(main, /if \(!isMainFrameSender\(event\)/)
  assert.match(main, /backgroundTimers\.size >= 2048/)
  assert.match(main, /backgroundTimers\.clear\(\)/)
})
check('navigation and permission restrictions', () => {
  assert.match(app, /setPermissionRequestHandler/)
  assert.match(app, /setPermissionCheckHandler/)
  assert.match(app, /event\.preventDefault\(\)/)
  assert.match(app, /isSafeExternalUrl\(url\)/)
})
check('external URL policy runtime', () => {
  const match = electron.match(/export const isSafeExternalUrl = \(url: unknown\): url is string => \{([\s\S]*?)\n\}/)
  assert.ok(match, 'policy function missing')
  const policy = vm.runInNewContext(`(url) => {${match[1]}\n}`, { URL })
  for (const url of ['https://example.com/a', 'http://localhost:1234/x']) assert.equal(policy(url), true, url)
  for (const url of ['javascript:alert(1)', 'file:///tmp/x', 'data:text/html,x', 'devtools://devtools', 'https://user:pass@example.com', '//example.com', 'not a URL', 42]) assert.equal(policy(url), false, String(url))
  assert.match(electron, /if \(!isSafeExternalUrl\(url\)\) return/)
})
check('audio proxy source policy', () => {
  const proxy = read('packages/desktop/src/modules/proxyServer/index.ts')
  const audio = read('packages/desktop/src/modules/proxyServer/audioResources.ts')
  const local = read('packages/desktop/src/modules/music/local.ts')
  const online = read('packages/desktop/src/modules/music/online.ts')
  assert.match(proxy, /server\.listen\(DEFAULT_PORT, '127\.0\.0\.1'\)/)
  assert.match(proxy, /handleAudioResource\(req, res, path\)/)
  assert.match(audio, /randomBytes\(24\)/)
  assert.match(audio, /\^\[a-f0-9\]\{48\}\$/)
  assert.match(local, /url: await registerLocalAudioFile\(authorizedPath\)/)
  assert.match(online, /registerRemoteAudioUrl\(info\.url\)/)
  assert.doesNotMatch(audio, /Access-Control-Allow-Origin', '\*'/)
  assert.match(local, /getMusicExistListIds\(musicInfo\.id\)/)
  assert.match(local, /getListMusicsByIds\(listId, \[musicInfo\.id\]\)/)
  assert.match(local, /getPlayList\(\)/)
  assert.match(local, /fs\.realpath\(filePath\)/)
  assert.match(local, /Local audio path is not authorized/)
  assert.match(app, /!app\.getName\(\)\.endsWith\('-preview'\)/)
})
if (process.argv.includes('--built')) {
  check('sandbox preload bundles are self-contained', () => {
    for (const name of ['view-main.preload.js', 'view-lyric.preload.js']) {
      const source = read(`packages/desktop/dist/electron/${name}`)
      assert.doesNotMatch(source, /require\(['"]\.\.?\//, `${name} requires relative chunk`)
    }
    assert.match(read('packages/desktop/dist/electron/main.js'), /anylisten-background-timer-set/)
    assert.match(read('packages/desktop/dist/electron/view-main.preload.js'), /anylisten-background-timer-set/)
  })
}
async function checkAudioRuntime() {
  let server
  let dir
  try {
    const vite = require(require.resolve('vite', { paths: [path.join(root, 'packages/desktop')] }))
    let { code } = await vite.transformWithOxc(read('packages/desktop/src/modules/proxyServer/audioResources.ts'), 'audioResources.ts')
    code = code.replace(/^import .*;$/gm, '').replace(/^export const /gm, 'const ')
    const requestCalls = []
    const stubRequest = async (url, options) => {
      requestCalls.push({ url, options })
      return { statusCode: 206, headers: { 'content-type': 'audio/mpeg', 'content-range': 'bytes 0-3/4', 'content-length': '4' }, body: require('node:stream').Readable.from(Buffer.from('test')) }
    }
    const api = new Function('fs', 'fsPromises', 'path', 'randomBytes', 'MEDIA_FILE_TYPES', 'request', `${code}\nreturn { initAudioResources, registerLocalAudioFile, registerRemoteAudioUrl, handleAudioResource };`)(
      fs, require('node:fs/promises'), path, crypto.randomBytes, ['mp3', 'flac', 'ogg', 'oga', 'wav', 'm4a'], stubRequest
    )
    server = http.createServer((req, res) => void api.handleAudioResource(req, res, new URL(req.url, 'http://localhost').pathname))
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const base = `http://127.0.0.1:${server.address().port}`
    api.initAudioResources(base, 'http://localhost:12345')
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anylisten-security-'))
    const file = path.join(dir, 'sample.mp3')
    fs.writeFileSync(file, Buffer.from('0123456789'))
    const url = await api.registerLocalAudioFile(file)
    assert.match(url, new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/audio/[a-f0-9]{48}$`))
    assert.ok(!url.includes('sample.mp3'))
    let response = await fetch(url, { headers: { Origin: 'null' } })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('access-control-allow-origin'), 'null')
    assert.equal(await response.text(), '0123456789')
    response = await fetch(url, { headers: { Origin: 'null', Range: 'bytes=2-5' } })
    assert.equal(response.status, 206)
    assert.equal(response.headers.get('content-range'), 'bytes 2-5/10')
    assert.equal(await response.text(), '2345')
    response = await fetch(url, { headers: { Range: 'bytes=-3' } })
    assert.equal(response.status, 206)
    assert.equal(await response.text(), '789')
    response = await fetch(url, { headers: { Range: 'bytes=999-' } })
    assert.equal(response.status, 416)
    response = await fetch(url, { headers: { Origin: 'https://untrusted.example' } })
    assert.equal(response.headers.get('access-control-allow-origin'), null)
    response = await fetch(`${base}/audio/${'0'.repeat(48)}`)
    assert.equal(response.status, 404)
    response = await fetch(`${base}/audio/%2e%2e%2fetc%2fpasswd`)
    assert.equal(response.status, 404)
    response = await fetch(url, { method: 'POST' })
    assert.equal(response.status, 405)
    assert.throws(() => api.registerRemoteAudioUrl('file:///etc/passwd'))
    const remote = api.registerRemoteAudioUrl('https://music.example/song.mp3?signature=secret')
    assert.ok(!remote.includes('secret'))
    response = await fetch(remote, { headers: { Origin: 'http://localhost:12345', Range: 'bytes=0-3' } })
    assert.equal(response.status, 206)
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:12345')
    assert.equal(await response.text(), 'test')
    assert.equal(requestCalls.length, 1)
    assert.equal(requestCalls[0].options.headers.Range, 'bytes=0-3')
    checks.push(['local/remote token proxy HTTP integration', true]); console.log('PASS local/remote token proxy HTTP integration')

    const other = path.join(dir, 'other.mp3')
    const link = path.join(dir, 'linked.mp3')
    fs.writeFileSync(other, Buffer.from('other audio'))
    fs.symlinkSync(other, link)
    let { code: localCode } = await vite.transformWithOxc(read('packages/desktop/src/modules/music/local.ts'), 'local.ts')
    localCode = localCode.replace(/^import .*;$/gm, '').replace(/^export const /gm, 'const ')
    const stored = { id: 'valid', isLocal: true, meta: { filePath: file } }
    const queue = []
    const workers = { dbService: {
      getPlayList: async () => queue,
      getMusicExistListIds: async (id) => id === 'valid' ? ['default'] : [],
      getListMusicsByIds: async (_listId, ids) => ids.includes('valid') ? [stored] : [],
      getListMusics: async () => [stored],
    } }
    const localApi = new Function('fs', 'path', 'workers', `${localCode}\nreturn { getAuthorizedLocalPath };`)(require('node:fs/promises'), path, workers)
    assert.equal(await localApi.getAuthorizedLocalPath({ id: 'missing', isLocal: true, meta: { filePath: file } }), null)
    assert.equal(await localApi.getAuthorizedLocalPath({ id: 'valid', isLocal: true, meta: { filePath: other } }), null)
    assert.equal(await localApi.getAuthorizedLocalPath({ id: 'valid', isLocal: true, meta: { filePath: link } }), null)
    assert.equal(await localApi.getAuthorizedLocalPath({ id: 'valid', isLocal: true, meta: { filePath: file } }), await require('node:fs/promises').realpath(file))
    queue.push({ musicInfo: { id: 'temporary', isLocal: true, meta: { filePath: other } } })
    assert.equal(await localApi.getAuthorizedLocalPath({ id: 'temporary', isLocal: true, meta: { filePath: other } }), await require('node:fs/promises').realpath(other))
    checks.push(['local audio main-process record binding', true]); console.log('PASS local audio main-process record binding')
  } catch (error) {
    checks.push(['local/remote token proxy HTTP integration', false]); console.error(`FAIL local/remote token proxy HTTP integration: ${error.stack || error}`)
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve))
    if (dir) fs.rmSync(dir, { recursive: true, force: true })
  }
}

const finish = () => {
  console.log(`${checks.filter(([, ok]) => ok).length}/${checks.length} passed`)
  process.exitCode = checks.every(([, ok]) => ok) ? 0 : 1
}
if (process.argv.includes('--audio')) void checkAudioRuntime().then(finish)
else finish()
