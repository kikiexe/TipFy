// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TipFyVault} from "../src/TipFyVault.sol";
import {MockWETH} from "../test/mocks/MockWETH.sol";
import {MockAavePool} from "../test/mocks/MockAavePool.sol";

contract DeployTipFyVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock Contracts (Simulasi WMON dan Aave di Testnet)
        MockWETH wmon = new MockWETH();
        MockAavePool aavePool = new MockAavePool();

        // 2. Deploy TipFyVault dengan memasukkan address dari kontrak Mock di atas
        TipFyVault tipfy = new TipFyVault(address(aavePool), address(wmon));

        vm.stopBroadcast();

        console.log("================================================");
        console.log("  TipFyVault deployed successfully on Monad Testnet!");
        console.log("  Mock WMON address      :", address(wmon));
        console.log("  Mock Aave Pool address :", address(aavePool));
        console.log("  TipFyVault address     :", address(tipfy));
        console.log("  Owner (platform)       :", tipfy.owner());
        console.log("  Platform fee           : 1% (100 BPS)");
        console.log("================================================");
    }
}