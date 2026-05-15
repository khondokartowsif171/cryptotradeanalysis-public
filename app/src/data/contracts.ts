export const CONTRACTS = {
  CryptoXToken: {
    address: '0x735A774bDcDfa6580020a88037c3640E4BC7038f',
    name: 'CryptoX Token',
    symbol: 'CRX',
    decimals: 18,
  },
};

export const CRX_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function stake(uint256 amount)',
  'function unstake(uint256 amount)',
  'function claimRewards()',
  'function calculateReward(address user) view returns (uint256)',
  'function stakedBalance(address) view returns (uint256)',
  'function totalStaked() view returns (uint256)',
  'function rewardsEarned(address) view returns (uint256)',
  'function getPlatformStats() view returns (uint256, uint256, uint256, uint256, uint256)',
  'function getUserInfo(address) view returns (uint256, uint256, uint256, uint256)',
  'function setWatchlist(string[] coins)',
  'function getWatchlist(address user) view returns (string[])',
  'function owner() view returns (address)',
];
