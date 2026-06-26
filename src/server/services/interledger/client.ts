import { createAuthenticatedClient } from '@interledger/open-payments';
import type { AuthenticatedClient } from '@interledger/open-payments';
import path from 'path';
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
  // PRIVATE_KEY_PATH resolves from CWD (wherever `npm run dev` is invoked).
  // Fallback walks up from src/server/services/interledger/ to src/server/.
  const privateKeyPath = process.env.PRIVATE_KEY_PATH
    ? path.resolve(process.env.PRIVATE_KEY_PATH)
    : path.join(__dirname, '../../private.key');

  if (!walletAddress || !keyId) {
    throw new Error(
      'SERVER_WALLET_ADDRESS and KEY_ID must be set in .env to use real Open Payments.'
    );
  }

  const url = walletAddress.startsWith('$')
    ? `https://${walletAddress.slice(1)}`
    : walletAddress;

  return createAuthenticatedClient({
    walletAddressUrl: url,
    keyId,
    privateKey: privateKeyPath,
  });
}

/** True when OP credentials exist in the environment. */
export function isOPConfigured(): boolean {
  return !!(process.env.SERVER_WALLET_ADDRESS && process.env.KEY_ID);
}
