import crypto from 'crypto'

// const publicKey = `
// -----BEGIN PUBLIC KEY-----
// MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0rggENU2JbXgYGoQBIyqlBJP76mgMKh8
// 5gRIUsAwoq/Oj7qEoKYX9jqtnRgAwEPIV7aLMQxGryfm9fGlohDcUPtcF6za5l6L9Szd+0McOCxZ
// SY98/pPFdTYnBHRHPrHHYqzqs4y5wPqpFFNrt2z312YS4xy3SYHkooNPxL0OscxejeG9KtmXQmMd
// ejm2MxOIuItlqGHpdwInlvY8Wm/gOMvBmPVffsMaNB412xSZA25D3gRNZRO6O28+S2pXRdSbmFX6
// DLWQ/xRDJW1QnfbtjbAJ7Xo1X1anS/NEKRpZqHidjjWI43rL/LhcIAt45a1MkxpBEO+1yCivaNCF
// E5jyQwIDAQAB
// -----END PUBLIC KEY-----
// `
// const privateKey = `
// `

export const signData = (data: Buffer, privateKey: string) => {
  const sign = crypto.createSign('SHA256')
  sign.update(data)
  sign.end()
  const signature = sign.sign(privateKey, 'hex')
  return signature
}

export const verifySignature = (data: Buffer, publicKey: string, signature: string) => {
  const verify = crypto.createVerify('SHA256')
  verify.update(data)
  verify.end()
  const isValid = verify.verify(publicKey, signature, 'hex')
  return isValid
}
