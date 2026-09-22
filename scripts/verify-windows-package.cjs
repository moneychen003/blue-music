const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const desktopRequire = createRequire(path.join(__dirname, '../packages/desktop/package.json'))
const builderRequire = createRequire(desktopRequire.resolve('electron-builder'))
const appRequire = createRequire(builderRequire.resolve('app-builder-lib'))
const resedit = appRequire('resedit')
const asar = appRequire('@electron/asar')
const out = path.resolve(process.argv[2])
const appVersion = desktopRequire('./package.json').version
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex')
const brandIcons = resedit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, '../packages/desktop/resources/icons/icon.ico'))).icons.map(icon => sha256(Buffer.from(icon.data.bin)))
function pe(data, name, expectedMachine) {
  assert.equal(data.toString('ascii', 0, 2), 'MZ', name)
  const off = data.readUInt32LE(0x3c)
  assert.equal(data.toString('ascii', off, off + 4), 'PE\x00\x00', name)
  const machine = data.readUInt16LE(off + 4)
  if (expectedMachine) assert.equal(machine, expectedMachine, `${name} machine`)
  const optional = off + 24
  const plus = data.readUInt16LE(optional) === 0x20b
  const certSize = data.readUInt32LE(optional + (plus ? 112 : 96) + 4 * 8 + 4)
  return { machine: `0x${machine.toString(16)}`, signature: certSize ? 'certificate table present' : 'unsigned', bytes: data.length, sha256: sha256(data) }
}
function exe(name, expectedMachine) {
  const file = path.join(out, name)
  const data = fs.readFileSync(file)
  const info = pe(data, name, expectedMachine)
  const resources = resedit.NtExecutableResource.from(resedit.NtExecutable.from(data)).entries
  const versions = resedit.Resource.VersionInfo.fromEntries(resources)
  info.versionStrings = versions.map(version => version.getStringValues(version.getAllLanguagesForStringValues()[0]))
  assert(info.versionStrings.some(v => v.ProductName === '技得音乐'), `${name}: branded ProductName`)
  assert(info.versionStrings.some(v => v.ProductVersion === appVersion || v.ProductVersion === `${appVersion}.0`), `${name}: ProductVersion`)
  info.iconCount = resources.filter(x => x.type === 3).length
  assert(info.iconCount > 0, `${name}: icons`)
  info.brandIconMatched = resources.some(entry => entry.type === 3 && brandIcons.includes(sha256(Buffer.from(entry.bin))))
  assert(info.brandIconMatched, `${name}: exact Jide icon resource`)
  const manifest = resources.find(entry => entry.type === 24)
  info.executionLevel = manifest ? Buffer.from(manifest.bin).toString('utf8').match(/requestedExecutionLevel[^>]*level=['"]([^'"]+)/)?.[1] : null
  assert.equal(info.executionLevel, 'asInvoker', `${name}: no elevation requested`)
  return { path: file, ...info }
}
const result = {
  validation: 'static package integrity; Windows execution is not verified by this script',
  app: exe('win-unpacked/技得音乐.exe', 0x8664),
  setup: exe(`技得音乐-${appVersion}-x64-Setup.exe`),
  portable: exe(`技得音乐-${appVersion}-x64-portable.exe`),
}
const archive = path.join(out, 'win-unpacked/resources/app.asar')
const pkg = JSON.parse(asar.extractFile(archive, 'package.json').toString())
assert.equal(pkg.version, appVersion)
assert.equal(pkg.main, 'dist/electron/main.js')
const entries = asar.listPackage(archive)
assert(entries.some(x => x.endsWith('/dist/electron/main.js')))
assert(entries.some(x => x.endsWith('/dist/view-main/index.html')))
const nativePath = 'dist/electron/native/better_sqlite3.node'
const sqlite = asar.extractFile(archive, nativePath)
result.sqlite = pe(sqlite, nativePath, 0x8664)
assert(sqlite.includes(Buffer.from('node_register_module_v143')), 'SQLite ABI must match Electron 40 ABI 143')
result.sqlite.electronAbi = 143
assert(!entries.some(x => /\.(sqlite3?|db)$/.test(x)), 'No user databases in package')
result.asar = { path: archive, sha256: sha256(fs.readFileSync(archive)), entries: entries.length, appVersion: pkg.version }
const extensionRoot = path.join(out, 'win-unpacked/resources/bundled-extensions')
assert.deepEqual(fs.readdirSync(extensionRoot).sort(), ['gdstudio', 'jide-open-music'])
result.bundledExtensions = {}
function walkFiles(root, rel = '') {
  return fs.readdirSync(path.join(root, rel), { withFileTypes: true }).flatMap(entry => {
    const name = path.posix.join(rel, entry.name)
    assert(!entry.isSymbolicLink(), `No bundle symlinks: ${name}`)
    return entry.isDirectory() ? walkFiles(root, name) : [name]
  }).sort()
}
for (const id of ['gdstudio', 'jide-open-music']) {
  const dir = path.join(extensionRoot, id)
  const source = path.join(__dirname, '../extensions', id)
  const files = walkFiles(dir)
  assert(files.includes('bundle-lock.json'), `${id}: integrity lock`)
  assert(files.includes('manifest.json') && files.includes('main.js'), `${id}: executable extension`)
  assert.deepEqual(files, walkFiles(source), `${id}: complete official bundle`)
  const hashes = {}
  for (const file of files) {
    assert(!/(^|\/)(datas|config|cache)(\/|$)|\.(sqlite3?|db)$/.test(file), 'No private user data in bundled extensions')
    hashes[file] = sha256(fs.readFileSync(path.join(dir, file)))
    assert.equal(hashes[file], sha256(fs.readFileSync(path.join(source, file))), `${id}/${file}: packaged bytes`)
  }
  const lock = JSON.parse(fs.readFileSync(path.join(dir, 'bundle-lock.json'), 'utf8'))
  assert.equal(lock.schema, 1)
  assert.equal(lock.id, id)
  assert.deepEqual(Object.keys(lock.files).sort(), files.filter(file => file !== 'bundle-lock.json'))
  for (const [file, hash] of Object.entries(lock.files)) assert.equal(hashes[file], hash, `${id}/${file}: integrity lock`)
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
  assert.equal(manifest.id, id)
  if (id === 'gdstudio') assert.equal(manifest.version, '0.3.2')
  result.bundledExtensions[id] = { files, hashes, version: manifest.version, declaredResources: manifest.contributes?.resource?.map(resource => resource.id) }
}
assert(result.bundledExtensions.gdstudio.files.includes('LICENSE'), 'GD upstream license included')
const resourceFiles = walkFiles(path.join(out, 'win-unpacked/resources'))
assert(!resourceFiles.some(file => /\.(sqlite3?|db)$/.test(file)), 'No private databases in resources')
assert.equal(fs.existsSync(path.join(out, 'win-unpacked/resources/elevate.exe')), false, 'Per-user package should not include elevation helper')
console.log(JSON.stringify(result, null, 2))
