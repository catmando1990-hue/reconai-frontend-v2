/**
 * AES-256-GCM Encryption Utilities for Frontend
 *
 * Uses Web Crypto API for secure client-side encryption.
 * All operations use AES-256-GCM with authenticated encryption.
 *
 * IMPORTANT: For truly sensitive data, always encrypt on the server.
 * Client-side encryption protects data in transit and at rest in localStorage,
 * but the key must be managed securely.
 */

// AES-256-GCM parameters
const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM
const TAG_LENGTH = 128; // Authentication tag length in bits

/**
 * Generate a cryptographically secure AES-256 key
 */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable
    ["encrypt", "decrypt"],
  );
}

/**
 * Export a CryptoKey to a base64 string for storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const rawKey = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(rawKey)));
}

/**
 * Import a base64 key string back to a CryptoKey
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
  const rawKey = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Derive an AES-256 key from a password using PBKDF2
 * Use this when you need deterministic key derivation from user input
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Create a new ArrayBuffer copy to satisfy TypeScript strict typing
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations,
      hash: "SHA-256",
    },
    passwordKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(length: number = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns base64 encoded string: IV + ciphertext + auth tag
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey,
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    encoder.encode(plaintext),
  );

  // Combine IV + ciphertext (includes auth tag)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt AES-256-GCM encrypted data
 * Expects base64 encoded string: IV + ciphertext + auth tag
 */
export async function decrypt(
  encryptedBase64: string,
  key: CryptoKey,
): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedBase64), (c) =>
    c.charCodeAt(0),
  );

  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt an object as JSON
 */
export async function encryptObject<T>(
  obj: T,
  key: CryptoKey,
): Promise<string> {
  return encrypt(JSON.stringify(obj), key);
}

/**
 * Decrypt to an object from JSON
 */
export async function decryptObject<T>(
  encryptedBase64: string,
  key: CryptoKey,
): Promise<T> {
  const json = await decrypt(encryptedBase64, key);
  return JSON.parse(json) as T;
}

/**
 * Secure storage wrapper that encrypts data before storing in localStorage
 */
export class SecureStorage {
  private key: CryptoKey | null = null;
  private keyPromise: Promise<CryptoKey> | null = null;

  constructor(private storageKeyName: string = "__secure_storage_key") {}

  /**
   * Initialize or retrieve the encryption key
   * Key is stored in sessionStorage (cleared on browser close)
   */
  async getKey(): Promise<CryptoKey> {
    if (this.key) return this.key;
    if (this.keyPromise) return this.keyPromise;

    this.keyPromise = (async () => {
      const storedKey = sessionStorage.getItem(this.storageKeyName);
      if (storedKey) {
        this.key = await importKey(storedKey);
      } else {
        this.key = await generateKey();
        const exportedKey = await exportKey(this.key);
        sessionStorage.setItem(this.storageKeyName, exportedKey);
      }
      return this.key;
    })();

    return this.keyPromise;
  }

  /**
   * Store encrypted data in localStorage
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    const cryptoKey = await this.getKey();
    const encrypted = await encryptObject(value, cryptoKey);
    localStorage.setItem(key, encrypted);
  }

  /**
   * Retrieve and decrypt data from localStorage
   */
  async getItem<T>(key: string): Promise<T | null> {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const cryptoKey = await this.getKey();
      return await decryptObject<T>(encrypted, cryptoKey);
    } catch {
      // Decryption failed (key changed or data corrupted)
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear the encryption key (call on logout)
   */
  clearKey(): void {
    sessionStorage.removeItem(this.storageKeyName);
    this.key = null;
    this.keyPromise = null;
  }
}

// Default secure storage instance
export const secureStorage = new SecureStorage();
