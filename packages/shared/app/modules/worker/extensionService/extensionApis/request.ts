import { AsyncLocalStorage } from 'node:async_hooks'

import { cloneData } from '@any-listen/common/utils'
import { request as rawRequest } from '@any-listen/nodejs/request'

type RequestOptions = Omit<AnyListen.IPCExtension.RequestOptions, 'signal'> & { requestKey?: string }
type Response<Resp> = AnyListen.IPCExtension.Response<Resp>
type Scope = { id: string; controller: AbortController }
const resourceScope = new AsyncLocalStorage<Scope>()
const activeScopes = new Map<string, Scope>()
const cancelledScopes = new Set<string>()
const requestSignalMap = new Map<string, AbortController>()
const cancelledRequestKeys = new Set<string>()
const rememberCancellation = (set: Set<string>, id: string) => {
  set.add(id)
  setTimeout(() => set.delete(id), 30_000).unref()
}
const abortError = () => Object.assign(new Error('Request cancelled'), { name: 'AbortError' })

export const runResourceRequestScope = async <T>(requestId: string | undefined, operation: () => Promise<T>): Promise<T> => {
  if (!requestId) return operation()
  const scope: Scope = { id: requestId, controller: new AbortController() }
  if (cancelledScopes.delete(requestId)) throw abortError()
  activeScopes.set(requestId, scope)
  try { return await resourceScope.run(scope, operation) }
  finally { activeScopes.delete(requestId) }
}

export const cancelResourceRequestScope = (requestId: string) => {
  const scope = activeScopes.get(requestId)
  if (scope) scope.controller.abort()
  else rememberCancellation(cancelledScopes, requestId)
}

const request = async <Resp = unknown>(url: string, input: RequestOptions = {}): Promise<Response<Resp>> => {
  const options = cloneData(input)
  const scope = resourceScope.getStore()
  const key = options.requestKey
  if ((key && cancelledRequestKeys.delete(key)) || scope?.controller.signal.aborted) throw abortError()
  const controller = new AbortController()
  const onScopeAbort = () => controller.abort()
  scope?.controller.signal.addEventListener('abort', onScopeAbort, { once: true })
  if (key) requestSignalMap.set(key, controller)
  if (scope?.controller.signal.aborted) controller.abort()
  try {
    const resp = await rawRequest<Resp>(url, {
      signal: controller.signal,
      method: options.method,
      headers: options.headers,
      query: options.query,
      json: options.json,
      form: options.form,
      binary: options.binary,
      formdata: options.formdata,
      needRaw: options.needRaw,
      text: options.text,
      xml: options.xml,
      timeout: options.timeout,
      maxRedirect: options.maxRedirect,
    })
    return { body: resp.body, headers: resp.headers, raw: resp.raw, statusCode: resp.statusCode, history: resp.history }
  } finally {
    if (key && requestSignalMap.get(key) === controller) requestSignalMap.delete(key)
    scope?.controller.signal.removeEventListener('abort', onScopeAbort)
  }
}
const cancelRequest = (requestKey: string) => {
  const controller = requestSignalMap.get(requestKey)
  if (controller) { controller.abort(); requestSignalMap.delete(requestKey) }
  else rememberCancellation(cancelledRequestKeys, requestKey)
}

export const createRequest = (extension: AnyListen.Extension.Extension) => {
  const req = { request, cancelRequest } as const
  if (extension.grant.includes('internet')) return req
  return {} as unknown as typeof req
}
