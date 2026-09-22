// app-builder-lib 26.13.1 calls a helper missing from builder-util 26.13.0.
// Local compatibility implementation matching electron-builder's upstream helper:
// https://github.com/electron-userland/electron-builder/blob/master/packages/builder-util/src/util.ts
// Never modifies node_modules or the package-manager cache; no-op when upstream provides it.
const { createRequire } = require('node:module')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const builderRequire = createRequire(require.resolve('electron-builder'))
const appBuilderRequire = createRequire(builderRequire.resolve('app-builder-lib'))
const util = appBuilderRequire('builder-util')

if (typeof util.spawnAndWriteWithOutput !== 'function') {
  util.spawnAndWriteWithOutput = (command, args, data, options) => {
    // NSIS can abort on long include paths under pnpm patched-package templates.
    // Use an isolated byte-for-byte copy, never edit the package manager cache.
    let templateCopy
    if (options?.cwd && options.cwd.length >= 200 && /makensis/.test(command)) {
      templateCopy = fs.mkdtempSync(path.join(os.tmpdir(), 'jide-nsis-'))
      fs.cpSync(options.cwd, templateCopy, { recursive: true })
      data = data.split(options.cwd).join(templateCopy)
      args = args.map(arg => arg.split(options.cwd).join(templateCopy))
      options = { ...options, cwd: templateCopy }
    }
    if (process.env.JIDE_NSIS_TRACE_DIR) {
      const fs = require('node:fs')
      const path = require('node:path')
      fs.mkdirSync(process.env.JIDE_NSIS_TRACE_DIR, { recursive: true })
      const stem = path.join(process.env.JIDE_NSIS_TRACE_DIR, String(Date.now()))
      fs.writeFileSync(`${stem}.nsi`, data)
      fs.writeFileSync(`${stem}.json`, JSON.stringify({ command, args, cwd: options?.cwd, env: Object.fromEntries(Object.entries(options?.env || {}).filter(([key]) => ['LANG', 'LC_ALL', 'LC_CTYPE', 'NSISDIR'].includes(key))) }, null, 2))
    }
    const child = util.doSpawn(command, args, { ...options, stdio: ['pipe', 'pipe', 'pipe'] })
    return new Promise((resolve, reject) => {
      let stdout = ''
      let stderr = ''
      let timedOut = false
      const timeout = setTimeout(() => { timedOut = true; child.kill() }, 4 * 60 * 1000)
      child.on('error', (error) => { clearTimeout(timeout); reject(error) })
      child.stdin.on('error', (error) => { clearTimeout(timeout); reject(error) })
      child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
      child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
      child.once('close', (code, signal) => {
        clearTimeout(timeout)
        if (timedOut) reject(new Error(`${command} timed out after 4 minutes`))
        else if (code === 0) resolve({ stdout, stderr })
        else reject(new util.ExecError(command, code ?? -1, stdout, signal ? `${stderr}\nTerminated by ${signal}` : stderr))
      })
      child.stdin.end(data)
    }).finally(() => {
      if (templateCopy) fs.rmSync(templateCopy, { recursive: true, force: true })
    })
  }
}
