import CryptoJS from 'crypto-js'

// Pre-computed SHA-256 hashes — never store plaintext credentials in code
// Example credentials (change before deployment): user@example.com / password123
const EMAIL_HASH = 'b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514'
const PASSWORD_HASH = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'

export function verifyCredentials(email: string, password: string): boolean {
  const inputEmailHash = CryptoJS.SHA256(email.trim().toLowerCase()).toString()
  const inputPasswordHash = CryptoJS.SHA256(password).toString()
  return inputEmailHash === EMAIL_HASH && inputPasswordHash === PASSWORD_HASH
}
