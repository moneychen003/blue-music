#!/opt/homebrew/bin/node
/* Isolated cancellation tests: no personal data, no external network. */
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { createRequire } = require('node:module')
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'))
const { transformSync } = createRequire(path.join(root, 'packages/shared/scripts/package.json'))('esbuild')
let passed = 0, failed = 0
const tick = () => new Promise(r => setImmediate(r))
function load(file, mocks = {}, globals = {}) {
  const full = path.join(root, file)
  const m = { exports: {} }
  const localRequire = createRequire(full)
  const code = transformSync(fs.readFileSync(full, 'utf8'), { loader: 'ts', format: 'cjs' }).code
  vm.runInNewContext(code, { module: m, exports: m.exports,
    require: id => Object.hasOwn(mocks, id) ? mocks[id] : localRequire(id),
    console, process, AbortController, URL, Buffer, setTimeout, clearTimeout, ...globals }, { filename: file })
  return m.exports
}
async function check(name, fn) {
  try { await fn(); passed++; console.log(`PASS ${name}`) }
  catch (err) { failed++; console.error(`FAIL ${name}: ${err.stack || err}`) }
}
function networkFixture() {
  const calls = []
  const rawRequest = (_url, opts) => new Promise((resolve, reject) => {
    const call = { signal: opts.signal, resolve: () => resolve({ body: 'ok', headers: {}, raw: new Uint8Array(), statusCode: 200, history: [] }), aborted: false }
    calls.push(call)
    opts.signal.addEventListener('abort', () => { call.aborted = true; reject(Object.assign(new Error('network aborted'), { name: 'AbortError' })) }, { once: true })
    if (opts.signal.aborted) { call.aborted = true; reject(new Error('already aborted')) }
  })
  const ext = load('packages/shared/app/modules/worker/extensionService/extensionApis/request.ts', {
    '@any-listen/common/utils': { cloneData: x => ({ ...x }) },
    '@any-listen/nodejs/request': { request: rawRequest },
  })
  const request = ext.createRequest({ grant: ['internet'] }).request
  return { ...ext, request, calls }
}
async function main() {
  await check('timeout aborts actual scoped network and rejects promptly', async () => {
    const f = networkFixture(); const health = load('packages/shared/app/modules/resources/sourceHealth.ts')
    await assert.rejects(health.runSourceAction('musicSearch', 'timeout-fixture', 20,
      (_signal, id) => f.runResourceRequestScope(id, () => f.request('https://fixture.invalid/a')),
      { cancel: id => f.cancelResourceRequestScope(id) }), /timed out/)
    await tick(); assert.equal(f.calls.length, 1); assert.equal(f.calls[0].aborted, true)
  })
  await check('one cancelled scoped request leaves concurrent request alive', async () => {
    const f = networkFixture()
    const a = f.runResourceRequestScope('scope-a', () => f.request('https://fixture.invalid/a'))
    const b = f.runResourceRequestScope('scope-b', () => f.request('https://fixture.invalid/b'))
    await tick(); assert.equal(f.calls.length, 2)
    f.cancelResourceRequestScope('scope-a')
    await assert.rejects(a, /abort|cancel/i)
    assert.equal(f.calls[0].aborted, true); assert.equal(f.calls[1].aborted, false)
    f.calls[1].resolve(); assert.equal((await b).body, 'ok')
  })
  await check('cancel before worker scope arrives prevents network start', async () => {
    const f = networkFixture(); f.cancelResourceRequestScope('late-start')
    await assert.rejects(f.runResourceRequestScope('late-start', () => f.request('https://fixture.invalid/a')), /cancel/i)
    assert.equal(f.calls.length, 0)
  })
  await check('completed scope removes signal listener and does not poison next scope', async () => {
    const f = networkFixture()
    const a = f.runResourceRequestScope('done-a', () => f.request('https://fixture.invalid/a'))
    await tick(); f.calls[0].resolve(); await a
    assert.equal(f.calls[0].signal.aborted, false)
    const b = f.runResourceRequestScope('done-b', () => f.request('https://fixture.invalid/b'))
    await tick(); f.cancelResourceRequestScope('done-a')
    assert.equal(f.calls[1].aborted, false)
    f.calls[1].resolve(); await b
  })
  await check('user cancellation is not cooling failure; external listener is removed', async () => {
    const health = load('packages/shared/app/modules/resources/sourceHealth.ts')
    let added = 0, removed = 0, cancelled = 0
    const target = new EventTarget(); const signal = { aborted: false,
      addEventListener: (...args) => { added++; target.addEventListener(...args) },
      removeEventListener: (...args) => { removed++; target.removeEventListener(...args) } }
    const op = health.runSourceAction('musicUrl', 'user-cancel-fixture', 1000,
      () => new Promise(() => {}), { signal, cancel: () => { cancelled++ } })
    await tick(); signal.aborted = true; target.dispatchEvent(new Event('abort'))
    await assert.rejects(op, e => e.name === 'AbortError')
    assert.equal(cancelled, 1); assert.equal(added, 1); assert.equal(removed, 1)
    assert.equal(health.isSourceCoolingDown('musicUrl', 'user-cancel-fixture'), false)
    assert.equal(await health.runSourceAction('musicUrl', 'user-cancel-fixture', 50, async () => 'ok'), 'ok')
  })
  await check('late music URL callback after cancellation does not probe or commit', async () => {
    const health = load('packages/shared/app/modules/resources/sourceHealth.ts')
    let resolveUrl, probes = 0, cancels = 0
    const service = { extensionSerive: {
      resourceAction: () => new Promise(r => { resolveUrl = r }),
      cancelResourceAction: () => { cancels++ },
    } }
    const music = load('packages/shared/app/modules/resources/musicUrl.ts', {
      './shared': { services: service }, './sourceHealth': health,
      './tools': { findMusic: async () => {} },
      './utils': { allowedUrl: () => true, buildExtSourceId: () => 'late-url', getExtSource: () => null },
      '@any-listen/nodejs/request': { request: async () => { probes++; throw Error('should not probe') } },
    })
    const controller = new AbortController()
    const song = { id: 'fixture', name: 'fixture', singer: 'fixture', interval: '03:00', isLocal: false, meta: { source: 'fixture' } }
    const promise = music.getMusicUrlByExtensionSource({ extensionId: 'test', source: 'test', musicInfo: song, signal: controller.signal })
    await tick(); controller.abort(); await assert.rejects(promise, e => e.name === 'AbortError')
    resolveUrl({ url: 'https://fixture.invalid/audio.mp3', quality: '320k' }); await tick()
    assert.equal(cancels, 1); assert.equal(probes, 0)
  })
  await check('public musicSearch cancels one UI request ID without affecting another', async () => {
    const health = load('packages/shared/app/modules/resources/sourceHealth.ts')
    const requests = [], cancelled = []
    const shared = { services: { extensionSerive: {
      resourceAction: (_action, _params, id) => new Promise(resolve => requests.push({ id, resolve })),
      cancelResourceAction: id => { cancelled.push(id) },
    } } }
    const search = load('packages/shared/app/modules/resources/musicSearch.ts', {
      '../resources/shared': shared, './sourceHealth': health,
      '@any-listen/common/constants': { SINGERS_RXP: /[、,]/ },
      './utils': { buildExtSourceId: (a, b) => `${a}:${b}` },
    })
    const aId = '11111111-1111-4111-8111-111111111111'
    const bId = '22222222-2222-4222-8222-222222222222'
    const a = search.musicSearch({ extensionId: 'ext', source: 'a', name: 'A', page: 1, requestId: aId })
    const b = search.musicSearch({ extensionId: 'ext', source: 'b', name: 'B', page: 1, requestId: bId })
    await tick(); assert.equal(requests.length, 2)
    search.cancelMusicSearch(aId)
    await assert.rejects(a, e => e.name === 'AbortError')
    assert.deepEqual(cancelled, [requests[0].id])
    requests[0].resolve({ list: [{ id: 'stale' }], total: 1, limit: 30, page: 1 })
    requests[1].resolve({ list: [{ id: 'current' }], total: 1, limit: 30, page: 1 })
    assert.equal((await b).list[0].id, 'current')
    await tick(); assert.equal(cancelled.length, 1)
    await assert.rejects(search.musicSearch({ extensionId: 'ext', source: 'a', name: 'A', page: 1, requestId: 'not-uuid' }), /Invalid search request ID/)
    const early = '33333333-3333-4333-8333-333333333333'
    search.cancelMusicSearch(early)
    await assert.rejects(search.musicSearch({ extensionId: 'ext', source: 'a', name: 'A', page: 1, requestId: early }), e => e.name === 'AbortError')
    assert.equal(requests.length, 2)
  })
  await check('public musicSearch timeout calls worker cancellation', async () => {
    const health = load('packages/shared/app/modules/resources/sourceHealth.ts', {}, {
      setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 20)),
    })
    let workerId, cancelled
    const search = load('packages/shared/app/modules/resources/musicSearch.ts', {
      '../resources/shared': { services: { extensionSerive: {
        resourceAction: (_action, _params, id) => { workerId = id; return new Promise(() => {}) },
        cancelResourceAction: id => { cancelled = id },
      } } },
      './sourceHealth': health, './utils': { buildExtSourceId: (a, b) => `${a}:${b}` },
      '@any-listen/common/constants': { SINGERS_RXP: /[、,]/ },
    })
    await assert.rejects(search.musicSearch({ extensionId: 'ext', source: 'slow', name: 'A', page: 1 }), /timed out/)
    assert.equal(cancelled, workerId)
  })
  await check('preload sends requestKey, cancelRequest and removes custom signal listener', async () => {
    const sent = [], cancels = []
    const pending = []
    const preload = load('packages/shared/extension-preload/src/apis/request.ts', {
      '@/host/state': { hostContext: { hostFuncs: {
        request: (url, opts) => { sent.push({ url, opts }); return new Promise((resolve, reject) => pending.push({ resolve, reject })) },
        cancelRequest: key => { cancels.push(key) },
      } } },
      '@/utils': { generateId: (() => { let n = 0; return () => `key-${++n}` })() },
    })
    class Signal {
      aborted = false
      listeners = []
      once(_event, handler) {
        const wrapper = () => { this.off('abort', wrapper); handler() }
        this.listeners.push(wrapper)
        return () => this.off('abort', wrapper)
      }
      off(_event, handler) { this.listeners = this.listeners.filter(x => x !== handler) }
      emit() { for (const listener of [...this.listeners]) listener() }
      listenerCount() { return this.listeners.length }
    }
    const s1 = new Signal()
    const s2 = new Signal()
    const a = preload.request('https://fixture.invalid/a', { signal: s1 })
    const b = preload.request('https://fixture.invalid/b', { signal: s2 })
    assert.deepEqual(sent.map(x => x.opts.requestKey), ['key-1', 'key-2'])
    s1.aborted = true; s1.emit('abort'); await assert.rejects(a, e => e.name === 'AbortError')
    assert.deepEqual(cancels, ['key-1']); assert.equal(s1.listenerCount('abort'), 0)
    pending[1].resolve({ body: 'ok' }); assert.equal((await b).body, 'ok')
    assert.equal(s2.listenerCount('abort'), 0)
    pending[0].resolve({ body: 'late' }); await tick()
  })
}
main().catch(e => { failed++; console.error(`FATAL ${e.stack || e}`) }).finally(() => {
  console.log(`RESULT ${passed} passed, ${failed} failed; root=${root}`); process.exitCode = failed ? 1 : 0
})
