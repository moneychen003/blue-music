import http from 'http'
import https from 'https'
import { URL } from 'url'

import { httpOverHttp, httpsOverHttp } from 'tunnel'

type ParamsData = Record<string, string | number | null | undefined | boolean>
const CONTENT_TYPE = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  text: 'text/plain',
}
// const httpsRxp = /^https:/
export interface Options {
  method?: 'get' | 'head' | 'delete' | 'patch' | 'post' | 'put' | 'options'
  params?: Record<string, string>
  headers?: Record<string, string>
  timeout?: number
  json?: boolean
  signal?: AbortController['signal']
  lookup?: http.RequestOptions['lookup']
  family?: http.RequestOptions['family']
  // agent?: http.Agent
  proxy?: {
    host: string
    port: string
  }
  body?: string | Buffer | Uint8Array
  form?: ParamsData
  format?: keyof typeof CONTENT_TYPE
}

export interface Response<Res> {
  headers: http.IncomingHttpHeaders
  body: Res
  raw: Buffer
  statusCode?: number
  statusMessage?: string
}

export type HttpCallback<Res> = (err: Error | null, res: Response<Res> | null, body: Res | null) => void

const defaultOptions: Options = {
  method: 'get',
  timeout: 15000,
}

const buildParams = (data: ParamsData) =>
  Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value ?? '')}`)
    .join('&')

/**
 * wrap request
 */
const wrapRequest = (url: string, options: Options) => {
  const urlParse = new URL(url)

  const httpOptions: http.RequestOptions | https.RequestOptions = {
    host: urlParse.hostname,
    port: urlParse.port,
    path: urlParse.pathname + urlParse.search,
    method: options.method,
    lookup: options.lookup,
    family: options.family,
    signal: options.signal,
  }

  if (options.params) {
    httpOptions.path += `${urlParse.search ? '&' : '?'}${buildParams(options.params)}`
  }

  httpOptions.headers = { ...options.headers }

  if (options.body) httpOptions.headers['Content-Length'] = options.body.length
  httpOptions.headers.accept ??= '*/*'

  if (options.proxy) {
    httpOptions.agent = (url.startsWith('https:') ? httpsOverHttp : httpOverHttp)({
      proxy: {
        host: options.proxy.host,
        port: parseInt(options.proxy.port || '80'),
      },
    })
  }

  return urlParse.protocol == 'https:' ? https.request(httpOptions) : http.request(httpOptions)
}

/**
 * apply timeout
 */
const applyTimeout = (request: http.ClientRequest, time: number) => {
  let timeout: NodeJS.Timeout | null = setTimeout(() => {
    timeout = null
    if (request.destroyed) return
    request.destroy(new Error('Request timeout'))
  }, time)
  // request.on('response', () => {
  //   if (!timeout) return
  //   clearTimeout(timeout)
  //   timeout = null
  // })
  return () => {
    if (!timeout) return
    clearTimeout(timeout)
    timeout = null
  }
}

// const isRequireRedirect = (response: http.IncomingMessage) => {
//   return response.statusCode &&
//     response.statusCode > 300 &&
//     response.statusCode < 400 &&
//     Object.hasOwn(response.headers, 'location') &&
//     response.headers.location
// }

/**
 * send request
 */
export const request = <Res = unknown>(url: string, _options: Partial<Options>, callback: HttpCallback<Res>) => {
  for (const [k, v] of Object.entries(_options)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-dynamic-delete
    if (v === undefined) delete _options[k]
  }
  let options: Options = { ...defaultOptions, ..._options }

  if (!options.headers) options.headers = {}

  if (options.format) options.headers['Content-Type'] ||= CONTENT_TYPE[options.format]
  if (options.json) options.headers.accept ||= 'application/json'

  if (options.form) {
    options.body = buildParams(options.form)
    options.headers['Content-Type'] ||= CONTENT_TYPE.form
  }
  switch (typeof options.body) {
    case 'object':
      options.body = Buffer.from(JSON.stringify(options.body))
      options.headers['Content-Type'] ||= CONTENT_TYPE.json
      break
    case 'string':
      options.body = Buffer.from(options.body)
      options.headers['Content-Type'] ||= CONTENT_TYPE.text
      break
    default:
      break
  }

  const request = wrapRequest(url, options)
  let stopTimeout: (() => void) | null
  if (options.timeout) stopTimeout = applyTimeout(request, options.timeout)

  request.on('response', (response) => {
    let data: Buffer[] = []
    response.on('data', (chunk) => {
      data.push(chunk as Buffer)
    })
    response.on('end', () => {
      stopTimeout?.()
      const raw = Buffer.concat(data)
      let body = raw.toString() as Res
      if (_options.json) {
        try {
          body = JSON.parse(body as string) as Res
        } catch {}
      }
      callback(
        null,
        {
          body,
          raw,
          headers: response.headers,
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
        },
        body
      )
    })
  })
  request.on('error', (err) => {
    stopTimeout?.()
    callback(err, null, null)
  })
  request.end(options.body)
  return request
}

export const requestPromise = async <Res = unknown>(url: string, options: Partial<Options>): Promise<Response<Res>> => {
  return new Promise<Response<Res>>((resolve, reject) => {
    request<Res>(url, options, (err, res) => {
      if (err) reject(err)
      else resolve(res!)
    })
  })
}
