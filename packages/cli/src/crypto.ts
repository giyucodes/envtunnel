// AES-256-GCM using Node.js built-in crypto (no deps)
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "crypto";

const SALT = "envtunnel-salt-v1";
const ITERATIONS = 100000;
const KEY_LEN = 32;
const DIGEST = "sha256";

function deriveKey(passphrase: string): Buffer {
  return pbkdf2Sync(passphrase, SALT, ITERATIONS, KEY_LEN, DIGEST);
}

export function encrypt(text: string, passphrase: string): { payload: string; iv: string } {
  const key = deriveKey(passphrase);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Append auth tag to encrypted payload
  const combined = Buffer.concat([encrypted, authTag]);

  return {
    payload: combined.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decrypt(payload: string, iv: string, passphrase: string): string {
  const key = deriveKey(passphrase);
  const combined = Buffer.from(payload, "base64");
  const ivBuf = Buffer.from(iv, "base64");

  // Split auth tag (last 16 bytes) from encrypted data
  const authTag = combined.subarray(combined.length - 16);
  const encrypted = combined.subarray(0, combined.length - 16);

  const decipher = createDecipheriv("aes-256-gcm", key, ivBuf);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
