/* global process, console */
// Compile the real Svelte components and exercise them in a hidden Electron window.
// Usage: node scripts/test-ui-regressions.cjs REPO_ROOT RUN_DIR
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const { spawnSync } = require('node:child_process')

const root = path.resolve(process.argv[2] || '')
const runDir = path.resolve(process.argv[3] || '')
if (!process.argv[2] || !process.argv[3]) throw Error('Usage: test-ui-regressions.cjs REPO_ROOT RUN_DIR')
const viewDir = path.join(root, 'packages/view-main')
const req = createRequire(path.join(viewDir, 'package.json'))
const { compile } = req('svelte/compiler')
const { build } = createRequire(path.join(root, 'packages/shared/scripts/package.json'))('esbuild')
fs.mkdirSync(runDir, { recursive: true })

const stateSource = `
import { writable } from 'svelte/store'
export const musicInfo = writable({ id: 'track-a', collect: false })
export const playerState = { playMusicInfo: { musicInfo: { id: 'track-a' } } }
export const counters = { add: 0, remove: 0, sync: 0, async: 0 }
export const toasts = []
export const sourceChanges = []
export const flags = { collectReject: false, uncollectReject: false, syncReject: true, asyncReject: true }
let gate = null
export function holdWrite() { let release; gate = new Promise(resolve => { release = resolve }); return () => { release(); gate = null } }
export function setTrack(id, collect) { playerState.playMusicInfo = id ? { musicInfo: { id } } : null; musicInfo.set({ id, collect }) }
export function setCollectStatus(collect) { musicInfo.update(s => ({ ...s, collect })) }
export async function collectMusic(music) { counters.add++; if (flags.collectReject) { flags.collectReject = false; throw Error('collect reject') }; if (gate) await gate; return true }
export async function uncollectMusic(music) { counters.remove++; if (flags.uncollectReject) { flags.uncollectReject = false; throw Error('uncollect reject') }; if (gate) await gate; return false }
export function showNotify(message) { toasts.push(message) }
export function syncAction() { counters.sync++; if (flags.syncReject) { flags.syncReject = false; throw Error('sync reject') } }
export async function asyncAction() { counters.async++; if (flags.asyncReject) { flags.asyncReject = false; throw Error('async reject') } }
export function recordSource(source) { sourceChanges.push(source.sId) }
`
const i18nSource = `
import { writable } from 'svelte/store'
export const t = writable(key => key === 'player__collect' ? '收藏' : '取消收藏')
export const extT = writable((_id, name) => name)
`
const harnessSource = `<script lang="ts">
  import Source from '${path.join(viewDir, 'src/views/Online/Source.svelte')}'
  import Btn from '@/components/base/Btn.svelte'
  import { syncAction, asyncAction, recordSource } from '@fixture/state'
  let active = $state('s2')
  const list = [1, 2, 3, 4, 5].map(n => ({ sId: 's' + n, extensionId: 'ext', name: '音源' + n }))
  const change = (source: (typeof list)[number]) => { active = source.sId; recordSource(source) }
</script>
<div id="source-host"><Source {list} {active} onchange={change} /></div>
<div id="btn-host"><Btn onclick={syncAction}>同步动作</Btn><Btn onclick={asyncAction}>异步动作</Btn></div>`
const fixtureSources = { '@fixture/state': stateSource, '@fixture/i18n': i18nSource, '@fixture/harness': harnessSource }
const plugin = { name: 'actual-svelte-fixture', setup(builder) {
  builder.onResolve({ filter: /^@\// }, args => {
    if (args.path.endsWith('/base/Btn.svelte')) return { path: path.join(viewDir, 'src/components/base/Btn.svelte') }
    if (args.path.includes('/modules/player/reactive.svelte') || args.path.includes('/modules/player/store/state') || args.path.includes('/modules/player/store/playerActions') || args.path.includes('/components/apis/notify')) return { path: '@fixture/state', namespace: 'fixture' }
    if (args.path.includes('/plugins/i18n') || args.path.includes('/modules/extension/i18n')) return { path: '@fixture/i18n', namespace: 'fixture' }
    throw Error(`Unexpected application import: ${args.path}`)
  })
  builder.onResolve({ filter: /^@fixture\// }, args => ({ path: args.path, namespace: 'fixture' }))
  builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => {
    const source = fixtureSources[args.path]
    if (!source) throw Error(`Unknown fixture module ${args.path}`)
    return args.path.endsWith('/harness')
      ? { contents: compile(source, { filename: 'Harness.svelte', generate: 'client', css: 'external' }).js.code, loader: 'js', resolveDir: viewDir }
      : { contents: source, loader: 'js', resolveDir: viewDir }
  })
  builder.onLoad({ filter: /\.svelte$/ }, args => ({
    contents: compile(fs.readFileSync(args.path, 'utf8').replace(/<style[\s\S]*?<\/style>/g, ''), { filename: args.path, generate: 'client', css: 'external' }).js.code,
    loader: 'js', resolveDir: viewDir,
  }))
} }

const entry = `
import { mount, flushSync, tick } from 'svelte'
import CollectBtn from ${JSON.stringify(path.join(viewDir, 'src/components/common/CollectBtn.svelte'))}
import Harness from '@fixture/harness'
import { musicInfo, playerState, counters, toasts, sourceChanges, flags, holdWrite, setTrack } from '@fixture/state'
window.unhandled = []
window.errors = []
window.addEventListener('unhandledrejection', event => { window.unhandled.push(String(event.reason)); event.preventDefault() })
window.addEventListener('error', event => { window.errors.push(String(event.message)); event.preventDefault() })
window.fixtureDone = (async () => {
  mount(CollectBtn, { target: document.querySelector('#collect-host') })
  mount(Harness, { target: document.querySelector('#harness-host') })
  flushSync()
  const settle = async () => { await tick(); await new Promise(r => setTimeout(r, 0)); flushSync() }
  const collectButton = () => document.querySelector('#collect-host button')
  const snap = label => ({ label, disabled: collectButton().disabled, fill: collectButton().querySelector('path')?.getAttribute('fill') ?? null, pressed: collectButton().getAttribute('aria-pressed'), busy: collectButton().getAttribute('aria-busy'), aria: collectButton().getAttribute('aria-label'), toastCount: toasts.length, add: counters.add, remove: counters.remove })
  const rows = []
  rows.push(snap('empty'))
  setTrack('track-a', true); flushSync(); rows.push(snap('filled'))
  setTrack('track-a', false); flushSync(); rows.push(snap('empty-again'))
  setTrack('', false); flushSync(); rows.push(snap('no-track'))
  setTrack('track-a', false); flushSync()
  let release = holdWrite(); collectButton().click(); flushSync(); rows.push(snap('collect-pending'))
  collectButton().click(); rows.push(snap('double-click-blocked'))
  release(); await settle(); rows.push(snap('collect-success'))
  collectButton().click(); await settle(); rows.push(snap('uncollect-success'))
  flags.collectReject = true; collectButton().click(); await settle(); rows.push(snap('collect-rejected'))
  setTrack('track-a', true); flushSync(); flags.uncollectReject = true; collectButton().click(); await settle(); rows.push(snap('uncollect-rejected'))
  setTrack('track-a', false); flushSync(); release = holdWrite(); collectButton().click(); flushSync(); setTrack('track-b', false); flushSync(); release(); await settle(); rows.push(snap('track-switched'))
  const btns = [...document.querySelectorAll('#btn-host button')]
  btns[0].click(); await settle(); const syncRejected = { alerts: btns[0].querySelectorAll('[role=alert]').length, title: btns[0].title }
  btns[0].click(); await settle(); const syncRetry = { alerts: btns[0].querySelectorAll('[role=alert]').length, title: btns[0].title }
  btns[1].click(); await settle(); const asyncRejected = { alerts: btns[1].querySelectorAll('[role=alert]').length, title: btns[1].title }
  btns[1].click(); await settle(); const asyncRetry = { alerts: btns[1].querySelectorAll('[role=alert]').length, title: btns[1].title }
  const sourceButtons = () => [...document.querySelectorAll('#source-host button')]
  const sourceInitial = { buttonCount: sourceButtons().length, pressed: sourceButtons().map(b => b.getAttribute('aria-pressed')), optionCount: document.querySelectorAll('#source-host option').length }
  if (sourceButtons()[2]) sourceButtons()[2].click(); await settle(); const sourceThird = { changes: [...sourceChanges], pressed: sourceButtons().map(b => b.getAttribute('aria-pressed')) }
  const select = document.querySelector('#source-host select'); if (select) { select.value = 's5'; select.dispatchEvent(new Event('change', { bubbles: true })) }; await settle()
  const sourceFifth = { changes: [...sourceChanges], pressed: sourceButtons().map(b => b.getAttribute('aria-pressed')), selected: select?.value ?? null }
  return { rows, counters, toasts, unhandled: window.unhandled, errors: window.errors, syncRejected, syncRetry, asyncRejected, asyncRetry, sourceInitial, sourceThird, sourceFifth }
})()
`

async function main() {
  await build({ stdin: { contents: entry, resolveDir: viewDir, sourcefile: 'ui-regression-entry.js' }, bundle: true, format: 'iife', platform: 'browser', conditions: ['browser'], outfile: path.join(runDir, 'bundle.js'), plugins: [plugin], define: { 'process.env.NODE_ENV': '"production"' } })
  fs.writeFileSync(path.join(runDir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>UI regression fixture</title><style>body{font:16px system-ui;padding:30px;background:#f8f9fb;color:#263449}#collect-host{padding:15px}.btn{padding:8px 12px;margin-right:8px;border:1px solid #ccd;border-radius:7px;background:white;color:inherit}.btn:disabled{opacity:.5}.icon.active{color:#cf3858}.icon svg{width:36px;height:36px}#source-host{margin:18px 0}.source-list{display:flex;gap:8px;align-items:center}.source-list button{padding:8px;background:white;border:1px solid #ccd;border-radius:7px}.source-list button.active{border-color:#2f77d2;color:#2f77d2}.source-list label{display:flex;gap:5px}.action-error{font-size:11px;color:#b33}</style><h1>收藏与音源回归夹具</h1><div id="collect-host"></div><div id="harness-host"></div><script src="bundle.js"></script>`)
  const runner = `const { app, BrowserWindow } = require('electron'); const fs = require('node:fs'); app.setPath('userData', ${JSON.stringify(path.join(runDir, 'userData'))}); app.whenReady().then(async () => { const win = new BrowserWindow({ show: false, width: 950, height: 420, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } }); await win.loadFile(${JSON.stringify(path.join(runDir, 'index.html'))}); const result = await win.webContents.executeJavaScript('window.fixtureDone'); fs.writeFileSync(${JSON.stringify(path.join(runDir, 'result.json'))}, JSON.stringify(result, null, 2)); fs.writeFileSync(${JSON.stringify(path.join(runDir, 'screenshot.png'))}, (await win.webContents.capturePage()).toPNG()); app.exit(0) }).catch(error => { console.error(error); app.exit(2) });`
  fs.writeFileSync(path.join(runDir, 'runner.cjs'), runner)
  const electron = path.join(root, 'node_modules/.pnpm/electron@40.10.2/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const child = spawnSync(electron, [path.join(runDir, 'runner.cjs')], { env, encoding: 'utf8', timeout: 45000, killSignal: 'SIGKILL' })
  fs.writeFileSync(path.join(runDir, 'electron.stdout.log'), child.stdout || '')
  fs.writeFileSync(path.join(runDir, 'electron.stderr.log'), child.stderr || '')
  fs.writeFileSync(path.join(runDir, 'electron.exit.json'), JSON.stringify({ status: child.status, signal: child.signal, error: child.error?.message ?? null }, null, 2))
  if (child.status !== 0) throw Error(`Electron fixture failed: exit=${child.status} signal=${child.signal} error=${child.error?.message || ''}; ${child.stderr}`)
  const result = JSON.parse(fs.readFileSync(path.join(runDir, 'result.json'), 'utf8'))
  const row = name => { const item = result.rows.find(r => r.label === name); assert.ok(item, name); return item }
  assert.deepEqual(['empty', 'filled', 'empty-again'].map(n => row(n).fill), ['none', 'currentColor', 'none'])
  assert.deepEqual(['empty', 'filled', 'empty-again'].map(n => row(n).pressed), ['false', 'true', 'false'])
  assert.equal(row('no-track').disabled, true)
  assert.equal(row('collect-pending').disabled, true)
  assert.equal(row('collect-pending').busy, 'true')
  assert.equal(row('double-click-blocked').add, row('collect-pending').add)
  assert.equal(row('collect-success').pressed, 'true')
  assert.equal(row('uncollect-success').pressed, 'false')
  assert.equal(row('collect-rejected').pressed, 'false')
  assert.ok(row('collect-rejected').toastCount > row('uncollect-success').toastCount)
  assert.equal(row('uncollect-rejected').pressed, 'true')
  assert.ok(row('uncollect-rejected').toastCount > row('collect-rejected').toastCount)
  assert.equal(row('track-switched').pressed, 'false')
  assert.equal(result.syncRejected.alerts, 1); assert.equal(result.syncRetry.alerts, 0)
  assert.equal(result.asyncRejected.alerts, 1); assert.equal(result.asyncRetry.alerts, 0)
  assert.equal(result.unhandled.length, 0)
  assert.equal(result.errors.length, 0)
  assert.equal(result.sourceInitial.buttonCount, 3)
  assert.equal(result.sourceInitial.optionCount, 5)
  assert.deepEqual(result.sourceInitial.pressed, ['false', 'true', 'false'])
  assert.deepEqual(result.sourceThird.changes, ['s3'])
  assert.deepEqual(result.sourceThird.pressed, ['false', 'false', 'true'])
  assert.deepEqual(result.sourceFifth.changes, ['s3', 's5'])
  assert.equal(result.sourceFifth.selected, 's5')
  console.log(JSON.stringify({ status: 'PASS', root, runDir, cases: result.rows.map(r => r.label), screenshot: path.join(runDir, 'screenshot.png'), electronExit: child.status, unhandled: result.unhandled.length }, null, 2))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
