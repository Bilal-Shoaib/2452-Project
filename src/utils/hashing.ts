/**
 * Hashing utility for password storage using Web Crypto API.
 * Uses PBKDF2 with SHA-256, salt: username, 10000 iterations, 256-bit key.
 */

/**
 * Hashes a password using PBKDF2 with the provided salt.
 * @param password the plaintext password to hash.
 * @param salt the salt to use for hashing (e.g., username).
 * @returns a Promise that resolves to the hexadecimal string of the hashed password.
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

/**
 * Helper function to convert ArrayBuffer to hexadecimal string.
 * @param buffer the ArrayBuffer to convert into a hex string.
 * @returns the hexadecimal representation of the buffer.
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}