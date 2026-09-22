#!/usr/bin/env node
// Usage: node /absolute/path/to/this-script.cjs /absolute/repository/root
// Same fixture inputs for baseline, candidate and rollback; no external services.
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'))
const runtimeRequire = createRequire(path.join(__dirname, '../packages/shared/scripts/package.json'))
const { transformSync } = runtimeRequire('esbuild')
const dir = 'packages/shared/app/modules/resources/'
let passed = 0, failed = 0
function load(file, mocks = {}, globals = {}) {
  const code = transformSync(fs.readFileSync(path.join(root, file), 'utf8'), {
    loader: 'ts', format: 'cjs', define: { 'import.meta.env.VITE_IS_DESKTOP': 'true' },
  }).code
  const module = { exports: {} }
  const localRequire = createRequire(path.join(root, file))
  const context = { module, exports: module.exports, require: (id) => Object.hasOwn(mocks, id) ? mocks[id] : localRequire(id),
    console: { ...console, warn() {}, error() {} }, URL, Date, AbortController, Buffer, process, setTimeout, clearTimeout, ...globals }
  vm.runInNewContext(code, context, { filename: file })
  return module.exports
}
function makeFixture({ search, request, resources, action, globals } = {}) {
  const shared = { resourceState: { resources: resources || {} }, services: { extensionSerive: { resourceAction: action || (() => { throw Error('not configured') }) } } }
  const utils = load(dir + 'utils.ts', { './shared': shared })
  const health = fs.existsSync(path.join(root, dir + 'sourceHealth.ts')) ? load(dir + 'sourceHealth.ts', {}, globals) : {}
  const tools = load(dir + 'tools.ts', { './utils': utils, './sourceHealth': health, './search/music': { findMusic: search || (async () => null) } }, globals)
  const music = load(dir + 'musicUrl.ts', { './shared': shared, './utils': utils, './tools': tools, './sourceHealth': health, '@any-listen/nodejs/request': { request: request || (async () => { throw Error('offline') }) } }, globals)
  return { utils, health, tools, music, shared }
}
const song = { id: 'fixture', isLocal: false, name: 'Test', singer: 'Artist', interval: '03:00', meta: { source: 'original', albumName: 'Album' } }
const source = (id, extensionId = 'fixture-ext') => ({ id, extensionId })
async function test(name, fn) {
  try { await fn(); ++passed; console.log(`PASS ${name}`) }
  catch (e) { ++failed; console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`) }
}
async function main() {
  await test('legacy composite source IDs remain stable', async () => {
    assert.equal(makeFixture().utils.buildExtSourceId('ext', 'kw'), 'kw__ext')
  })
  await test('raw source exclusion skips original source', async () => {
    const { utils } = makeFixture({ resources: { musicSearch: [source('kw'), source('wy')] } })
    assert.equal(utils.getPreferredExtSource('musicSearch', ['kw']).id, 'wy')
  })
  await test('verified netease source is not starved by old aggregate sources', async () => {
    const { utils } = makeFixture({ resources: { musicSearch: [source('netease', 'gd'), source('kw', 'old-lx')] } })
    assert.equal(utils.getPreferredExtSource('musicSearch').id, 'netease')
    assert.equal(utils.getPreferredExtSource('musicSearch', ['netease']).id, 'kw')
  })
  await test('search exception advances to next source', async () => {
    const seen = []
    const { tools } = makeFixture({ resources: { musicSearch: [source('kw'), source('wy')] }, search: async ({ source }) => {
      seen.push(source); if (source === 'kw') throw Error('fixture search error'); return { ...song, meta: { ...song.meta, source } }
    } })
    assert.equal(await tools.findMusic(song, async info => { if (info.meta.source === 'original') throw Error('offline'); return info.meta.source }), 'wy')
    assert.equal(seen.join(','), 'kw,wy')
  })
  await test('search timeout advances instead of hanging', async () => {
    const { tools } = makeFixture({ resources: { musicSearch: [source('kw'), source('wy')] }, search: async ({ source }) => source === 'kw' ? new Promise(() => {}) : song,
      globals: { setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 15)) } })
    const local = { ...song, isLocal: true, meta: { ...song.meta, filePath: '/fixture.mp3' } }
    const outcome = await Promise.race([tools.findMusic(local, async () => 'ok'), new Promise(resolve => setTimeout(() => resolve('hung'), 100))])
    assert.equal(outcome, 'ok')
  })
  await test('two failures cool down a source and one minute recovers', async () => {
    let now = 1000
    class Clock extends Date { static now() { return now } }
    const { health } = makeFixture({ globals: { Date: Clock } })
    assert.equal(typeof health.runSourceAction, 'function')
    for (let i = 0; i < 2; i++) await assert.rejects(health.runSourceAction('search', 'x', 50, async () => { throw Error('fixture') }))
    assert.equal(health.isSourceCoolingDown('search', 'x'), true)
    assert.equal(health.isSourceCoolingDown('url', 'x'), false)
    now += 60001
    assert.equal(health.isSourceCoolingDown('search', 'x'), false)
  })
  await test('empty search results are not failures', async () => {
    const { health } = makeFixture()
    assert.equal(typeof health.runSourceAction, 'function')
    for (let i = 0; i < 3; i++) await health.runSourceAction('search', 'empty', 50, async () => null)
    assert.equal(health.isSourceCoolingDown('search', 'empty'), false)
  })
  for (const [name, spec, rejected] of [
    ['full audio is accepted', { statusCode: 200, headers: { 'content-type': 'audio/mpeg', 'content-length': '4444444' } }, false],
    ['preview remains rejected', { statusCode: 200, headers: { 'content-type': 'audio/mpeg', 'content-length': '100000' } }, true],
    ['HTTP 403 is not playable', { statusCode: 403, headers: { 'content-length': '4444444' } }, true],
    ['HTML error page is not audio', { statusCode: 200, headers: { 'content-type': 'text/html', 'content-length': '4444444' } }, true],
    ['audio-only MP4 container is not rejected by video MIME', { statusCode: 200, headers: { 'content-type': 'video/mp4; codecs=mp4a.40.2', 'content-length': '4444444' } }, false],
    ['audio-only WebM container is not rejected by video MIME', { statusCode: 200, headers: { 'content-type': 'video/webm', 'content-length': '4444444' } }, false],
    ['unsupported video MIME remains rejected', { statusCode: 200, headers: { 'content-type': 'video/x-msvideo', 'content-length': '4444444' } }, true],
    ['unknown-length audio stream is accepted', { statusCode: 200, headers: { 'content-type': 'audio/mpeg' } }, false],
  ]) await test(name, async () => {
    const { music } = makeFixture({ request: async () => ({ ...spec, body: { once() {}, destroy() {} } }) })
    const action = music.assertPlayableMusicUrl('https://fixture.test/song.mp3', song)
    if (rejected) await assert.rejects(action); else await action
  })
  await test('network failure is not silently accepted', async () => {
    const { music } = makeFixture()
    await assert.rejects(music.assertPlayableMusicUrl('https://fixture.test/song.mp3', song))
  })
  await test('fresh probe timeout is explicitly reported and delegated to player', async () => {
    const warnings = []
    const error = Object.assign(new Error('fixture abort'), { name: 'AbortError' })
    const { music } = makeFixture({ request: async () => { throw error }, globals: { console: { ...console, warn: message => warnings.push(message) } } })
    await music.assertPlayableMusicUrl('https://fixture.test/slow-audio.mp3', song)
    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /validation unknown/)
  })
  await test('cached probe timeout still requires fresh resolution', async () => {
    const error = Object.assign(new Error('fixture abort'), { name: 'AbortError' })
    const { music } = makeFixture({ request: async () => { throw error } })
    await assert.rejects(music.assertPlayableMusicUrl('https://fixture.test/slow-audio.mp3', song, true))
  })
  await test('connection reset is not treated as an inconclusive timeout', async () => {
    const error = Object.assign(new Error('fixture connection reset'), { code: 'ECONNRESET' })
    const { music } = makeFixture({ request: async () => { throw error } })
    await assert.rejects(music.assertPlayableMusicUrl('https://fixture.test/broken-audio.mp3', song))
  })
  await test('HEAD unsupported uses Range without buffering response', async () => {
    const calls = []; let destroyed = 0
    const { music } = makeFixture({ request: async (_, opts) => {
      calls.push(opts)
      return { statusCode: opts.method === 'HEAD' ? 405 : 206, headers: { 'content-type': 'audio/mpeg', 'content-length': '2', 'content-range': 'bytes 0-1/4444444' }, body: { once() {}, destroy() { destroyed++ } } }
    } })
    await music.assertPlayableMusicUrl('https://fixture.test/song.mp3', song)
    assert.equal(calls.length, 2)
    assert.equal(calls[1].headers.Range, 'bytes=0-1')
    assert.equal(calls[1].needBody, true)
    assert.equal(calls[1].needRaw, undefined)
    assert.equal(destroyed, 2)
  })
  await test('206 without total size does not misclassify probe as preview', async () => {
    const { music } = makeFixture({ request: async (_, opts) => ({ statusCode: opts.method === 'HEAD' ? 405 : 206, headers: { 'content-type': 'audio/mpeg', 'content-length': '2' }, body: { once() {}, destroy() {} } }) })
    await music.assertPlayableMusicUrl('https://fixture.test/song.mp3', song)
  })
  await test('cached googlevideo URL requires fresh resolution', async () => {
    const { music } = makeFixture({ request: async () => ({ statusCode: 200, headers: { 'content-length': '4444444' }, body: { once() {}, destroy() {} } }) })
    await assert.rejects(music.assertPlayableMusicUrl('https://r1.googlevideo.com/audio', song, true))
    await music.assertPlayableMusicUrl('https://r1.googlevideo.com/audio', song, false)
  })
  await test('expired signed URL rejected before network', async () => {
    const { music } = makeFixture({ request: async () => ({ statusCode: 200, headers: { 'content-length': '4444444' }, body: { once() {}, destroy() {} } }) })
    await assert.rejects(music.assertPlayableMusicUrl('https://fixture.test/audio?expire=1', song))
  })
  await test('short-track invalid URL rejected too', async () => {
    const { music } = makeFixture()
    await assert.rejects(music.assertPlayableMusicUrl('./placeholder', { ...song, interval: '00:30' }))
  })
  await test('retryNum zero honored with default redirect policy', async () => {
    let dispatched
    const dispatcher = { compose: (...args) => ({ composed: args }) }
    const fakeUndici = { FormData: class {}, ProxyAgent: class {}, getGlobalDispatcher: () => dispatcher, setGlobalDispatcher() {}, interceptors: { redirect: opts => ({ redirect: opts }), retry: opts => ({ retry: opts }) },
      request: async (_, opts) => { dispatched = opts.dispatcher; return { headers: {}, statusCode: 200, body: { text: async () => '' } } } }
    const requestModule = load('packages/shared/nodejs/request.ts', { undici: fakeUndici }, { process: { env: {} } })
    await requestModule.request('https://fixture.test', { retryNum: 0 })
    assert.equal(dispatched?.composed.find(x => x.retry)?.retry.maxRetries, 0)
  })
  await test('real HTTP Range-ignoring server is disconnected without full download', async () => {
    const http = require('node:http')
    let bytesSent = 0
    let getRequests = 0
    const sockets = new Set()
    const server = http.createServer((req, res) => {
      if (req.method === 'HEAD') { res.writeHead(405); res.end(); return }
      getRequests++
      res.writeHead(200, { 'content-type': 'audio/mpeg', 'content-length': 8 * 1024 * 1024 })
      res.flushHeaders()
      const timer = setInterval(() => {
        const chunk = Buffer.alloc(8192)
        bytesSent += chunk.length
        res.write(chunk)
        if (bytesSent >= 8 * 1024 * 1024) { clearInterval(timer); res.end() }
      }, 1)
      res.on('close', () => clearInterval(timer))
    })
    server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)) })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    try {
      const requestModule = load('packages/shared/nodejs/request.ts', {}, { process: { env: {} } })
      const { music } = makeFixture({ request: requestModule.request })
      await music.assertPlayableMusicUrl(`http://127.0.0.1:${server.address().port}/audio`, song)
      await new Promise(resolve => setTimeout(resolve, 30))
      assert.equal(getRequests, 1)
      assert.ok(bytesSent < 128 * 1024, `server sent ${bytesSent} bytes`)
    } finally {
      for (const socket of sockets) socket.destroy()
      await new Promise(resolve => server.close(resolve))
    }
  })
  console.log(`RESULT ${passed} passed, ${failed} failed`)
  process.exitCode = failed ? 1 : 0
}
main().catch(err => { console.error(err); process.exitCode = 2 })
