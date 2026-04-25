// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint wad) external;
    function approve(address guy, uint wad) external returns (bool);
}

/**
 * @title TipFyVault
 * @author Syntaxia
 * @notice Contract untuk streamer dengan fitur staking via Aave V3.
 */
contract TipFyVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =========================================================
    //  STATE VARIABLES
    // =========================================================

    uint256 public platformFeeBps = 100; // 1%

    mapping(address => bool) public isStakingEnabled;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public lastStakeTimestamp;
    mapping(address => uint256) public unclaimedYield;

    uint256 public platformYieldBalance;

    IPool public aavePool;
    IWETH public wmon;

    uint256 public constant YIELD_APR = 350; // 3.5% (350 basis points)

    // =========================================================
    //  EVENTS
    // =========================================================

    event DonationReceived(
        address indexed donor,
        address indexed streamer,
        string nickname,
        string message,
        string mediaUrl,
        uint256 totalAmount,
        uint256 feeCut,
        bool isStaked
    );

    event StakingToggled(address indexed streamer, bool isEnabled);
    event Withdrawn(address indexed streamer, uint256 amount);
    event YieldClaimed(address indexed streamer, uint256 yieldAmount);

    // =========================================================
    //  CUSTOM ERRORS
    // =========================================================

    error MinimumDonationNotMet();
    error TransferFailed();
    error InsufficientBalance();
    error YieldNotReady();
    error ZeroBalance();

    // =========================================================
    //  CONSTRUCTOR
    // =========================================================

    constructor(address _aavePool, address _wmon) Ownable(msg.sender) {
        aavePool = IPool(_aavePool);
        wmon = IWETH(_wmon);
    }

    // =========================================================
    //  ADMIN FUNCTIONS
    // =========================================================

    function setAavePool(address _aavePool) external onlyOwner {
        aavePool = IPool(_aavePool);
    }

    // =========================================================
    //  MAIN FUNCTIONS
    // =========================================================

    function toggleStaking(bool _enable) external {
        isStakingEnabled[msg.sender] = _enable;
        emit StakingToggled(msg.sender, _enable);
    }

    function donate(
        address payable _streamer,
        string calldata _nickname,
        string calldata _message,
        string calldata _mediaUrl
    ) external payable nonReentrant {
        if (msg.value < 0.01 ether) revert MinimumDonationNotMet();

        uint256 feeAmount = (msg.value * platformFeeBps) / 10_000;
        uint256 streamerShare = msg.value - feeAmount;

        // Track platform fee
        platformYieldBalance += feeAmount;

        // Transfer fee to platform owner (optional: keep in contract if staking fee too?)
        // For now, keep as is but we have accounting.
        (bool feeSuccess, ) = payable(owner()).call{value: feeAmount}("");
        if (!feeSuccess) revert TransferFailed();

        bool isStaked = isStakingEnabled[_streamer];

        if (isStaked) {
            // Convert to WMON
            wmon.deposit{value: streamerShare}();
            
            // Supply to Aave
            wmon.approve(address(aavePool), streamerShare);
            aavePool.supply(address(wmon), streamerShare, address(this), 0);

            // Update balances & timestamp with pro-rata accrual
            if (balances[_streamer] > 0) {
                unclaimedYield[_streamer] += _calculateNewYield(_streamer);
            }
            lastStakeTimestamp[_streamer] = block.timestamp;
            balances[_streamer] += streamerShare;
        } else {
            // Direct transfer
            (bool streamerSuccess, ) = _streamer.call{value: streamerShare}("");
            if (!streamerSuccess) revert TransferFailed();
        }

        emit DonationReceived(
            msg.sender,
            _streamer,
            _nickname,
            _message,
            _mediaUrl,
            msg.value,
            feeAmount,
            isStaked
        );
    }

    function withdraw(uint256 _amount) external nonReentrant {
        if (balances[msg.sender] < _amount) revert InsufficientBalance();

        // Accrue yield before balance changes
        unclaimedYield[msg.sender] += _calculateNewYield(msg.sender);
        lastStakeTimestamp[msg.sender] = block.timestamp;

        balances[msg.sender] -= _amount;

        // Jika saldo habis, reset timestamp
        if (balances[msg.sender] == 0) {
            lastStakeTimestamp[msg.sender] = 0;
        }

        // Withdraw from Aave
        aavePool.withdraw(address(wmon), _amount, address(this));

        // Unwrap WMON to Native
        wmon.withdraw(_amount);

        // Transfer Native to Streamer
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        if (!success) revert TransferFailed();

        emit Withdrawn(msg.sender, _amount);
    }

    function calculateYield(address _streamer) public view returns (uint256) {
        return unclaimedYield[_streamer] + _calculateNewYield(_streamer);
    }

    function _calculateNewYield(address _streamer) internal view returns (uint256) {
        if (balances[_streamer] == 0 || lastStakeTimestamp[_streamer] == 0) return 0;
        
        uint256 timeStaked = block.timestamp - lastStakeTimestamp[_streamer];
        
        // Annual Yield = (Balance * APR) / 10000
        // Pro-rata Yield = (Annual Yield * timeStaked) / 365 days
        return (balances[_streamer] * YIELD_APR * timeStaked) / (10_000 * 365 days);
    }

    function claimYield() external nonReentrant {
        uint256 yieldAmount = calculateYield(msg.sender);
        if (yieldAmount == 0) revert YieldNotReady();

        // Reset tracking
        unclaimedYield[msg.sender] = 0;
        lastStakeTimestamp[msg.sender] = block.timestamp;

        // Withdraw yield amount from Aave
        aavePool.withdraw(address(wmon), yieldAmount, address(this));
        wmon.withdraw(yieldAmount);

        (bool success, ) = payable(msg.sender).call{value: yieldAmount}("");
        if (!success) revert TransferFailed();

        emit YieldClaimed(msg.sender, yieldAmount);
    }

    // Fungsi untuk platform owner menarik sisa yield dari Aave
    function withdrawPlatformYield(uint256 _amount) external onlyOwner {
        require(_amount <= platformYieldBalance, "Insufficient platform yield balance");
        
        platformYieldBalance -= _amount;
        
        aavePool.withdraw(address(wmon), _amount, address(this));
        wmon.withdraw(_amount);

        (bool success, ) = payable(owner()).call{value: _amount}("");
        if (!success) revert TransferFailed();
    }
    
    receive() external payable {}
}