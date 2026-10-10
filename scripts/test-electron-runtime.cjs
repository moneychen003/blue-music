#!/usr/bin/env node
'use strict'

// Native, isolated Electron acceptance against built candidate output.
// Usage: /opt/homebrew/bin/node scripts/test-electron-runtime.cjs [--repo=/absolute/path]
// It never installs or launches the user's application, changes protocol defaults,
// or reads the user's app data. A temporary native-module symlink is removed.
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const http = require('node:http')
const { spawnSync } = require('node:child_process')

const root = path.resolve((process.argv.find((arg) => arg.startsWith('--repo=')) ?? '').slice(7) || path.join(__dirname, '..'))
const built = path.join(root, 'packages/desktop/dist/electron')
const nativeDir = path.join(built, 'native')
const nativeLink = path.join(nativeDir, 'better_sqlite3.node')
const nativeSource = path.join(root, 'packages/desktop/build-config/tempLib/better_sqlite3.node')

if (!process.versions.electron) {
  const electron = require(require.resolve('electron', { paths: [path.join(root, 'packages/desktop')] }))
  let linked = false
  try {
    if (!fs.existsSync(nativeLink)) {
      if (!fs.existsSync(nativeSource)) throw new Error(`Missing native test dependency: ${nativeSource}`)
      fs.mkdirSync(nativeDir, { recursive: true })
      fs.symlinkSync(nativeSource, nativeLink)
      linked = true
    }
    const result = spawnSync(electron, [__filename, `--repo=${root}`], { encoding: 'utf8', timeout: 35000, maxBuffer: 2_000_000 })
    process.stdout.write(result.stdout ?? '')
    process.stderr.write(result.stderr ?? '')
    if (result.error) throw result.error
    process.exitCode = result.status ?? 1
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    if (linked) {
      fs.rmSync(nativeLink, { force: true })
      try { fs.rmdirSync(nativeDir) } catch {}
    }
  }
} else {
  const { app, BrowserWindow, MessageChannelMain } = require('electron')
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anylisten-security-runtime-'))
  app.setPath('userData', dataDir)
  app.setName('anylisten-security-preview')
  let protocolRegistrationCalls = 0
  app.setAsDefaultProtocolClient = () => { protocolRegistrationCalls++; return false }
  app.requestSingleInstanceLock = () => true
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
  const servers = []
  let finished = false
  const cleanup = () => {
    for (const server of servers) server.close()
    fs.rmSync(dataDir, { recursive: true, force: true })
  }
  const finish = (result, code) => {
    if (finished) return
    finished = true
    console.log(`RUNTIME_RESULT ${JSON.stringify(result)}`)
    for (const win of BrowserWindow.getAllWindows()) win.destroy()
    cleanup()
    app.exit(code)
  }
  setTimeout(() => finish({ error: 'native runtime timeout' }, 1), 30000)
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const makeWav = () => {
    const data = Buffer.alloc(44100 * 2)
    for (let i = 0; i < 44100; i++) data.writeInt16LE(Math.round(1000 * Math.sin(i * 2 * Math.PI * 440 / 44100)), i * 2)
    const head = Buffer.alloc(44)
    head.write('RIFF'); head.writeUInt32LE(data.length + 36, 4); head.write('WAVEfmt ', 8)
    head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22)
    head.writeUInt32LE(44100, 24); head.writeUInt32LE(88200, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34)
    head.write('data', 36); head.writeUInt32LE(data.length, 40)
    return Buffer.concat([head, data])
  }
  const wavBytes = makeWav()
  const wavPath = path.join(dataDir, 'fixture.wav')
  fs.writeFileSync(wavPath, wavBytes)

  async function test() {
    const summary = {}
    const appMain = path.join(built, 'main.js')
    if (!fs.existsSync(appMain)) throw new Error('Built main.js missing')
    require(appMain)
    await app.whenReady()
    let win
    for (let i = 0; i < 80; i++) {
      win = BrowserWindow.getAllWindows().find((item) => item.webContents.getURL().includes('view-main/index.html'))
      if (win && !win.webContents.isLoading()) break
      await sleep(150)
    }
    if (!win || win.webContents.isLoading()) throw new Error('Actual app window did not load')
    let shell
    for (let i = 0; i < 35; i++) {
      shell = await win.webContents.executeJavaScript(`({rootChildren:document.getElementById('root')?.children.length ?? 0,textLength:document.body.innerText.length,ipc:typeof window.testData?.getMusicUrl,bridge:typeof window.__anylisten_desktop_lyric_bridge__?.ready,node:typeof require})`)
      if (shell.rootChildren > 0 && shell.ipc === 'function') break
      await sleep(150)
    }
    if (!(shell.rootChildren > 0 && shell.textLength > 50 && shell.ipc === 'function' && shell.bridge === 'function' && shell.node === 'undefined')) throw new Error(`App shell/IPC failed: ${JSON.stringify(shell)}`)
    summary.appShell = { rootChildren: shell.rootChildren, textLength: shell.textLength, ipc: true, nodeUnavailable: true }
    const prefs = win.webContents.getLastWebPreferences()
    for (const [key, value] of Object.entries({ sandbox: true, contextIsolation: true, webSecurity: true, nodeIntegration: false })) if (prefs[key] !== value) throw new Error(`Actual ${key} preference is ${prefs[key]}`)
    if (prefs.nodeIntegrationInWorker === true) throw new Error('Actual nodeIntegrationInWorker is enabled')
    summary.securePreferences = true
    if (protocolRegistrationCalls !== 0) throw new Error('Preview attempted to take over the anylisten URL scheme')
    summary.previewProtocolGuard = true
    win.hide()
    const timer = await win.webContents.executeJavaScript(`new Promise(resolve=>{const started=performance.now();window.__anylisten_node_env__.setTimeout(()=>resolve(performance.now()-started),60)})`)
    if (timer > 1000) throw new Error(`Hidden-window background timer was throttled: ${timer}ms`)
    summary.hiddenWindowTimerMs = Math.round(timer)
    win.show()

    const viewFiles = fs.readdirSync(path.join(root, 'packages/desktop/dist/view-main'))
    const workerFile = viewFiles.find((name) => /^main\.worker.*\.js$/.test(name))
    const workletFile = viewFiles.find((name) => /^phase-vocoder[A-Za-z0-9]+\.js$/.test(name))
    if (!workerFile || !workletFile) throw new Error('Built worker or worklet missing')
    const workerUrl = `file://${path.join(root, 'packages/desktop/dist/view-main', workerFile)}`
    const workletUrl = `file://${path.join(root, 'packages/desktop/dist/view-main', workletFile)}`
    const workerResult = await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{const worker=new Worker(${JSON.stringify(workerUrl)},{type:'module'});const timer=setTimeout(()=>reject(new Error('worker timeout')),4000);worker.onmessage=e=>{if(e.data[1]!=='smoke')return;clearTimeout(timer);worker.terminate();e.data[2]?reject(new Error(e.data[2].message)):resolve(e.data[3])};worker.onerror=e=>{clearTimeout(timer);reject(new Error(e.message))};worker.postMessage([0,'smoke',['parseMarkdown'],['**ok**'],[]])})`)
    if (!workerResult.includes('<strong>ok</strong>')) throw new Error(`Worker did not parse Markdown: ${workerResult}`)
    summary.moduleWorker = true
    const workletResult = await win.webContents.executeJavaScript(`(async()=>{const ctx=new AudioContext();await ctx.audioWorklet.addModule(${JSON.stringify(workletUrl)});const node=new AudioWorkletNode(ctx,'phase-vocoder-processor');node.disconnect();await ctx.close();return true})()`)
    if (!workletResult) throw new Error('AudioWorklet did not instantiate')
    summary.audioWorklet = true

    const forged = await win.webContents.executeJavaScript(`window.testData.getMusicUrl({musicInfo:{isLocal:true,id:'forged',name:'forged',singer:'test',meta:{filePath:${JSON.stringify(wavPath)}}}}).then(()=>false,()=>true)`)
    if (!forged) throw new Error('Forged local MusicInfo without main-process record was accepted')
    const imported = await win.webContents.executeJavaScript(`(async()=>{const infos=await window.testData.createLocalMusicInfos([${JSON.stringify(wavPath)}]);if(infos.length!==1)throw new Error('Local WAV metadata import failed');await window.testData.listAction({action:'list_music_add',data:{id:'default',musicInfos:infos,addMusicLocationType:'top'}});return infos[0]})()`)
    const otherPath = path.join(dataDir, 'different.wav')
    const linkedPath = path.join(dataDir, 'linked.wav')
    fs.writeFileSync(otherPath, wavBytes)
    fs.symlinkSync(otherPath, linkedPath)
    const replaced = await win.webContents.executeJavaScript(`window.testData.getMusicUrl({musicInfo:{...${JSON.stringify(imported)},meta:{...${JSON.stringify(imported.meta)},filePath:${JSON.stringify(otherPath)}}}}).then(()=>false,()=>true)`)
    const symlinked = await win.webContents.executeJavaScript(`window.testData.getMusicUrl({musicInfo:{...${JSON.stringify(imported)},meta:{...${JSON.stringify(imported.meta)},filePath:${JSON.stringify(linkedPath)}}}}).then(()=>false,()=>true)`)
    if (!replaced || !symlinked) throw new Error('Local ID/path replacement or symlink bypass was accepted')
    const localInfo = await win.webContents.executeJavaScript(`window.testData.getMusicUrl({musicInfo:${JSON.stringify(imported)}})`)
    if (!/^http:\/\/127\.0\.0\.1:\d+\/audio\/[a-f0-9]{48}$/.test(localInfo.url)) throw new Error('Local audio was not tokenized')
    summary.localCapability = { forgedRejected: true, replacedPathRejected: true, symlinkBypassRejected: true, importedAccepted: true }
    const play = async (url) => win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{const audio=new Audio();audio.crossOrigin='anonymous';const timer=setTimeout(()=>reject(new Error('audio timeout')),5000);audio.onplaying=()=>{clearTimeout(timer);resolve({played:true,duration:audio.duration});audio.pause()};audio.onerror=()=>{clearTimeout(timer);reject(new Error('audio error '+audio.error?.code))};audio.src=${JSON.stringify(url)};audio.play().catch(reject)})`)
    const localPlay = await play(localInfo.url)
    if (!localPlay.played || localPlay.duration < 0.9) throw new Error('Local audio playback failed')
    summary.localAudio = true

    // Exercise the exact token proxy source over a no-CORS remote fixture server.
    const sourceServer = http.createServer((req, res) => {
      const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range ?? '')
      let start = range ? Number(range[1]) : 0
      let end = range && range[2] ? Number(range[2]) : wavBytes.length - 1
      if (start >= wavBytes.length) { res.writeHead(416, { 'Content-Range': `bytes */${wavBytes.length}` }); res.end(); return }
      end = Math.min(end, wavBytes.length - 1)
      res.writeHead(range ? 206 : 200, { 'Content-Type': 'audio/wav', 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes', ...(range ? { 'Content-Range': `bytes ${start}-${end}/${wavBytes.length}` } : {}) })
      res.end(wavBytes.subarray(start, end + 1))
    })
    servers.push(sourceServer); await listen(sourceServer)
    const sourceUrl = `http://127.0.0.1:${sourceServer.address().port}/fixture.wav`
    const vite = require(require.resolve('vite', { paths: [path.join(root, 'packages/desktop')] }))
    let { code } = await vite.transformWithOxc(fs.readFileSync(path.join(root, 'packages/desktop/src/modules/proxyServer/audioResources.ts'), 'utf8'), 'audioResources.ts')
    code = code.replace(/^import .*;$/gm, '').replace(/^export const /gm, 'const ')
    const request = (url, options) => new Promise((resolve, reject) => {
      const upstream = http.get(url, { headers: options.headers }, (response) => resolve({ statusCode: response.statusCode, headers: response.headers, body: response }))
      upstream.on('error', reject)
    })
    const resource = new Function('fs', 'fsPromises', 'path', 'randomBytes', 'MEDIA_FILE_TYPES', 'request', `${code}\nreturn { initAudioResources, registerRemoteAudioUrl, handleAudioResource };`)(fs, require('node:fs/promises'), path, require('node:crypto').randomBytes, ['mp3', 'flac', 'ogg', 'oga', 'wav', 'm4a'], request)
    const proxyServer = http.createServer((req, res) => void resource.handleAudioResource(req, res, new URL(req.url, 'http://localhost').pathname))
    servers.push(proxyServer); await listen(proxyServer)
    resource.initAudioResources(`http://127.0.0.1:${proxyServer.address().port}`, 'http://localhost:12345')
    const remoteTokenUrl = resource.registerRemoteAudioUrl(sourceUrl)
    const remotePlay = await play(remoteTokenUrl)
    if (!remotePlay.played || remotePlay.duration < 0.9) throw new Error('Remote audio proxy playback failed')
    summary.remoteAudio = true

    await win.webContents.executeJavaScript(`window.__securityPortCount=0;window.addEventListener('message',e=>{if(e.data?.source==='anylisten-preload'&&e.data?.type==='desktop-lyric-port')window.__securityPortCount++})`)
    await win.webContents.executeJavaScript(`window.testData.setSetting({'desktopLyric.enable':true})`)
    let lyric
    for (let i = 0; i < 35; i++) {
      lyric = BrowserWindow.getAllWindows().find((item) => item !== win)
      if (lyric && !lyric.webContents.isLoading()) break
      await sleep(150)
    }
    if (!lyric || lyric.webContents.isLoading()) throw new Error('Lyric window did not load')
    const mainPortCount = await win.webContents.executeJavaScript('window.__securityPortCount')
    const lyricUI = await lyric.webContents.executeJavaScript(`({root:!!document.querySelector('.desktop-lyric'),bridge:typeof window.__lyricWin?.setLock})`)
    if (mainPortCount < 1 || !lyricUI.root || lyricUI.bridge !== 'function') throw new Error('Lyric main bridge/UI failed')
    // Inject a separate port after mount and observe the component's actual callback.
    const { port1, port2 } = new MessageChannelMain()
    lyric.webContents.postMessage('desktop-lyric-port', null, [port1])
    await sleep(100)
    port2.postMessage({ action: 'set_info', data: { name: 'PORT', singer: 'TEST', lrc: '[00:00.000]Bridge OK', tlrc: null, isPlay: false, played_time: 1000 } })
    let lyricText = ''
    for (let i = 0; i < 20; i++) {
      lyricText = await lyric.webContents.executeJavaScript('document.body.innerText')
      if (lyricText.includes('Bridge OK')) break
      await sleep(100)
    }
    port2.close()
    if (!lyricText.includes('Bridge OK')) throw new Error('Lyric MessagePort callback did not update UI')
    summary.lyricPort = true
    // A second sandboxed window cannot invoke either main-window RPC or lyric controls.
    const lockBefore = await win.webContents.executeJavaScript(`window.testData.getSetting().then(s=>s['desktopLyric.isLock'])`)
    const attackerPreload = path.join(dataDir, 'attacker-preload.cjs')
    fs.writeFileSync(attackerPreload, `const {ipcRenderer}=require('electron');ipcRenderer.send('view_mainm2c',[0,'spoof',['setSetting'],[{'desktopLyric.isLock':${JSON.stringify(!lockBefore)}}],[]]);ipcRenderer.send('desktop-lyric-set-lock',${JSON.stringify(!lockBefore)});`)
    const attacker = new BrowserWindow({ show: false, webPreferences: { preload: attackerPreload, sandbox: true, contextIsolation: true, nodeIntegration: false } })
    await attacker.loadURL('data:text/html,<html><body>untrusted sender</body></html>')
    await sleep(250)
    const lockAfter = await win.webContents.executeJavaScript(`window.testData.getSetting().then(s=>s['desktopLyric.isLock'])`)
    attacker.destroy()
    if (lockAfter !== lockBefore) throw new Error('Foreign sender changed lyric lock setting')
    summary.foreignSenderRejected = true
    return summary
  }
  void test().then((summary) => finish(summary, 0)).catch((error) => finish({ error: error.message, stack: error.stack }, 1))
}
