import crypto from 'crypto'

/**
 * Generates a random code based on a pattern
 * Supported patterns:
 * - {RANDOM:n} - n random alphanumeric characters
 * - {NUMERIC:n} - n random digits
 * - {ALPHA:n} - n random alphabetic characters
 * - {UUID} - UUID v4
 */
export function generateRandomCode(pattern?: string) {
  if (!pattern) {
    return crypto.randomUUID()
  }

  return pattern.replace(/{([^}]+)}/g, (match, p1) => {
    const [type, length] = p1.split(':')

    switch (type.toUpperCase()) {
      case 'RANDOM':
        return generateRandomString(Number.parseInt(length, 10) || 8, 'alphanumeric')
      case 'NUMERIC':
        return generateRandomString(Number.parseInt(length, 10) || 6, 'numeric')
      case 'ALPHA':
        return generateRandomString(Number.parseInt(length, 10) || 8, 'alpha')
      case 'UUID':
        return crypto.randomUUID()
      default:
        return match
    }
  })
}

function generateRandomString(length: number, type: string) {
  let chars

  switch (type) {
    case 'numeric':
      chars = '0123456789'
      break
    case 'alpha':
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      break
    case 'alphanumeric':
    default:
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      break
  }

  let result = ''
  const randomValues = new Uint8Array(length)
  crypto.randomFillSync(randomValues)

  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length)
  }

  return result
}
