import { Interface } from 'ethers';
import { BillingError, PAYMENT_METHODS } from './config.js';

export interface PaymentIntent {
  id: string; user_id: string; plan: 'pro' | 'vip'; cycle: 'monthly' | 'yearly'; method: string; chain_id: number;
  token: string; token_address: string; token_decimals: number; payer_address: string; treasury_address: string;
  amount_usd: string; amount_units: string; duration_days: number; required_confirmations: number;
  status: 'pending' | 'confirmed'; tx_hash: string | null; created_at: Date | string; expires_at: Date | string;
}
export interface VerifiedPayment { amountUnits: string; blockNumber: number; blockHash: string; }
export type Verification = { pending: true; confirmations: number; required: number } | { pending: false; payment: VerifiedPayment };
export type RpcCall = (method: string, params: unknown[]) => Promise<any>;
const transfer = new Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
const hashPattern = /^0x[0-9a-f]{64}$/i;

export async function verifyReceipt(intent: PaymentIntent, txHash: string, rpc: RpcCall): Promise<Verification> {
  if (!hashPattern.test(txHash)) throw new BillingError(400, 'INVALID_HASH', 'Enter a valid transaction hash');
  const [chainId, receipt, head] = await Promise.all([rpc('eth_chainId', []), rpc('eth_getTransactionReceipt', [txHash]), rpc('eth_blockNumber', [])]);
  if (BigInt(chainId) !== BigInt(intent.chain_id)) throw new BillingError(503, 'RPC_CHAIN_MISMATCH', 'The payment network could not be verified. Retry later');
  if (!receipt) return { pending: true, confirmations: 0, required: intent.required_confirmations };
  if (receipt.transactionHash?.toLowerCase() !== txHash.toLowerCase() || !hashPattern.test(receipt.blockHash || '')) throw new BillingError(503, 'INVALID_RECEIPT', 'The network returned an invalid receipt');
  if (BigInt(receipt.status) !== 1n) throw new BillingError(422, 'TRANSACTION_FAILED', 'This transaction failed on the blockchain');
  const blockNumber = Number(BigInt(receipt.blockNumber));
  const confirmations = Math.max(0, Number(BigInt(head)) - blockNumber + 1);
  const block = await rpc('eth_getBlockByNumber', [receipt.blockNumber, false]);
  if (!block || block.hash?.toLowerCase() !== receipt.blockHash.toLowerCase()) throw new BillingError(409, 'CHAIN_REORG', 'The payment block changed. Wait and verify again');
  const timestamp = Number(BigInt(block.timestamp)) * 1000;
  if (timestamp < new Date(intent.created_at).getTime() - 30_000 || timestamp > new Date(intent.expires_at).getTime()) {
    throw new BillingError(422, 'PAYMENT_OUTSIDE_INVOICE', 'This transaction was not paid during this invoice’s payment window');
  }
  let amount = 0n;
  for (const log of receipt.logs || []) {
    if (log.removed || log.address?.toLowerCase() !== intent.token_address.toLowerCase()) continue;
    try {
      const parsed = transfer.parseLog(log);
      if (parsed?.name === 'Transfer' && parsed.args.from.toLowerCase() === intent.payer_address.toLowerCase() && parsed.args.to.toLowerCase() === intent.treasury_address.toLowerCase()) amount += parsed.args.value;
    } catch { /* Ignore other token events. */ }
  }
  if (amount < BigInt(intent.amount_units)) throw new BillingError(422, 'PAYMENT_MISMATCH', 'The token, sender, recipient or paid amount does not match this invoice');
  if (confirmations < intent.required_confirmations) return { pending: true, confirmations, required: intent.required_confirmations };
  return { pending: false, payment: { amountUnits: amount.toString(), blockNumber, blockHash: receipt.blockHash.toLowerCase() } };
}

// A whole verification uses one endpoint; providers must never be mixed mid-receipt.
export async function verifyOnChain(intent: PaymentIntent, txHash: string): Promise<Verification> {
  const method = PAYMENT_METHODS.find(method => method.id === intent.method && method.chainId === intent.chain_id);
  if (!method || method.tokenAddress.toLowerCase() !== intent.token_address.toLowerCase()) throw new BillingError(422, 'UNSUPPORTED_METHOD', 'This invoice uses an unsupported payment method');
  const endpoints = [...new Set([process.env[method.rpcEnv], ...method.rpcUrls].filter(Boolean))];
  for (const endpoint of endpoints) {
    const rpc: RpcCall = async (name, params) => {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: name, params }), signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('RPC unavailable');
      const data = await response.json() as any;
      if (data.error || !Object.hasOwn(data, 'result')) throw new Error('RPC response unavailable');
      return data.result;
    };
    try { return await verifyReceipt(intent, txHash, rpc); }
    catch (error) { if (error instanceof BillingError && error.status !== 503) throw error; }
  }
  throw new BillingError(503, 'NETWORK_UNAVAILABLE', 'Payment verification is temporarily unavailable. Your invoice is saved; retry with the same transaction hash');
}
