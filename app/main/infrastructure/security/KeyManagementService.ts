/**
 * KeyManagementService — Security placeholder for SQLCipher encryption key lifecycle.
 *
 * In production: replaces the in-memory key with a keytar-stored secret.
 * keytar stores credentials in the OS native keychain (Keychain on macOS, 
 * Credential Vault on Windows, libsecret on Linux).
 *
 * TODO: Install keytar and replace stub with real implementation.
 *   npm install keytar
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SERVICE_NAME = 'AurumLedger';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ACCOUNT_NAME = 'db-encryption-key';

export interface IKeyManagementService {
  getEncryptionKey(): Promise<string | null>;
  setEncryptionKey(key: string): Promise<void>;
  deleteEncryptionKey(): Promise<void>;
}

/**
 * STUB — returns null (unencrypted DB).
 * Replace with KeytarKeyManagementService when SQLCipher is integrated.
 */
export class StubKeyManagementService implements IKeyManagementService {
  async getEncryptionKey(): Promise<string | null> {
    console.warn('[Security] StubKeyManagementService: returning null key (no encryption).');
    return null;
  }

  async setEncryptionKey(_key: string): Promise<void> {
    console.warn('[Security] StubKeyManagementService: key storage is a no-op.');
  }

  async deleteEncryptionKey(): Promise<void> {
    console.warn('[Security] StubKeyManagementService: delete is a no-op.');
  }
}

/**
 * PRODUCTION — Uses OS keychain via keytar.
 * Uncomment and install keytar to activate.
 */
/*
import keytar from 'keytar';

export class KeytarKeyManagementService implements IKeyManagementService {
  async getEncryptionKey(): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  }

  async setEncryptionKey(key: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, key);
  }

  async deleteEncryptionKey(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  }
}
*/

// Export the active implementation
export const keyManagementService: IKeyManagementService = new StubKeyManagementService();
