#!/usr/bin/env node
/** Source contract (not an app playback test). Pass a baseline view-main path to compare. */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (name) => readFileSync(path.join(root, 'src', name), 'utf8')
const home = read('views/Netease/index.svelte')
const nav = read('components/layout/Aside/Nav.svelte')
let failed = 0, passed = 0
const check = (name, fn) => { try { fn(); passed++; console.log(`PASS ${name}`) } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`) } }
check('brand is visible in sidebar', () => { assert.match(read('components/layout/Aside/index.svelte'), /<Logo\s*\/>/); assert.match(read('components/layout/Aside/Logo.svelte'), /技得音乐/); assert.match(read('components/layout/Aside/Logo.svelte'), /src=\{brandIcon\}/) })
check('brand and empty cover use bundled inline assets after file route rewrite', () => { for (const file of ['components/layout/Aside/Logo.svelte', 'views/Netease/index.svelte']) { const source = read(file); assert.match(source, /import brandIcon from '@\/assets\/jide-icon\.png\?inline'/); assert.doesNotMatch(source, /[\"']\.\/icon\.svg[\"']/) } })
check('discovery, charts, favorites and history remain real routes', () => { for (const route of ['/curated', '/topSongs', '/liked', '/recent', '/collected']) assert.ok(nav.includes(`to: '${route}'`)) })
check('local library and downloads have explicit navigation labels', () => { assert.match(nav, /本地与音乐库/); assert.match(nav, /to: '\/download'/) })
check('source manager is directly discoverable', () => assert.match(nav, /name: '音源管理'/))
check('navigation uses accessible current-page semantics', () => { assert.match(nav, /aria-current=/); assert.match(nav, /aria-label="主导航"/) })
check('home route is discovery, not hidden favorites fallback', () => assert.match(home, /pageMap\[\$location\] \?\? 'curated'/))
check('demo music rows and personal profile removed', () => { assert.doesNotMatch(home, /likedTracks|images\.unsplash\.com|陈前-ebay|歌曲 712|收藏者 1/); assert.match(read('plugins/routes.ts'), /'\/playlist-detail': Library/) })
check('discovery uses real extension songlists', () => { assert.match(home, /getSonglistData\(s\.extensionId, s\.id/); assert.match(home, /openSonglist\(item\)/) })
check('source errors have a retry and management action', () => { assert.match(home, /curatedError = true/); assert.match(home, /onclick=\{\(\) => curatedRefresh\+\+\}/); assert.match(home, /onclick=\{goToSources\}/) })
check('no-source charts have actionable empty state', () => { const chart = read('views/Online/TopSongs/TopSongs.svelte'); assert.match(chart, /当前音源暂无排行榜/); assert.match(chart, /href="\/extenstion"/) })
check('empty favorites never display fake tracks', () => { assert.match(home, /disabled=\{!loveMusics.length\}/); assert.match(home, /收藏喜欢的每一首/); assert.match(home, /MusicList bind:this=\{likedMusicList\}/) })
check('favorites search has reset on zero matches', () => { assert.match(home, /!likedFiltered.length/); assert.match(home, /likedSearch = ''/) })
check('history remains backed by real data', () => { assert.match(home, /getListMusics\(LIST_IDS.LAST_PLAYED\)/); assert.match(home, /MusicList list=\{recentMusics\}/) })
check('player has fixed flex height outside scrollable content', () => { assert.match(read('components/layout/index.svelte'), /<\/div>\s*<PlayBar\s*\/>/); const player = read('components/layout/PlayBar/components/Container.svelte'); assert.match(player, /flex: none/); assert.match(player, /aria-label="播放控制"/) })
check('Windows minimize and close handlers retained', () => { const controls = read('components/layout/Header/ControlBtnsDesktop.svelte'); assert.match(controls, /onclick=\{minWindow\}/); assert.match(controls, /onclick=\{closeWindow\}/) })
check('Windows maximize calls real IPC', () => { const controls = read('components/layout/Header/ControlBtnsDesktop.svelte'); assert.match(controls, /onclick=\{toggleMaximizeWindow\}/); assert.match(controls, /aria-label="最大化 \/ 还原"/) })
check('desktop header retains draggable area and search', () => { const header = read('components/layout/Header/index.svelte'); assert.match(header, /drag-no-any-modal/); assert.match(header, /<SearchInput\s*\/>/); assert.match(header, /<ControlBtns\s*\/>/) })
console.log(`RESULT ${passed} passed / ${failed} failed`)
process.exitCode = failed ? 1 : 0
