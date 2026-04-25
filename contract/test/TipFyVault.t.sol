// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {TipFyVault} from "../src/TipFyVault.sol";
import {MockWETH} from "./mocks/MockWETH.sol";
import {MockAavePool} from "./mocks/MockAavePool.sol";

contract TipFyVaultTest is Test {
    TipFyVault tipfy;
    MockWETH wmon;
    MockAavePool aavePool;

    address owner = address(0x111);
    address streamer = address(0x222);
    address donor = address(0x333);

    function setUp() public {
        wmon = new MockWETH();
        aavePool = new MockAavePool();
        
        vm.prank(owner);
        tipfy = new TipFyVault(address(aavePool), address(wmon));

        vm.deal(donor, 100 ether);
    }

    function test_DirectDonation() public {
        // Streamer belum mengaktifkan staking
        uint256 startBalance = streamer.balance;

        vm.prank(donor);
        tipfy.donate{value: 1 ether}(payable(streamer), "Donor1", "Msg", "");

        // Fee 1% = 0.01 ether. Streamer dapat 0.99 ether
        assertEq(streamer.balance, startBalance + 0.99 ether);
        assertEq(owner.balance, 0.01 ether);
    }

    function test_StakedDonation() public {
        vm.prank(streamer);
        tipfy.toggleStaking(true);

        vm.prank(donor);
        tipfy.donate{value: 1 ether}(payable(streamer), "Donor1", "Msg", "");

        // Uang masuk ke Aave via WMON
        assertEq(streamer.balance, 0); // Ga masuk dompet langsung
        assertEq(tipfy.balances(streamer), 0.99 ether);
        assertEq(wmon.balanceOf(address(aavePool)), 0.99 ether);
    }

    function test_Withdraw() public {
        vm.prank(streamer);
        tipfy.toggleStaking(true);

        vm.prank(donor);
        tipfy.donate{value: 1 ether}(payable(streamer), "Donor1", "Msg", "");

        uint256 startBalance = streamer.balance;

        vm.prank(streamer);
        tipfy.withdraw(0.5 ether);

        assertEq(streamer.balance, startBalance + 0.5 ether);
        assertEq(tipfy.balances(streamer), 0.49 ether);
    }

    function test_ClaimYield() public {
        vm.prank(streamer);
        tipfy.toggleStaking(true);

        vm.prank(donor);
        tipfy.donate{value: 100 ether}(payable(streamer), "Donor1", "Msg", "");

        // Belum 1 tahun, yield 0
        assertEq(tipfy.calculateYield(streamer), 0);
        vm.expectRevert(TipFyVault.YieldNotReady.selector);
        vm.prank(streamer);
        tipfy.claimYield();

        // Majukan waktu 365 hari
        vm.warp(block.timestamp + 365 days);

        // 3.5% dari 99 ether = 3.465 ether
        uint256 expectedYield = (99 ether * 350) / 10000;
        assertEq(tipfy.calculateYield(streamer), expectedYield);

        // Kita perlu mensimulasikan Aave meng-generate yield sehingga kontrak punya cukup WMON
        vm.deal(address(123), expectedYield);
        vm.startPrank(address(123));
        wmon.deposit{value: expectedYield}();
        wmon.approve(address(aavePool), expectedYield);
        aavePool.simulateYield(address(wmon), expectedYield);
        vm.stopPrank();

        uint256 startBalance = streamer.balance;

        vm.prank(streamer);
        tipfy.claimYield();

        assertEq(streamer.balance, startBalance + expectedYield);
        // lastStakeTimestamp harus ter-reset
        assertEq(tipfy.lastStakeTimestamp(streamer), block.timestamp);
    }
}
