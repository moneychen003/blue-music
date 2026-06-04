import { initState } from './state'

// let extension: AnyListen.Extension.Extension
// export const registerExtension = (_extension: AnyListen.Extension.Extension) => {
//   extension = _extension
// }

export const initHost = (
  key: string,
  env: AnyListen.ExtensionVM.Env,
  extension: AnyListen.ExtensionVM.Extension,
  hostFuncs: AnyListen.HostFuncs
) => {
  initState(key, env, extension, hostFuncs)
}
