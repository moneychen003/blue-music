const minor = ['electron', '@types/node', '@eslint/js', 'eslint', 'undici']
const newest = ['electron-builder', 'electron-updater', 'oxfmt']
const patch = []
const ignore = ['@types/ws']

const cooldown = '8h'

module.exports = [
  {
    reject: [...ignore, ...newest, ...minor, ...patch],
    cooldown,
  },
  {
    target: 'newest',
    filter: newest,
    cooldown,
  },
  // {
  //   target: 'patch',
  //   filter: [],
  // },
  {
    target: 'minor',
    filter: minor,
    cooldown,
  },
]
