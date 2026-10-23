import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseWeb3Error(err: any): { title: string; description: string } {
  const errMsg = String(err?.message || err?.reason || err || '');
  const errCode = err?.code ?? err?.error?.code ?? err?.info?.error?.code;

  if (errCode === -32002 || errMsg.includes('-32002') || errMsg.includes('already pending')) {
    return {
      title: 'MetaMask Request Already Pending',
      description: 'A MetaMask approval popup is already waiting. Please click the fox icon in your browser toolbar (showing notification 1) or check open tabs to approve or reject the request.',
    };
  }

  if (
    errCode === 4001 ||
    errCode === 'ACTION_REJECTED' ||
    errMsg.includes('rejected') ||
    errMsg.includes('user rejected') ||
    errMsg.includes('4001')
  ) {
    return {
      title: 'Connection Cancelled',
      description: 'The authentication or transaction request was cancelled in MetaMask.',
    };
  }

  if (errMsg.includes('insufficient funds')) {
    return {
      title: 'Insufficient Balance',
      description: 'Your wallet does not have enough crypto to cover the transaction amount and gas fee.',
    };
  }

  let cleanMsg = errMsg;
  if (cleanMsg.includes('could not coalesce error') || cleanMsg.includes('UNKNOWN_ERROR')) {
    const match = cleanMsg.match(/"message":\s*"([^"]+)"/);
    if (match && match[1]) {
      cleanMsg = match[1];
    } else {
      cleanMsg = 'An unexpected MetaMask error occurred. Please unlock your wallet and try again.';
    }
  }

  return {
    title: 'MetaMask Error',
    description: cleanMsg.length > 160 ? cleanMsg.slice(0, 160) + '...' : cleanMsg,
  };
}
