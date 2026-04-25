// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {TipFy} from "../src/TipFy.sol";

contract TipFyTest is Test {

    TipFy public tipfy;

    // Aktor yang dipakai dalam skenario test
    address public deployer = makeAddr("deployer");
    address public streamer = makeAddr("streamer");
    address public donor    = makeAddr("donor");

    // Konstanta nilai test
    uint256 constant DONATION_AMOUNT = 1 ether;
    uint256 constant BELOW_MINIMUM   = 0.009 ether;
    uint256 constant FEE_BPS         = 100;

    function setUp() public {
        // Deploy contract dari address deployer
        vm.prank(deployer);
        tipfy = new TipFy();

        // Beri saldo awal ke donor
        vm.deal(donor, 100 ether);
    }

    // =========================================================
    //  TEST: CONSTRUCTOR
    // =========================================================

    /// @dev Memastikan owner ter-set dengan benar saat deploy
    function test_Constructor_SetsOwnerCorrectly() public view {
        assertEq(tipfy.owner(), deployer, "Owner harus address yang deploy");
    }

    /// @dev Memastikan fee BPS default adalah 100 (1%)
    function test_Constructor_PlatformFeeBps() public view {
        assertEq(tipfy.platformFeeBps(), 100, "Fee BPS harus 100 (1%)");
    }

    // =========================================================
    //  TEST: DONATE - AKURASI MATEMATIKA
    // =========================================================

    /// @dev Memastikan pembagian 1% fee dan 99% streamer akurat secara matematis
    function test_Donate_SplitsMathematicallyAccurate() public {
        uint256 ownerBefore    = deployer.balance;
        uint256 streamerBefore = streamer.balance;

        uint256 expectedFee          = (DONATION_AMOUNT * FEE_BPS) / 10_000; // 0.01 ether
        uint256 expectedStreamerShare = DONATION_AMOUNT - expectedFee;          // 0.99 ether

        vm.prank(donor);
        tipfy.donate{value: DONATION_AMOUNT}(
            payable(streamer),
            "CoolDonor",
            "Nice stream bro!",  // pesan user → English
            ""
        );

        assertEq(
            deployer.balance - ownerBefore,
            expectedFee,
            "Owner harus menerima tepat 1%"
        );
        assertEq(
            streamer.balance - streamerBefore,
            expectedStreamerShare,
            "Streamer harus menerima tepat 99%"
        );
    }

    /// @dev Fuzz test: pastikan matematika split selalu benar untuk semua nilai donasi valid
    function testFuzz_Donate_SplitAlwaysCorrect(uint256 amount) public {
        // Batasi ke range yang valid dan realistis
        amount = bound(amount, 0.01 ether, 10_000 ether);
        vm.deal(donor, amount);

        uint256 streamerBefore = streamer.balance;
        uint256 ownerBefore    = deployer.balance;

        vm.prank(donor);
        tipfy.donate{value: amount}(
            payable(streamer),
            "FuzzDonor",
            "Fuzz test donation!", // pesan user → English
            ""
        );

        uint256 expectedFee   = (amount * FEE_BPS) / 10_000;
        uint256 expectedShare = amount - expectedFee;

        assertEq(streamer.balance - streamerBefore, expectedShare);
        assertEq(deployer.balance - ownerBefore,    expectedFee);
    }

    // =========================================================
    //  TEST: DONATE - EMISI EVENT
    // =========================================================

    /// @dev Memastikan event ter-emit dengan benar untuk donasi teks/TTS
    function test_Donate_EmitsEventCorrectly_TextDonation() public {
        uint256 expectedFee = (DONATION_AMOUNT * FEE_BPS) / 10_000;

        vm.expectEmit(true, true, false, true);
        emit TipFy.DonationReceived(
            donor,
            streamer,
            "CoolDonor",
            "Hello streamer!",   // pesan user → English
            "",                  // mediaUrl kosong = donasi teks/TTS
            DONATION_AMOUNT,
            expectedFee
        );

        vm.prank(donor);
        tipfy.donate{value: DONATION_AMOUNT}(
            payable(streamer),
            "CoolDonor",
            "Hello streamer!",
            ""
        );
    }

    /// @dev Memastikan event ter-emit dengan benar untuk donasi mediashare
    function test_Donate_EmitsEventCorrectly_Mediashare() public {
        string memory youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        uint256 expectedFee = (DONATION_AMOUNT * FEE_BPS) / 10_000;

        vm.expectEmit(true, true, false, true);
        emit TipFy.DonationReceived(
            donor,
            streamer,
            "MediaDonor",
            "Watch this bro!",   // pesan user → English
            youtubeUrl,          // mediaUrl diisi = mediashare
            DONATION_AMOUNT,
            expectedFee
        );

        vm.prank(donor);
        tipfy.donate{value: DONATION_AMOUNT}(
            payable(streamer),
            "MediaDonor",
            "Watch this bro!",
            youtubeUrl
        );
    }

    // =========================================================
    //  TEST: DONATE - REVERT CASES
    // =========================================================

    /// @dev Memastikan revert jika donasi di bawah minimum 0.01 MON
    function test_Donate_RevertsIfBelowMinimum() public {
        vm.expectRevert(TipFy.MinimumDonationNotMet.selector);

        vm.prank(donor);
        tipfy.donate{value: BELOW_MINIMUM}(
            payable(streamer),
            "CheapDonor",
            "Too cheap!",
            ""
        );
    }

    /// @dev Memastikan revert jika donasi 0 (zero value)
    function test_Donate_RevertsIfZeroValue() public {
        vm.expectRevert(TipFy.MinimumDonationNotMet.selector);

        vm.prank(donor);
        tipfy.donate{value: 0}(
            payable(streamer),
            "ZeroDonor",
            "Free donation?",
            ""
        );
    }

    /// @dev Edge case: tepat 1 wei di bawah minimum harus revert
    function test_Donate_RevertsAtExactlyBelowMinimum() public {
        vm.expectRevert(TipFy.MinimumDonationNotMet.selector);

        vm.prank(donor);
        tipfy.donate{value: 0.01 ether - 1}(
            payable(streamer),
            "EdgeDonor",
            "Edge case test",
            ""
        );
    }

    /// @dev Edge case: tepat di nilai minimum harus berhasil
    function test_Donate_SucceedsAtExactMinimum() public {
        vm.prank(donor);
        tipfy.donate{value: 0.01 ether}(
            payable(streamer),
            "MinDonor",
            "Minimum donation!",
            ""
        );
        // Tidak revert = test passed
    }

    // =========================================================
    //  TEST: SALDO KONTRAK SELALU NOL
    // =========================================================

    /// @dev Memastikan kontrak tidak pernah menyimpan dana setelah transaksi
    function test_Donate_ContractBalanceAlwaysZero() public {
        vm.prank(donor);
        tipfy.donate{value: DONATION_AMOUNT}(
            payable(streamer),
            "Donor",
            "Contract balance test",
            ""
        );

        assertEq(
            address(tipfy).balance,
            0,
            "Kontrak tidak boleh menyimpan dana sama sekali"
        );
    }
}