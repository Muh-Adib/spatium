import crypto from 'node:crypto'

/**
 * Hash a password using scrypt (Node.js native crypto)
 * Format: scrypt:<saltHex>:<keyHex>
 */
export function hashPasswordScrypt(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!password) {
      return reject(new Error('Password must not be empty'))
    }
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

/**
 * Verify a password against a stored scrypt hash in constant time
 */
export function verifyPasswordScrypt(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!password || !storedHash || typeof storedHash !== 'string' || !storedHash.startsWith('scrypt:')) {
      return resolve(false)
    }

    const parts = storedHash.split(':')
    if (parts.length !== 3) {
      return resolve(false)
    }

    const [, salt, keyHex] = parts
    if (!salt || !keyHex) {
      return resolve(false)
    }

    let expectedKey: Buffer
    try {
      expectedKey = Buffer.from(keyHex, 'hex')
    } catch {
      return resolve(false)
    }

    crypto.scrypt(password, salt, expectedKey.length, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return resolve(false)
      try {
        if (expectedKey.length !== derivedKey.length) {
          return resolve(false)
        }
        resolve(crypto.timingSafeEqual(expectedKey, derivedKey))
      } catch {
        resolve(false)
      }
    })
  })
}
