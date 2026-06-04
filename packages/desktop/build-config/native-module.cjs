const fs = require('node:fs')
const path = require('node:path')

const rootPath = path.join(__dirname, '../')
const distLib = path.join(rootPath, 'build-config/tempLib/better_sqlite3.node')
const sourceLib = path.join(rootPath, 'node_modules/better-sqlite3/build/Release/better_sqlite3.node')

exports.rmSourceModule = () => {
  try {
    fs.rmSync(path.dirname(sourceLib), {
      recursive: true,
    })
  } catch {
    /* empty */
  }
}

exports.rmModule = () => {
  exports.rmSourceModule()
  try {
    fs.rmSync(path.dirname(distLib), {
      recursive: true,
    })
  } catch {
    /* empty */
  }
}

exports.cpModule = () => {
  try {
    fs.cpSync(sourceLib, distLib, { recursive: true })
  } catch {
    /* empty */
    console.log('error copying native module')
  }
}
