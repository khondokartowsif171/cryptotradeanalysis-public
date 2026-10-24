import { getAddress, Interface } from 'ethers';
import type { PaymentIntent } from '@/services/api';
const erc20 = new Interface(['function transfer(address to,uint256 amount)']);
export function paymentTransaction(intent: PaymentIntent, account: string, chainId: number, now = Date.now()) {
  if (intent.status !== 'pending') throw new Error('This invoice is already paid');
  if (new Date(intent.expires_at).getTime() <= now) throw new Error('This invoice expired. Create a fresh invoice before paying');
  if (getAddress(account.toLowerCase()) !== getAddress(intent.payer_address.toLowerCase())) throw new Error('Select the wallet linked to this invoice in MetaMask');
  if (chainId !== intent.chain_id) throw new Error(`Switch to the invoice network before paying`);
  const amount = BigInt(intent.amount_units);
  if (amount <= 0n) throw new Error('Invalid invoice amount');
  return { to: getAddress(intent.token_address.toLowerCase()), chainId: BigInt(intent.chain_id), value: 0n, data: erc20.encodeFunctionData('transfer',[getAddress(intent.treasury_address.toLowerCase()),amount]) };
}
