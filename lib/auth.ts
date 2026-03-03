import CryptoJS from 'crypto-js'

// Pre-computed SHA-256 hashes — never store plaintext credentials in code
const EMAIL_HASH = '1425af658e3ef015fbec3871268bdfb991d1de94b03d41e201a2d40c9f8705b9'
const PASSWORD_HASH = '566321247a793684d11256a83791a9ccffd68fad0fc60c3fb00be556ddd758df'

export function verifyCredentials(email: string, password: string): boolean {
  const inputEmailHash = CryptoJS.SHA256(email.trim().toLowerCase()).toString()
  const inputPasswordHash = CryptoJS.SHA256(password).toString()
  return inputEmailHash === EMAIL_HASH && inputPasswordHash === PASSWORD_HASH
}
