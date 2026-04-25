// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockWETH is ERC20 {
    constructor() ERC20("Wrapped MON", "WMON") {}

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 wad) external {
        require(balanceOf(msg.sender) >= wad, "MockWETH: insufficient balance");
        _burn(msg.sender, wad);
        (bool success, ) = msg.sender.call{value: wad}("");
        require(success, "MockWETH: transfer failed");
    }

    receive() external payable {
        _mint(msg.sender, msg.value);
    }
}
