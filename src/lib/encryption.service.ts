// lib/encryption.service.ts
import crypto from 'crypto';

/**
 * PRODUCTION-GRADE TOKEN ENCRYPTION SERVICE
 * 
 * Uses AES-256-GCM (Galois/Counter Mode) - the gold standard for encryption
 * - AES-256: Military-grade encryption
 * - GCM: Provides both encryption and authentication
 * - IV (Initialization Vector): Ensures same data encrypts differently each time
 * - Auth Tag: Prevents tampering
 */

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16;  // 128 bits
  private tagLength = 16; // 128 bits

  // This is your master encryption key - NEVER commit this to git
  // Get it from environment variable
  private encryptionKey: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_KEY;
    
    if (!key) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required. Generate one with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
      );
    }

    // Validate key length
    const keyBuffer = Buffer.from(key, 'base64');
    if (keyBuffer.length !== this.keyLength) {
      throw new Error(
        `ENCRYPTION_KEY must be ${this.keyLength} bytes (256 bits) when decoded. ` +
        `Current length: ${keyBuffer.length} bytes. Generate a new one.`
      );
    }

    this.encryptionKey = keyBuffer;
  }

  /**
   * Encrypt sensitive data (OAuth tokens, SMTP passwords)
   * Returns: base64-encoded string in format: iv:encrypted:authTag
   */
  encrypt(plaintext: string): string {
    try {
      // Generate random IV (Initialization Vector)
      // CRITICAL: Never reuse IVs with the same key
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
     const cipher = crypto.createCipheriv(
  this.algorithm,
  this.encryptionKey,
  iv
) as crypto.CipherGCM;


      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get authentication tag (prevents tampering)
      const authTag = cipher.getAuthTag();

      // Combine IV + encrypted data + auth tag
      // Format: iv:encrypted:authTag (all base64 encoded)
      const combined = [
        iv.toString('base64'),
        encrypted,
        authTag.toString('base64')
      ].join(':');

      return combined;

    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt encrypted data
   * Expects format: iv:encrypted:authTag
   */
  decrypt(encryptedData: string): string {
    try {
      // Split the combined string
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivBase64, encrypted, authTagBase64] = parts;

      // Decode from base64
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // Validate lengths
      if (iv.length !== this.ivLength) {
        throw new Error('Invalid IV length');
      }
      if (authTag.length !== this.tagLength) {
        throw new Error('Invalid auth tag length');
      }

      // Create decipher
     const decipher = crypto.createDecipheriv(
  this.algorithm,
  this.encryptionKey,
  iv
) as crypto.DecipherGCM;


      // Set auth tag (validates data wasn't tampered with)
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data - data may be corrupted or tampered with');
    }
  }

  /**
   * Hash data for comparison (one-way, cannot be reversed)
   * Use for: API keys, webhook secrets
   */
  hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('base64');
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hash: string): boolean {
    const dataHash = this.hash(data);
    return crypto.timingSafeEqual(
      Buffer.from(dataHash),
      Buffer.from(hash)
    );
  }

  /**
   * Generate secure random string
   * Use for: CSRF tokens, session IDs
   */
  generateSecureToken(length: number = 32): string {
    return crypto
      .randomBytes(length)
      .toString('base64')
      .replace(/[+/=]/g, '')
      .slice(0, length);
  }
}

// Singleton instance
let encryptionService: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    encryptionService = new EncryptionService();
  }
  return encryptionService;
}

// Export convenience functions
export const encrypt = (plaintext: string) => getEncryptionService().encrypt(plaintext);
export const decrypt = (encrypted: string) => getEncryptionService().decrypt(encrypted);
export const hash = (data: string) => getEncryptionService().hash(data);
export const verifyHash = (data: string, hash: string) => getEncryptionService().verifyHash(data, hash);
export const generateToken = (length?: number) => getEncryptionService().generateSecureToken(length);