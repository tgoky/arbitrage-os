import 'dotenv/config'; // load .env variables
import { encrypt, decrypt } from '../lib/encryption.service';

const plaintext = 'Hello, World!';

try {
  const encrypted = encrypt(plaintext);
  console.log('Encrypted:', encrypted);

  const decrypted = decrypt(encrypted);
  console.log('Decrypted:', decrypted);

  if (decrypted === plaintext) {
    console.log('  Encryption & decryption test passed');
  } else {
    console.error('  Encryption & decryption test failed');
  }
} catch (error) {
  console.error('Error during test:', error);
}
