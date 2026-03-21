/**
 * Hashing utility for password storage using Web Crypto API.
 * Uses PBKDF2 with SHA-256, user-specific salt, 10000 iterations, 256-bit key.
 */

export default async function hashPassword(password: string, salt: string): Promise<string> {
  // Encode password and salt as Uint8Array
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);
  const saltBuffer = enc.encode(salt);

  // Import password as a CryptoKey
  const key = await crypto.subtle.importKey(
    "raw",               // raw format of the password
    passwordBuffer,
    { name: "PBKDF2" },
    false,               // not extractable
    ["deriveBits", "deriveKey"]
  );

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 10000,
      hash: "SHA-256",
    },
    key,
    256 // 256-bit output
  );

  // Convert derived bits to hex string
  return bufferToHex(derivedBits);
}

// Helper: convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}