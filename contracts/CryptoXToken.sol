// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title CryptoXToken
 * @dev CRX token for the CryptoX analytics platform with staking rewards
 */
contract CryptoXToken is ERC20, ERC20Burnable {
    address public owner;
    
    // Staking
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public rewardsEarned;
    
    // Platform stats
    uint256 public totalStaked;
    uint256 public rewardRatePerSecond; // reward rate per token per second
    uint256 public totalSignalsGenerated;
    uint256 public totalUsersRegistered;
    
    // Watchlist on-chain
    mapping(address => string[]) private userWatchlists;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event WatchlistUpdated(address indexed user, string[] coins);
    event SignalRecorded(uint256 indexed signalId, string pair, string signalType, uint256 confidence);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    constructor() ERC20("CryptoX Token", "CRX") {
        owner = msg.sender;
        _mint(msg.sender, 100_000_000 * 10 ** decimals()); // 100M tokens
        rewardRatePerSecond = 1; // 1 wei per token per second
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setOwner(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        emit OwnerChanged(owner, _newOwner);
        owner = _newOwner;
    }

    function setRewardRate(uint256 _rate) external onlyOwner {
        rewardRatePerSecond = _rate;
    }

    // Staking functions
    function stake(uint256 _amount) external {
        require(_amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        
        // Claim any pending rewards first
        if (stakedBalance[msg.sender] > 0) {
            uint256 pending = calculateReward(msg.sender);
            rewardsEarned[msg.sender] += pending;
        }
        
        _transfer(msg.sender, address(this), _amount);
        stakedBalance[msg.sender] += _amount;
        stakingTimestamp[msg.sender] = block.timestamp;
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external {
        require(_amount > 0, "Cannot unstake 0");
        require(stakedBalance[msg.sender] >= _amount, "Insufficient staked balance");
        
        uint256 reward = calculateReward(msg.sender);
        rewardsEarned[msg.sender] += reward;
        
        stakedBalance[msg.sender] -= _amount;
        totalStaked -= _amount;
        stakingTimestamp[msg.sender] = block.timestamp;
        
        _transfer(address(this), msg.sender, _amount);
        
        // Mint rewards
        if (reward > 0) {
            _mint(msg.sender, reward);
        }
        
        emit Unstaked(msg.sender, _amount, reward);
    }

    function claimRewards() external {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No rewards to claim");
        
        rewardsEarned[msg.sender] += reward;
        stakingTimestamp[msg.sender] = block.timestamp;
        
        _mint(msg.sender, reward);
    }

    function calculateReward(address _user) public view returns (uint256) {
        if (stakedBalance[_user] == 0) return 0;
        uint256 duration = block.timestamp - stakingTimestamp[_user];
        return (stakedBalance[_user] * duration * rewardRatePerSecond) / 1e18;
    }

    // Watchlist functions
    function setWatchlist(string[] memory _coins) external {
        userWatchlists[msg.sender] = _coins;
        emit WatchlistUpdated(msg.sender, _coins);
    }

    function getWatchlist(address _user) external view returns (string[] memory) {
        return userWatchlists[_user];
    }

    // Signal recording (owner only)
    function recordSignal(string memory _pair, string memory _signalType, uint256 _confidence) external onlyOwner {
        totalSignalsGenerated++;
        emit SignalRecorded(totalSignalsGenerated, _pair, _signalType, _confidence);
    }

    // Platform stats
    function registerUser() external {
        totalUsersRegistered++;
    }

    function getPlatformStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalSignals,
        uint256 _totalUsers,
        uint256 _rewardRate,
        uint256 _totalSupply
    ) {
        return (totalStaked, totalSignalsGenerated, totalUsersRegistered, rewardRatePerSecond, totalSupply());
    }

    function getUserInfo(address _user) external view returns (
        uint256 _balance,
        uint256 _staked,
        uint256 _pendingReward,
        uint256 _totalRewards
    ) {
        return (
            balanceOf(_user),
            stakedBalance[_user],
            calculateReward(_user),
            rewardsEarned[_user]
        );
    }
}
