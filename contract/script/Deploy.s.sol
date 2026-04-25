// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TipFy} from "../src/TipFy.sol";

contract DeployTipFy is Script {
    function run() external {
        // Ambil private key dari environment variable — jangan pernah hardcode!
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        TipFy tipfy = new TipFy();

        vm.stopBroadcast();

        // Log hasil deployment ke terminal (developer-facing, English)
        console.log("================================================");
        console.log("  TipFy deployed successfully on Monad Testnet!");
        console.log("  Contract address :", address(tipfy));
        console.log("  Owner (platform) :", tipfy.owner());
        console.log("  Platform fee     : 1% (100 BPS)");
        console.log("================================================");
    }
}