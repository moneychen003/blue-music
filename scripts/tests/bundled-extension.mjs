import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import vm from 'node:vm'

const root = path.resolve(process.argv[2] || '.')
const helper = path.join(root, 'packages/desktop/src/modules/extension/bundled.ts')
const module = await import(pathToFileURL(helper))
if (module.BUNDLED_SCHEMA !== 2) {
  console.log('BASELINE: two-bundle signed bootstrap missing; only public-domain bundle supported')
  process.exit(1)
}
const { installBundledExtension } = module
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'jide-bootstrap-v2-test-'))
const source = path.join(root, 'extensions')
const profile = path.join(temp, 'profile', 'extension')
let passed = 0
const test = async (name, fn) => {
  await fn()
  console.log(`PASS ${name}`)
  passed++
}
try {
  await test('fresh profile atomically receives both bundles and receipt', async () => {
    assert.equal(await installBundledExtension(source, profile), 'installed')
    assert.deepEqual(await fs.readdir(path.join(profile, 'ext')), ['.jide-bundled-v2.json', 'gdstudio', 'jide-open-music'])
    const receipt = JSON.parse(await fs.readFile(path.join(profile, 'ext/.jide-bundled-v2.json')))
    assert.equal(receipt.schema, 2)
    assert.equal(receipt.bundles.length, 2)
  })
  await test('GD upstream grants and verified publisher are retained; shipped source unchanged', async () => {
    const original = JSON.parse(await fs.readFile(path.join(source, 'gdstudio/manifest.json')))
    const installed = JSON.parse(await fs.readFile(path.join(profile, 'ext/gdstudio/manifest.json')))
    const [, key] = (await fs.readFile(path.join(source, 'gdstudio/sig'), 'utf8')).split('\n')
    assert.equal(installed.publicKey, key)
    delete installed.publicKey
    assert.deepEqual(installed, original)
    assert.deepEqual(original.grant, ['internet', 'player', 'music_list'])
    assert.deepEqual(
      await fs.readFile(path.join(profile, 'ext/gdstudio/main.js')),
      await fs.readFile(path.join(source, 'gdstudio/main.js'))
    )
  })
  await test('both installed scripts load resource handlers without credentials or network', async () => {
    for (const id of ['jide-open-music', 'gdstudio']) {
      let actions
      const api = {
        env: { version: '1.2.1' },
        logcat: { info() {}, warn() {}, error() {} },
        utils: { crypto: {}, dataConverter: {}, iconv: {}, zlib: {} },
        configuration: { getConfigs: async () => [false, '', ''], onConfigChanged() {} },
        app: { showMessage: async () => {} },
        registerResourceAction: (value) => {
          actions = value
        },
        request: async () => {
          throw new Error('Unexpected network during module load')
        },
      }
      vm.runInNewContext(await fs.readFile(path.join(profile, `ext/${id}/main.js`), 'utf8'), {
        require: () => api,
        Map,
        Set,
        Date,
        setTimeout,
        clearTimeout,
      })
      await Promise.resolve()
      assert.equal(typeof actions.musicSearch, 'function')
      assert.equal(typeof actions.musicUrl, 'function')
      if (id === 'gdstudio')
        await assert.rejects(actions.musicSearch({ source: 'tencent', name: 'Beethoven', page: 1, limit: 1 }), /未配置签名/)
    }
  })
  await test('second launch preserves edited installed bytes', async () => {
    const file = path.join(profile, 'ext/gdstudio/main.js')
    await fs.appendFile(file, '\n// user modification\n')
    const before = await fs.readFile(file)
    assert.equal(await installBundledExtension(source, profile), 'existing-profile')
    assert.deepEqual(await fs.readFile(file), before)
  })
  await test('disabled choices remain byte-identical', async () => {
    const file = path.join(profile, 'extensions.json')
    const setting = '[{"id":"gdstudio","enabled":false},{"id":"jide-open-music","enabled":false}]'
    await fs.writeFile(file, setting)
    assert.equal(await installBundledExtension(source, profile), 'existing-profile')
    assert.equal(await fs.readFile(file, 'utf8'), setting)
  })
  await test('deleted bundles are never resurrected', async () => {
    for (const id of ['gdstudio', 'jide-open-music']) await fs.rm(path.join(profile, 'ext', id), { recursive: true })
    await fs.rm(path.join(profile, 'extensions.json'))
    assert.equal(await installBundledExtension(source, profile), 'existing-profile')
    assert.deepEqual(await fs.readdir(path.join(profile, 'ext')), ['.jide-bundled-v2.json'])
  })
  await test('legacy profiles remain untouched, including empty ext and removed records', async () => {
    for (const name of ['empty', 'removed']) {
      const legacy = path.join(temp, name)
      await fs.mkdir(legacy)
      if (name === 'empty') await fs.mkdir(path.join(legacy, 'ext'))
      else await fs.writeFile(path.join(legacy, 'extensions.json'), '[{"id":"gdstudio","removed":true}]')
      assert.equal(await installBundledExtension(source, legacy), 'existing-profile')
      assert.deepEqual(await fs.readdir(legacy), [name === 'empty' ? 'ext' : 'extensions.json'])
    }
  })
  for (const [name, mutate] of [
    [
      'corrupted signature',
      async (p) => {
        await fs.writeFile(path.join(p, 'gdstudio/sig'), 'invalid')
      },
    ],
    [
      'corrupted signed archive',
      async (p) => {
        await fs.appendFile(path.join(p, 'gdstudio/ext.tgz'), 'corrupt')
      },
    ],
    [
      'wrong id',
      async (p) => {
        const f = path.join(p, 'gdstudio/manifest.json')
        const m = JSON.parse(await fs.readFile(f))
        m.id = 'other'
        await fs.writeFile(f, JSON.stringify(m))
      },
    ],
    [
      'wrong version',
      async (p) => {
        const f = path.join(p, 'gdstudio/manifest.json')
        const m = JSON.parse(await fs.readFile(f))
        m.version = '9.9.9'
        await fs.writeFile(f, JSON.stringify(m))
      },
    ],
    [
      'expanded grants',
      async (p) => {
        const f = path.join(p, 'gdstudio/manifest.json')
        const m = JSON.parse(await fs.readFile(f))
        m.grant.push('isolate_context')
        await fs.writeFile(f, JSON.stringify(m))
      },
    ],
    [
      'truncated bundle',
      async (p) => {
        await fs.rm(path.join(p, 'gdstudio/i18n/en-us.json'))
      },
    ],
    [
      'extra unlisted file',
      async (p) => {
        await fs.writeFile(path.join(p, 'gdstudio/extra.js'), 'malicious')
      },
    ],
    [
      'tampered inventory',
      async (p) => {
        await fs.writeFile(path.join(p, 'gdstudio/bundle-lock.json'), '{}')
      },
    ],
    [
      'symlink file',
      async (p) => {
        const f = path.join(p, 'gdstudio/main.js')
        await fs.rm(f)
        await fs.symlink(path.join(source, 'gdstudio/main.js'), f)
      },
    ],
  ]) {
    await test(`${name} rejects both bundles before profile writes`, async () => {
      const broken = path.join(temp, `broken-${passed}`)
      await fs.mkdir(broken)
      for (const id of ['gdstudio', 'jide-open-music'])
        await fs.cp(path.join(source, id), path.join(broken, id), { recursive: true })
      await mutate(broken)
      const target = path.join(temp, `untouched-${passed}`)
      await assert.rejects(installBundledExtension(broken, target))
      await assert.rejects(fs.access(target))
    })
  }
  await test('missing optional bundle root writes nothing', async () => {
    assert.equal(await installBundledExtension(path.join(temp, 'missing'), path.join(temp, 'unavailable')), 'source-unavailable')
    await assert.rejects(fs.access(path.join(temp, 'unavailable')))
  })
  await test('interrupted staging never becomes partial ext', async () => {
    const interrupted = path.join(temp, 'interrupted')
    await fs.mkdir(path.join(interrupted, '.jide-bundled-stage-interrupted'), { recursive: true })
    assert.equal(await installBundledExtension(source, interrupted), 'installed')
    assert.equal((await fs.readdir(path.join(interrupted, 'ext'))).length, 3)
  })
  await test('Windows bootstrap is awaited before extension service scan', async () => {
    const startup = await fs.readFile(path.join(root, 'packages/desktop/src/modules/extension/index.ts'), 'utf8')
    assert(startup.indexOf('await installBundledExtension(') < startup.indexOf('await setupExtension()'))
    assert(startup.includes("joinPath(process.resourcesPath, 'bundled-extensions')"))
    assert(startup.includes("process.platform === 'win32'"))
  })
  console.log(`RESULT ${passed} passed, 0 failed`)
} finally {
  await fs.rm(temp, { recursive: true, force: true })
}
