// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockAavePool {
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => uint256)) public balances; // asset => user => amount

    function supply(address asset, uint256 amount, address onBehalfOf, uint16 /* referralCode */) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        balances[asset][onBehalfOf] += amount;
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        // Dalam simulasi ini, kita ijinkan menarik lebih dari balance untuk mensimulasikan yield Aave
        // Asal kontrak punya cukup token dari donasi/simulasi lain
        balances[asset][msg.sender] -= amount; 
        IERC20(asset).safeTransfer(to, amount);
        return amount;
    }

    // Fungsi tambahan untuk mendanai pool (mensimulasikan yield yang di-generate)
    function simulateYield(address asset, uint256 amount) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
    }
}
