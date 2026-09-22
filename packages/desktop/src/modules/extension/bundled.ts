import { createHash, verify } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Script } from 'node:vm'

export const BUNDLED_SCHEMA = 2
const MARKER = '.jide-bundled-v2.json'
const BUNDLES = [
  {
    id: 'jide-open-music',
    version: '0.1.0',
    grant: ['internet'],
    lock: 'a7c04158f4c4693364a920d932f7aca5819e35a81773f8cc4ce71ca422deccb7',
  },
  {
    id: 'gdstudio',
    version: '0.3.2',
    grant: ['internet', 'player', 'music_list'],
    lock: 'eb620eb79d98c6ea2d72fc830021d7d1b2de5683d6a4195e9a5b0a383240cee9',
  },
] as const
const GD_PUBLIC_KEY_HASH = '8d9d691010edd6c9e4ddaf15b006a4c282896da4d8095239335fb69d570334fc'
const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex')
const exists = async (file: string) => {
  try {
    await fs.lstat(file)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

const listFiles = async (root: string, prefix = ''): Promise<string[]> => {
  if (!(await fs.lstat(root)).isDirectory()) throw new Error('Invalid bundled extension directory')
  const files: string[] = []
  for (const name of await fs.readdir(root)) {
    const file = path.join(root, name)
    const relative = prefix ? `${prefix}/${name}` : name
    const stat = await fs.lstat(file)
    if (stat.isDirectory()) files.push(...(await listFiles(file, relative)))
    else if (stat.isFile()) files.push(relative)
    else throw new Error(`Invalid bundled extension file: ${relative}`)
  }
  return files.sort()
}

/** Only the two pinned, reviewed release bundles are accepted. Never generic installation.
 * Complete inventory + signature validation happens before touching the user's profile.
 */
const readBundle = async (source: string, expected: (typeof BUNDLES)[number]) => {
  const files = await listFiles(source)
  const lockBytes = await fs.readFile(path.join(source, 'bundle-lock.json'))
  if (sha256(lockBytes) !== expected.lock) throw new Error(`Invalid bundled inventory: ${expected.id}`)
  const lock = JSON.parse(lockBytes.toString('utf8')) as { schema: number; id: string; files: Record<string, string> }
  if (
    lock.schema !== 1 ||
    lock.id !== expected.id ||
    JSON.stringify(files) !== JSON.stringify([...Object.keys(lock.files), 'bundle-lock.json'].sort())
  ) {
    throw new Error(`Incomplete bundled extension: ${expected.id}`)
  }
  const contents = new Map<string, Buffer>([['bundle-lock.json', lockBytes]])
  for (const [file, hash] of Object.entries(lock.files)) {
    // Inventory is pinned, but keep path confinement explicit for future bundle updates.
    if (file.startsWith('/') || file.includes('\\') || file.split('/').some((part) => part === '..' || !part)) {
      throw new Error('Invalid bundle path')
    }
    const content = await fs.readFile(path.join(source, file))
    if (sha256(content) !== hash) throw new Error(`Bundled file integrity mismatch: ${expected.id}/${file}`)
    contents.set(file, content)
  }
  const manifest = JSON.parse(contents.get('manifest.json')!.toString('utf8')) as {
    id: string
    version: string
    target_engine: string
    main: string
    grant: string[]
    publicKey?: string
  }
  if (
    manifest.id !== expected.id ||
    manifest.version !== expected.version ||
    manifest.target_engine !== '1.1.2' ||
    manifest.main !== 'main.js' ||
    JSON.stringify(manifest.grant) !== JSON.stringify(expected.grant)
  ) {
    throw new Error(`Invalid bundled extension manifest: ${expected.id}`)
  }
  void new Script(contents.get('main.js')!.toString('utf8'), { filename: `${expected.id}/main.js` })

  if (expected.id === 'gdstudio') {
    const [signature, publicKey] = contents.get('sig')!.toString('utf8').split('\n')
    if (
      sha256(publicKey) !== GD_PUBLIC_KEY_HASH ||
      !/^[a-f0-9]+$/i.test(signature) ||
      !verify(
        'SHA256',
        contents.get('ext.tgz')!,
        `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----\n`,
        Buffer.from(signature, 'hex')
      )
    ) {
      throw new Error('Bundled GD signature verification failed')
    }
    // Match the upstream signed installer: preserve source bytes, record verified publisher on installed copy only.
    manifest.publicKey = publicKey
    contents.set('manifest.json', Buffer.from(JSON.stringify(manifest)))
  }
  return { id: expected.id, version: expected.version, contents }
}

/** Atomic, first-profile-only installation. Existing/disabled/deleted extensions are never changed.
 * Both complete bundles and their receipt enter ext together via one rename.
 */
export const installBundledExtension = async (sourceRoot: string, extensionRoot: string) => {
  const destination = path.join(extensionRoot, 'ext')
  if ((await exists(destination)) || (await exists(path.join(extensionRoot, 'extensions.json')))) return 'existing-profile'
  if (!(await exists(sourceRoot))) return 'source-unavailable'
  if (!(await fs.lstat(sourceRoot)).isDirectory()) throw new Error('Invalid bundled source directory')
  const bundles = []
  for (const bundle of BUNDLES) bundles.push(await readBundle(path.join(sourceRoot, bundle.id), bundle))

  await fs.mkdir(extensionRoot, { recursive: true })
  const stage = await fs.mkdtemp(path.join(extensionRoot, '.jide-bundled-stage-'))
  try {
    for (const bundle of bundles) {
      const target = path.join(stage, bundle.id)
      await fs.mkdir(target)
      for (const [file, content] of bundle.contents) {
        // Signature evidence/inventory describe shipped originals, not the installed manifest with publicKey.
        if (['bundle-lock.json', 'ext.tgz', 'sig'].includes(file)) continue
        const targetFile = path.join(target, file)
        await fs.mkdir(path.dirname(targetFile), { recursive: true })
        await fs.writeFile(targetFile, content, { flag: 'wx' })
      }
    }
    await fs.writeFile(
      path.join(stage, MARKER),
      `${JSON.stringify({ schema: BUNDLED_SCHEMA, bundles: bundles.map(({ id, version }) => ({ id, version })) })}\n`,
      { flag: 'wx' }
    )
    // Electron's single-instance lock is held during startup; recheck before the atomic commit.
    if ((await exists(destination)) || (await exists(path.join(extensionRoot, 'extensions.json')))) return 'existing-profile'
    await fs.rename(stage, destination)
    return 'installed'
  } finally {
    await fs.rm(stage, { recursive: true, force: true })
  }
}
