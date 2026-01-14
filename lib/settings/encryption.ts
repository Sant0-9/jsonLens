// Simple encryption for API keys stored in IndexedDB
// Uses Web Crypto API with a derived key from a user-provided password
// If no password is set, uses a device-specific key

const SALT = new Uint8Array([
  0x73, 0x61, 0x6c, 0x74, 0x79, 0x6b, 0x65, 0x79,
  0x72, 0x65, 0x73, 0x65, 0x61, 0x72, 0x63, 0x68
])

async function getKey(password?: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password || getDeviceId()),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function getDeviceId(): string {
  // Generate a device-specific ID stored in localStorage
  const key = 'research-workbench-device-id'
  let deviceId = localStorage.getItem(key)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(key, deviceId)
  }
  return deviceId
}

export async function encrypt(plaintext: string, password?: string): Promise<string> {
  const key = await getKey(password)
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  )

  // Combine IV and ciphertext, then base64 encode
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return btoa(String.fromCharCode(...combined))
}

export async function decrypt(ciphertext: string, password?: string): Promise<string> {
  try {
    const key = await getKey(password)
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))

    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch {
    throw new Error('Failed to decrypt. Invalid password or corrupted data.')
  }
}

// Mask API key for display (show only first 8 and last 4 chars)
export function maskApiKey(key: string): string {
  if (key.length <= 12) return '****'
  return `${key.slice(0, 8)}...${key.slice(-4)}`
}

// Validate API key format
export function validateApiKeyFormat(provider: string, key: string): boolean {
  switch (provider) {
    case 'openai':
      return key.startsWith('sk-') && key.length > 20
    case 'anthropic':
      return key.startsWith('sk-ant-') && key.length > 20
    case 'google':
      return key.length > 20
    case 'groq':
      return key.startsWith('gsk_') && key.length > 20
    default:
      return key.length > 0
  }
}
