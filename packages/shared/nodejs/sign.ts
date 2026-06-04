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
// -----BEGIN PRIVATE KEY-----
// MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDSuCAQ1TYlteBgahAEjKqUEk/v
// qaAwqHzmBEhSwDCir86PuoSgphf2Oq2dGADAQ8hXtosxDEavJ+b18aWiENxQ+1wXrNrmXov1LN37
// Qxw4LFlJj3z+k8V1NicEdEc+scdirOqzjLnA+qkUU2u3bPfXZhLjHLdJgeSig0/EvQ6xzF6N4b0q
// 2ZdCYx16ObYzE4i4i2WoYel3AieW9jxab+A4y8GY9V9+wxo0HjXbFJkDbkPeBE1lE7o7bz5LaldF
// 1JuYVfoMtZD/FEMlbVCd9u2NsAntejVfVqdL80QpGlmoeJ2ONYjjesv8uFwgC3jlrUyTGkEQ77XI
// KK9o0IUTmPJDAgMBAAECggEAUCLE0xH6pym9XH1JfSlvv6MdMkQ8jvSslx8+z/WWKXCZqjBhOuUf
// jL0xBGK5+mRsvurFkZAdG4SdwZ+2AWXPG58UHU7X6q8/I6z9+I3DoBtBk4eVng1dlR9UhE2iQJYE
// gSLImSLmC51oCrpU5ytyL8D6YtOrYrGa3TD595R8j6G8ElDuvgeqIeFdb5CQUm/4/v+kZ8i8QzGY
// lZ65N/mIyl6xB+DnZmWtPRk9HXDdtAnNQlj7uUrKdChq4JNIbwOmrjdmfVkpk5f5JBrCLt8YjGDM
// Tf0bSfQcX/PGtm5RHb95XsAp4nGMhVnV44Dnw7kHLIElHRYtt3oXu/SHo3/BDQKBgQDrEpmFaYNS
// iVJczAcqmOR+rLHCZnx3GUrKq2udIE6Zb/s2FTzmYHqcSQ66xsn4XzueaCrj9tqUuYIjYnnVM4lL
// ux7CgGAwB6moBlUVcDbPZEMJEXXvDE6+oWg3eLGp1S5U7Q8ab0/9laC+c1ncMrgYhBNJ9RhvzimC
// /+LPNbdmDQKBgQDleoBdsCDPIpbJVGjkgwN1T6aDPfs+A2lKx0z8Grzmv17HlhYqjy5Jvdx8bulR
// 0xY81YJ+h8dFD9e9fHdlxpfGj+gtHB8oGzjdN6JWfob6im+XAmg2ftWd1pHx9KBXkpL34NpqleJF
// EH7LjGcMjbnceVAM6FEAiPI8BE6RrM91jwKBgQCMzIkzxa0oxKOWfYZVV1qVHS8jt2sZkwafOemt
// JWqusMoQ7MubWXJXJdMywFq8752wFciK3pKxviNaumMq9kFoIN4dtfLnEc/mmlRgEORjeDRGvDSd
// SAvqVpcrkpknlk64A32mYcHRq8uqB0FtiNuHo6RCChHm9d8bXdUmM5B0CQKBgQCM6xYq8j6jlHUO
// O2SSdxXHk1sImyZO5Z9iCVNwOScpd/lHDRadmgFtzUa5rw5ebgbo4qBY/R5Ufa8ZMHbNrA+GItcL
// 5IoJgfYAeuqYvOg8sIhoLlU6qdaaL6q972ALhvnzeEQIUfR6Pu/uJVEet2WcS27qDju33WELlAV/
// laRsZwKBgBzjfllho66+JLamWnthlDHqgEKZDiZF+1fZipOITd7jaA3W8teGc8v9YmSABG4b9IGd
// M8XtAFeDYN/MHMKRq+nmLF6hvEQYHUgqYGZGkxX2HcKnRHUssbUOTWJynvRVNPL/k9g9q0d6PeSS
// DaE3OO3AUN8voDBaHDII1YscbEBg
// -----END PRIVATE KEY-----
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
