// Minimal password hashing helper using Web Crypto API (PBKDF2)

const ITERATIONS = 100000;
const KEYLEN = 256; // bits

function toHex(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string, saltHex?: string): Promise<string> {
  const enc = new TextEncoder();
  const pwd = enc.encode(password);
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pwd,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEYLEN
  );

  const hashHex = toHex(bits);
  const saltHexOut = toHex(salt.buffer);
  return `${saltHexOut}$${hashHex}`;
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 2) return false;
  const [saltHex, hashHex] = parts;
  const candidate = await hashPassword(password, saltHex);
  return candidate === stored;
}
