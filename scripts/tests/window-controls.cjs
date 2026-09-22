const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]);let passed=0,failed=0;
function test(name,fn){try{fn();passed++;console.log('PASS '+name)}catch(e){failed++;console.log('FAIL '+name+': '+e.message.split('\n')[0])}}
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const code=read('packages/desktop/src/renderer/winMain/main.ts');
let body=code.match(/export const toggleMaximize = \(\) => \{([\s\S]*?)\n\}/)?.[1];
test('desktop maximize has a genuine native handler',()=>assert(body));
if(body){for(const state of ['missing','normal','maximized'])test('maximize transition '+state,()=>{let actions=[];const browserWindow=state==='missing'?null:{isMaximized:()=>state==='maximized',maximize:()=>actions.push('maximize'),unmaximize:()=>actions.push('unmaximize')};vm.runInNewContext('(function(){'+body+'})()',{browserWindow});assert.deepEqual(actions,state==='missing'?[]:state==='normal'?['maximize']:['unmaximize'])})}
for(const file of ['packages/desktop/src/renderer/winMain/rendererEvent/app.ts','packages/desktop/src/renderer/winMain/preload/app.ts','packages/view-main/src/shared/ipc/app/index.ts','packages/shared/types/types/ipc_server_common_actions.d.ts'])test('IPC registered '+file,()=>assert(read(file).includes('toggleMaximizeWindow')));
test('Windows button is wired, not cosmetic',()=>assert.match(read('packages/view-main/src/components/layout/Header/ControlBtnsDesktop.svelte'),/onclick=\{toggleMaximizeWindow\}/));
console.log(`RESULT ${passed} passed, ${failed} failed`);process.exitCode=failed?1:0;
