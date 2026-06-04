const { interceptors, setGlobalDispatcher, getGlobalDispatcher, ProxyAgent, request } = require('undici')

const dispatchers = [
  interceptors.redirect({ maxRedirections: 3 }),
  interceptors.responseError(),
  interceptors.retry({
    maxRetries: 3,
    minTimeout: 1000,
    maxTimeout: 10000,
    timeoutFactor: 2,
    retryAfter: true,
  }),
]
setGlobalDispatcher(getGlobalDispatcher().compose(...dispatchers))
// const setProxy = (url) => {
//   const proxyAgent = new ProxyAgent(url)
//   setGlobalDispatcher(proxyAgent.compose(...dispatchers))
// }
// setProxy('http://127.0.0.1:2081')

request('http://baidu.com', {
  method: 'GET',
  bodyTimeout: 15000,
  headersTimeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
  },
  query: undefined,
  body: undefined,
  signal: undefined,
  dispatcher: undefined,
})
  .then(async (resp) => {
    // console.log(resp)
    return {
      statusCode: resp.statusCode,
      headers: resp.headers,
      body: await resp.body.bytes(),
    }
  })
  .then(console.log)
  .catch(console.error)
