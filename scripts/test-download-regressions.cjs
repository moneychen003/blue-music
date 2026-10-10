#!/opt/homebrew/bin/node
/* Isolated regression fixtures. Usage: node scripts/test-download-regressions.cjs [repo root].
 * --state-only limits the run to state-machine fixtures (useful for baseline comparison).
 * All HTTP endpoints bind 127.0.0.1 and all disk writes go to a disposable mkdtemp. */
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const vm = require('node:vm')
const http = require('node:http')
const assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'))
const { transformSync } = createRequire(path.join(root, 'packages/shared/scripts/package.json'))('esbuild')
const code = p => transformSync(fs.readFileSync(path.join(root, p), 'utf8'), { loader: 'ts', format: 'cjs' }).code
const tick = () => new Promise(r => setImmediate(r))
const song = i => ({ id: `fixture-${i}`, isLocal: false, name: `Fixture ${i}`, singer: 'Fixture', meta: { source: 'mock' } })
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jide-download-regression-'))
let passed = 0, failed = 0
async function check(name, fn) {
  try { await fn(); console.log(`PASS ${name}`); passed++ }
  catch (e) { console.error(`FAIL ${name}: ${e.stack || e}`); failed++ }
}
function fixture() {
  let items = []
  const urls = [], downloads = []
  const db = {
    getDownloadList: async () => items,
    downloadInfoSave: xs => { items.push(...xs) },
    downloadInfoUpdate: () => {},
    downloadInfoRemove: ids => { items = items.filter(x => !ids.includes(x.id)) },
    downloadInfoClear: () => { items = [] },
  }
  const mocks = {
    '../worker': { workers: { dbService: db } },
    '../resources/musicUrl': { getMusicUrl: () => new Promise((resolve, reject) => urls.push({ resolve, reject })) },
    '@any-listen/nodejs/download': { createDownload: opts => { downloads.push(opts); return { stop: async () => {} } } },
    '@any-listen/common/tools': { buildMusicName: (_f, n, s) => `${n}-${s}`, getFileType: () => 'mp3' },
    '@any-listen/common/utils': { filterFileName: s => s },
  }
  const m = { exports: {} }
  vm.runInNewContext(code('packages/shared/app/modules/downloadList/index.ts'), {
    module: m, exports: m.exports, require: id => mocks[id] || require(id), console, process, AbortController,
  })
  return { ...m.exports, urls, downloads, items: () => items, db }
}
async function start(f, i, q = '320k') { const id = await f.startDownloadMusic(song(i), q, tmp, 'fixture', 'bottom'); await tick(); return id }
async function stateTests() {
  await check('D1 pause during URL releases all slots', async () => {
    const f = fixture(); const ids = []
    for (let i = 0; i < 3; i++) ids.push(await start(f, i))
    for (const id of ids) await f.pauseDownload(id)
    await start(f, 4)
    assert.equal(f.urls.length, 4)
    assert.equal(f.items().at(-1).status, 'run')
    f.urls.slice(0, 3).forEach(x => x.resolve({ url: 'https://fixture.invalid/stale' }))
    await tick(); assert.equal(f.downloads.length, 0)
  })
  await check('D2 removed queued task never resolves URL', async () => {
    const f = fixture(); for (let i = 0; i < 3; i++) await start(f, i)
    const id = await start(f, 3)
    await f.removeDownloadList([id]); f.urls[0].resolve({ url: 'https://fixture.invalid/a' }); await tick()
    f.downloads[0].onCompleted(); await tick()
    assert.equal(f.urls.length, 3)
    assert(!f.items().some(x => x.id === id))
  })
  await check('D3 old URL generation cannot revive after resume', async () => {
    const f = fixture(); const id = await start(f, 0)
    await start(f, 1); await start(f, 2); await start(f, 3)
    await f.pauseDownload(id); await f.resumeDownload(id); await tick()
    f.urls[0].resolve({ url: 'https://fixture.invalid/old' }); await tick()
    assert.equal(f.downloads.length, 0)
    assert.equal(f.items()[0].status, 'waiting')
  })
  await check('D4 quality-specific target and part paths', async () => {
    const f = fixture(); await start(f, 7, '128k'); await start(f, 7, '320k')
    f.urls.forEach(x => x.resolve({ url: 'https://fixture.invalid/a' })); await tick()
    assert.equal(f.downloads.length, 2)
    assert.equal(f.downloads[0].verifyAudio, true); assert.equal(f.downloads[1].verifyAudio, true)
    assert.notEqual(f.downloads[0].path, f.downloads[1].path)
    assert.match(f.downloads[0].path, /128k/); assert.match(f.downloads[1].path, /320k/)
  })
  await check('pause cancel clear remove release slots idempotently', async () => {
    const f = fixture(); const ids = []
    for (let i = 0; i < 4; i++) ids.push(await start(f, i))
    await f.pauseDownload(ids[0]); await f.pauseDownload(ids[0]); await tick()
    assert.equal(f.urls.length, 4)
    await f.cancelDownload(ids[1]); await f.cancelDownload(ids[1]); await f.removeDownloadList([ids[2]])
    await start(f, 5); await tick(); assert.equal(f.items().at(-1).status, 'run')
    await f.clearDownloadList(); assert.equal(f.items().length, 0)
    await start(f, 6); assert.equal(f.items().at(-1).status, 'run')
    f.urls.forEach(x => x.resolve({ url: 'https://fixture.invalid/stale' })); await tick()
    assert.equal(f.downloads.length, 1)
  })
  await check('late downloader completion after remove cannot double-release slot', async () => {
    const f = fixture(); const ids = []
    for (let i = 0; i < 5; i++) ids.push(await start(f, i))
    f.urls.slice(0, 3).forEach(x => x.resolve({ url: 'https://fixture.invalid/audio' }))
    await tick(); assert.equal(f.downloads.length, 3)
    await f.removeDownloadList([ids[0]]); await tick()
    assert.equal(f.urls.length, 4)
    f.downloads[0].onCompleted(); await tick()
    assert.equal(f.urls.length, 4)
    f.downloads[1].onCompleted(); await tick()
    assert.equal(f.urls.length, 5)
  })
  await check('cancel deletes only its part and preserves existing final', async () => {
    const f = fixture(); const id = await start(f, 24)
    const target = f.items()[0].metadata.filePath
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(`${target}.part`, 'partial')
    fs.writeFileSync(target, 'existing final')
    await f.cancelDownload(id)
    assert(!fs.existsSync(`${target}.part`))
    assert.equal(fs.readFileSync(target, 'utf8'), 'existing final')
    assert.equal(f.items().length, 0)
  })
  await check('clear does not start queued URL requests while stopping', async () => {
    const f = fixture(); for (let i = 0; i < 4; i++) await start(f, i)
    assert.equal(f.urls.length, 3)
    await f.clearDownloadList(); await tick()
    assert.equal(f.urls.length, 3)
    assert.equal(f.items().length, 0)
  })
  await check('stale URL rejection cannot overwrite newer generation', async () => {
    const f = fixture(); const id = await start(f, 0)
    await f.pauseDownload(id); await f.resumeDownload(id); await tick()
    f.urls[0].reject(new Error('obsolete')); await tick()
    assert.notEqual(f.items()[0].status, 'error')
    f.urls[1].resolve({ url: 'https://fixture.invalid/new' }); await tick()
    assert.equal(f.downloads.length, 1)
  })
  await check('restart converts unowned run/waiting to resumable pause', async () => {
    const f = fixture()
    f.db.downloadInfoSave([{ id: 'orphan', isComplate: false, status: 'run', speed: '1', metadata: { quality: '320k' } },
      { id: 'queued', isComplate: false, status: 'waiting', speed: '', metadata: { quality: '320k' } }])
    await f.getDownloadList(); assert.deepEqual(f.items().map(x => x.status), ['pause', 'pause'])
    await f.resumeDownload('orphan'); await tick(); assert.equal(f.urls.length, 1)
  })
  await check('restart rejects unverified completed record without deleting final', async () => {
    const f = fixture(); const target = path.join(tmp, 'restart-unverified.mp3')
    fs.writeFileSync(target, 'short')
    f.db.downloadInfoSave([{ id: 'bad-completed', isComplate: true, status: 'completed', total: 999,
      speed: '', metadata: { quality: '320k', filePath: target } }])
    await f.getDownloadList()
    assert.equal(f.items()[0].isComplate, false)
    assert.equal(f.items()[0].status, 'error')
    assert.equal(fs.readFileSync(target, 'utf8'), 'short')
  })
  await check('existing unverified final is not completion evidence', async () => {
    const f = fixture(); const final = path.join(tmp, 'Fixture', 'Fixture 31-Fixture [320k].mp3')
    fs.mkdirSync(path.dirname(final), { recursive: true }); fs.writeFileSync(final, ''); fs.writeFileSync(path.join(tmp, 'Fixture', 'Fixture 31-Fixture.mp3'), '')
    await start(f, 31)
    assert.equal(f.urls.length, 1)
    assert.equal(f.items().length, 1)
  })
}
function loadDownloader() {
  const status = Object.fromEntries(['idle','init','running','paused','stopped','completed','error','failed'].map(x => [x, x.toUpperCase()]))
  const base = 'packages/shared/nodejs/download/'
  const rmod = { exports: {} }
  vm.runInNewContext(code(base + 'request.ts'), { module: rmod, exports: rmod.exports, require, console, setTimeout, clearTimeout, URL })
  const mod = { exports: {} }
  vm.runInNewContext(code(base + 'Downloader.ts'), {
    module: mod, exports: mod.exports,
    require: id => id === './request' ? rmod.exports : id === './util' ? { STATUS: status } : require(id),
    console, setTimeout, clearTimeout, URL, Buffer,
  })
  return mod.exports.default
}
async function server(handler) {
  const s = http.createServer(handler)
  await new Promise(r => s.listen(0, '127.0.0.1', r))
  return { url: `http://127.0.0.1:${s.address().port}/file`, close: () => new Promise(r => s.close(r)) }
}
async function result(Task, url, target, stopSoon = false, options = {}) {
  const t = new Task(url, target, { timeout: 2000, ...options })
  const events = []
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No terminal download event')), 2500)
    const done = () => { clearTimeout(timer); resolve() }
    t.on('completed', () => { events.push('completed'); done() })
      .on('error', e => { events.push(`error:${e.message}`); done() })
      .on('stop', done)
    if (stopSoon) t.on('response', () => setImmediate(() => { void t.stop() }))
    void t.start().catch(reject)
  })
  return events
}

async function transportTests() {
  const Task = loadDownloader()
  const body = Buffer.from('fixture audio bytes abcdefghijklmnopqrstuvwxyz')
  await check('atomic completion keeps final hidden until verified rename', async () => {
    let release; const gate = new Promise(r => { release = r })
    const srv = await server(async (_req, res) => { res.writeHead(200, { 'Content-Length': body.length }); res.write(body.subarray(0, 8)); await gate; res.end(body.subarray(8)) })
    try {
      const target = path.join(tmp, 'atomic.mp3'); const promise = result(Task, srv.url, target)
      await new Promise(r => setTimeout(r, 50))
      assert(!fs.existsSync(target)); assert(fs.existsSync(`${target}.part`))
      release(); assert.deepEqual(await promise, ['completed'])
      assert.deepEqual(fs.readFileSync(target), body); assert(!fs.existsSync(`${target}.part`))
    } finally { release(); await srv.close() }
  })
  await check('Range ignored with 200 replaces partial, never appends', async () => {
    const target = path.join(tmp, 'ignore.mp3'); fs.writeFileSync(`${target}.part`, body.subarray(0, 7))
    let header; const srv = await server((req, res) => { header = req.headers.range; res.writeHead(200, { 'Content-Length': body.length }); res.end(body) })
    try { assert.deepEqual(await result(Task, srv.url, target), ['completed']); assert.equal(header, 'bytes=7-'); assert.deepEqual(fs.readFileSync(target), body) }
    finally { await srv.close() }
  })
  await check('valid 206 Content-Range resumes exactly', async () => {
    const target = path.join(tmp, 'range.mp3'); fs.writeFileSync(`${target}.part`, body.subarray(0, 12))
    let header; const srv = await server((req, res) => { header = req.headers.range; const tail = body.subarray(12); res.writeHead(206, { 'Content-Length': tail.length, 'Content-Range': `bytes 12-${body.length-1}/${body.length}` }); res.end(tail) })
    try { assert.deepEqual(await result(Task, srv.url, target), ['completed']); assert.equal(header, 'bytes=12-'); assert.deepEqual(fs.readFileSync(target), body) }
    finally { await srv.close() }
  })
  await check('invalid 206 range fails without changing partial', async () => {
    const target = path.join(tmp, 'bad-range.mp3'); fs.writeFileSync(`${target}.part`, body.subarray(0, 7))
    const srv = await server((_req, res) => { res.writeHead(206, { 'Content-Length': body.length - 7, 'Content-Range': `bytes 0-${body.length-8}/${body.length}` }); res.end(body.subarray(7)) })
    try { const events = await result(Task, srv.url, target); assert.equal(events.length, 1); assert.match(events[0], /^error:/); assert.deepEqual(fs.readFileSync(`${target}.part`), body.subarray(0, 7)); assert(!fs.existsSync(target)) }
    finally { await srv.close() }
  })
  await check('416 restarts once from zero', async () => {
    const target = path.join(tmp, 'range-416.mp3'); fs.writeFileSync(`${target}.part`, body.subarray(0, 7))
    const seen = []; const srv = await server((req, res) => { seen.push(req.headers.range || 'none'); if (req.headers.range) { res.writeHead(416); res.end() } else { res.writeHead(200, { 'Content-Length': body.length }); res.end(body) } })
    try { assert.deepEqual(await result(Task, srv.url, target), ['completed']); assert.deepEqual(seen, ['bytes=7-', 'none']); assert.deepEqual(fs.readFileSync(target), body) }
    finally { await srv.close() }
  })
  await check('disconnected transfer retains part and not final', async () => {
    const target = path.join(tmp, 'disconnect.mp3')
    const srv = await server((_req, res) => { res.writeHead(200, { 'Content-Length': body.length }); res.write(body.subarray(0, 8)); setTimeout(() => res.destroy(), 20) })
    try { const events = await result(Task, srv.url, target); assert.equal(events.length, 1); assert.match(events[0], /^error:/); assert(!fs.existsSync(target)); assert(fs.existsSync(`${target}.part`)) }
    finally { await srv.close() }
  })
  await check('audio header verification accepts MP3 ID3/frame, FLAC, WAV and M4A', async () => {
    const wav = Buffer.alloc(32); wav.write('RIFF', 0); wav.writeUInt32LE(24, 4); wav.write('WAVE', 8)
    const m4a = Buffer.alloc(32); m4a.writeUInt32BE(24, 0); m4a.write('ftyp', 4); m4a.write('M4A ', 8); m4a.write('isom', 16)
    const fixtures = [
      ['id3.mp3', Buffer.concat([Buffer.from('ID3\x04\x00\x00'), Buffer.alloc(26)])],
      ['frame.mp3', Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(28)])],
      ['music.flac', Buffer.concat([Buffer.from('fLaC'), Buffer.alloc(28)])],
      ['music.wav', wav], ['music.m4a', m4a],
    ]
    for (const [name, bytes] of fixtures) {
      const target = path.join(tmp, name)
      const srv = await server((_req, res) => { res.writeHead(200, { 'Content-Length': bytes.length }); res.end(bytes) })
      try { assert.deepEqual(await result(Task, srv.url, target, false, { verifyAudio: true }), ['completed']); assert.deepEqual(fs.readFileSync(target), bytes) }
      finally { await srv.close() }
    }
  })
  await check('fake HTML and JSON audio are rejected without publishing final', async () => {
    for (const [name, bytes] of [['html', Buffer.from('<html>not audio</html>')], ['json', Buffer.from('{"error":"not audio"}')]]) {
      const target = path.join(tmp, `${name}-fake.mp3`)
      const srv = await server((_req, res) => { res.writeHead(200, { 'Content-Length': bytes.length }); res.end(bytes) })
      try { const events = await result(Task, srv.url, target, false, { verifyAudio: true }); assert.match(events[0], /^error:Downloaded file is not/); assert(!fs.existsSync(target)); assert.deepEqual(fs.readFileSync(`${target}.part`), bytes) }
      finally { await srv.close() }
    }
  })
  await check('audio container and final extension mismatch is rejected', async () => {
    const target = path.join(tmp, 'mismatch.mp3'); const bytes = Buffer.concat([Buffer.from('fLaC'), Buffer.alloc(28)])
    const srv = await server((_req, res) => { res.writeHead(200, { 'Content-Length': bytes.length }); res.end(bytes) })
    try { const events = await result(Task, srv.url, target, false, { verifyAudio: true }); assert.match(events[0], /flac does not match \.mp3/); assert(!fs.existsSync(target)); assert.deepEqual(fs.readFileSync(`${target}.part`), bytes) }
    finally { await srv.close() }
  })
  await check('createDownload wrapper propagates real connection reset to onError', async () => {
    const wrapper = { exports: {} }
    vm.runInNewContext(code('packages/shared/nodejs/download/index.ts'), {
      module: wrapper, exports: wrapper.exports,
      require: id => id === './Downloader' ? { __esModule: true, default: Task } :
        id === './util' ? { getRequestAgent: () => undefined } :
        id === '@any-listen/common/utils' ? { sizeFormate: n => `${n}B` } : require(id),
      console, setTimeout, clearTimeout,
    })
    const target = path.join(tmp, 'wrapper-reset.mp3')
    const srv = await server((_req, res) => { res.writeHead(200, { 'Content-Length': 100 }); res.write('short'); setTimeout(() => res.destroy(), 20) })
    try {
      const error = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('onError never called; slot would leak')), 1000)
        wrapper.exports.createDownload({ url: srv.url, path: target,
          onError: e => { clearTimeout(timer); resolve(e) },
          onCompleted: () => { clearTimeout(timer); reject(new Error('incomplete transfer completed')) },
        })
      })
      assert(error instanceof Error); assert(!fs.existsSync(target)); assert(fs.existsSync(`${target}.part`))
    } finally { await srv.close() }
  })
  await check('stop leaves resumable part and no completion', async () => {
    const target = path.join(tmp, 'stop.mp3')
    const srv = await server((_req, res) => { res.writeHead(200, { 'Content-Length': body.length }); res.write(body.subarray(0, 8)); setTimeout(() => { if (!res.destroyed) res.end(body.subarray(8)) }, 500) })
    try { const events = await result(Task, srv.url, target, true); assert.deepEqual(events, []); assert(!fs.existsSync(target)); assert(fs.existsSync(`${target}.part`)) }
    finally { await srv.close() }
  })
}
;(async () => {
  try { await stateTests(); if (!process.argv.includes('--state-only')) await transportTests() }
  catch (e) { console.error(`FATAL ${e.stack || e}`); failed++ }
  finally { fs.rmSync(tmp, { recursive: true, force: true }); console.log(`RESULT ${passed} passed, ${failed} failed; root=${root}`); process.exitCode = failed ? 1 : 0 }
})()
