// import { ENV_PARAMS } from './constants'

// type ENV_PARAMS_Type = typeof ENV_PARAMS
// type ENV_PARAMS_Value_Type = ENV_PARAMS_Type[number]

// export const parseEnv = () => {
//   let envParams: Partial<Record<ENV_PARAMS_Value_Type, string>> = {}
//   const envParamKeys = Object.values(ENV_PARAMS)

//   const envLog = [
//     ...(envParamKeys.map(e => [e, process.env[e]]) as Array<[ENV_PARAMS_Value_Type, string]>).filter(([k, v]) => {
//       if (!v) return false
//       envParams[k] = v
//       return true
//     }),
//   ].map(([e, v]) => `${e}: ${v}`)
//   if (envLog.length) console.log(`Load env: \n  ${envLog.join('\n  ')}`)

//   return envParams
// }
