export interface CoinMetadata {
  name: string;
  symbol: string;
  website: string;
  explorer: string;
  contractAddress: string;
  network: string;
  binancePair: string;
  uniswapAddress?: string;
}

export const COIN_METADATA: Record<string, CoinMetadata> = {
  bitcoin: {
    name: 'Bitcoin',
    symbol: 'BTC',
    website: 'https://bitcoin.org',
    explorer: 'https://mempool.space',
    contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    network: 'Bitcoin Native (WBTC on EVM)',
    binancePair: 'BTCUSDT',
    uniswapAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    website: 'https://ethereum.org',
    explorer: 'https://etherscan.io',
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    network: 'Ethereum Mainnet (WETH)',
    binancePair: 'ETHUSDT',
    uniswapAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  bnb: {
    name: 'BNB',
    symbol: 'BNB',
    website: 'https://www.binance.com',
    explorer: 'https://bscscan.com',
    contractAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    network: 'BNB Smart Chain (BEP-20)',
    binancePair: 'BNBUSDT',
    uniswapAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  },
  solana: {
    name: 'Solana',
    symbol: 'SOL',
    website: 'https://solana.com',
    explorer: 'https://solscan.io',
    contractAddress: 'So11111111111111111111111111111111111111112',
    network: 'Solana Native (Wrapped SOL)',
    binancePair: 'SOLUSDT',
  },
  xrp: {
    name: 'XRP',
    symbol: 'XRP',
    website: 'https://ripple.com',
    explorer: 'https://xrpscan.com',
    contractAddress: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe',
    network: 'XRP Ledger (BEP-20 Peg)',
    binancePair: 'XRPUSDT',
  },
  cardano: {
    name: 'Cardano',
    symbol: 'ADA',
    website: 'https://cardano.org',
    explorer: 'https://cardanoscan.io',
    contractAddress: '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47',
    network: 'Cardano Native (BEP-20 Peg)',
    binancePair: 'ADAUSDT',
  },
  avalanche: {
    name: 'Avalanche',
    symbol: 'AVAX',
    website: 'https://avax.network',
    explorer: 'https://snowtrace.io',
    contractAddress: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    network: 'Avalanche C-Chain (WAVAX)',
    binancePair: 'AVAXUSDT',
    uniswapAddress: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
  },
  dogecoin: {
    name: 'Dogecoin',
    symbol: 'DOGE',
    website: 'https://dogecoin.com',
    explorer: 'https://dogechain.info',
    contractAddress: '0xba2ae424d960c26247dd6c32edc70b295c744c43',
    network: 'Dogecoin Native (BEP-20 Peg)',
    binancePair: 'DOGEUSDT',
  },
  polkadot: {
    name: 'Polkadot',
    symbol: 'DOT',
    website: 'https://polkadot.network',
    explorer: 'https://polkadot.subscan.io',
    contractAddress: '0x7083609fce4d1d8dc0c979aab8c869ea2c873402',
    network: 'Polkadot Relay (BEP-20 Peg)',
    binancePair: 'DOTUSDT',
  },
  chainlink: {
    name: 'Chainlink',
    symbol: 'LINK',
    website: 'https://chain.link',
    explorer: 'https://etherscan.io/token/0x514910771af9ca656af840dff83e8264ecf986ca',
    contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    network: 'Ethereum (ERC-20)',
    binancePair: 'LINKUSDT',
    uniswapAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  },
  polygon: {
    name: 'Polygon',
    symbol: 'MATIC',
    website: 'https://polygon.technology',
    explorer: 'https://polygonscan.com',
    contractAddress: '0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3e6',
    network: 'Polygon PoS (POL/MATIC)',
    binancePair: 'MATICUSDT',
    uniswapAddress: '0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3e6',
  },
  uniswap: {
    name: 'Uniswap',
    symbol: 'UNI',
    website: 'https://uniswap.org',
    explorer: 'https://etherscan.io/token/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    network: 'Ethereum (ERC-20)',
    binancePair: 'UNIUSDT',
    uniswapAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  },
  litecoin: {
    name: 'Litecoin',
    symbol: 'LTC',
    website: 'https://litecoin.org',
    explorer: 'https://blockchair.com/litecoin',
    contractAddress: '0x4338665cbb7b2485a8855a139b75d5e34ab0db94',
    network: 'Litecoin Native (BEP-20 Peg)',
    binancePair: 'LTCUSDT',
  },
  near: {
    name: 'NEAR Protocol',
    symbol: 'NEAR',
    website: 'https://near.org',
    explorer: 'https://nearblocks.io',
    contractAddress: '0x1fa4a73a3f0133f0025378af00236f3abdee5d63',
    network: 'NEAR Native (BEP-20 Peg)',
    binancePair: 'NEARUSDT',
  },
  cosmos: {
    name: 'Cosmos',
    symbol: 'ATOM',
    website: 'https://cosmos.network',
    explorer: 'https://atomscan.com',
    contractAddress: '0x0eb3a705fc54725037cc9e008bdede697f62f335',
    network: 'Cosmos Hub (BEP-20 Peg)',
    binancePair: 'ATOMUSDT',
  },
  arbitrum: {
    name: 'Arbitrum',
    symbol: 'ARB',
    website: 'https://arbitrum.io',
    explorer: 'https://arbiscan.io/token/0x912ce59144191c1204e64559fe8253a0e49e6548',
    contractAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    network: 'Arbitrum One (ERC-20)',
    binancePair: 'ARBUSDT',
    uniswapAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
  },
};

export function getCoinMetadata(coinId: string, fallbackSymbol: string = 'BTC'): CoinMetadata {
  const normalized = (coinId || '').toLowerCase().trim();
  if (COIN_METADATA[normalized]) {
    return COIN_METADATA[normalized];
  }
  // Try finding by symbol
  const bySymbol = Object.values(COIN_METADATA).find(
    m => m.symbol.toLowerCase() === fallbackSymbol.toLowerCase()
  );
  if (bySymbol) return bySymbol;

  return {
    name: fallbackSymbol.toUpperCase(),
    symbol: fallbackSymbol.toUpperCase(),
    website: `https://coinmarketcap.com/currencies/${normalized}`,
    explorer: `https://blockchair.com/search?q=${fallbackSymbol}`,
    contractAddress: '',
    network: 'Decentralized Asset',
    binancePair: `${fallbackSymbol.toUpperCase()}USDT`,
  };
}
