#!/usr/bin/env node
// skipLibCheck may exclude dependency declaration diagnostics, never local syntax errors.
const fs = require('node:fs'), path = require('node:path'), { createRequire } = require('node:module')
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'))
const tsNode = require.resolve('ts-node', { paths: [path.join(__dirname, '../packages/shared/scripts')] })
const ts = createRequire(tsNode)('typescript')
const dir = path.join(root, 'packages/view-main/src/types')
let checked = 0
for (const name of fs.readdirSync(dir).filter((name) => name.endsWith('.d.ts'))) {
  const file = path.join(dir, name)
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  if (source.parseDiagnostics.length) throw new Error(name + ': ' + source.parseDiagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')).join('; '))
  checked++
}
console.log(`PASS ${checked} local declaration files parse without syntax diagnostics`)
