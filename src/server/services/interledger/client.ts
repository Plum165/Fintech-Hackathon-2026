import { createAuthenticatedClient } from '@interledger/open-payments';
import type { AuthenticatedClient } from '@interledger/open-payments';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let _clientPromise: Promise<AuthenticatedClient> | null = null;

export function getOPClient(): Promise<AuthenticatedClient> {
  if (!_clientPromise) {
    _clientPromise = _createClient().catch(err => {
      // Reset so next call retries
      _clientPromise = null;
      throw err;
    });
  }
  return _clientPromise;
}

async function _createClient(): Promise<AuthenticatedClient> {
  const walletAddress = process.env.SERVER_WALLET_ADDRESS;
  const keyId = process.env.KEY_ID;
  const privateKeyPath = process.env.PRIVATE_KEY_PATH
    ? path.resolve(process.env.PRIVATE_KEY_PATH)
    : path.join(__dirname, '../../private.key');

  if (!walletAddress || !keyId) {
    throw new Error('SERVER_WALLET_ADDRESS and KEY_ID must be set in .env to use real Open Payments.');
  }

  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(
      `Private key not found at ${privateKeyPath}. ` +
      `Create src/server/private.key (see private.key.example for instructions).`
    );
  }

  const url = walletAddress.startsWith('$')
    ? `https://${walletAddress.slice(1)}`
    : walletAddress;

  return createAuthenticatedClient({
    walletAddressUrl: url,
    keyId,
    privateKey: privateKeyPath,
    validateResponses: false,
  });
}

/**
 * True only when real OP credentials are present and non-placeholder.
 * Returns false (simulation mode) when KEY_ID is the example placeholder.
 */
export function isOPConfigured(): boolean {
  const addr = process.env.SERVER_WALLET_ADDRESS;
  const key = process.env.KEY_ID;
  if (!addr || !key) return false;
  if (key === 'YOUR_KEY_ID_HERE') return false;
  const keyPath = process.env.PRIVATE_KEY_PATH
    ? path.resolve(process.env.PRIVATE_KEY_PATH)
    : path.join(__dirname, '../../private.key');
  return fs.existsSync(keyPath);
}
