// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TipFy
 * @author Syntaxia
 * @notice Satu contract untuk semua streamer. Dana tidak pernah mengendap di sini.
 *         Setiap donasi langsung diteruskan ke streamer dan owner dalam 1 transaksi.
 */
contract TipFy {

    // =========================================================
    //  STATE VARIABLES
    // =========================================================

    /// @notice Wallet developer/Syntaxia yang menerima fee platform
    address payable public owner;

    /// @notice 100 BPS = 1% fee platform
    uint256 public platformFeeBps = 100;

    // =========================================================
    //  EVENTS
    // =========================================================

    /// @notice Event ini yang ditangkap oleh overlay OBS via viem watchContractEvent
    event DonationReceived(
        address indexed donor,
        address indexed streamer,
        string nickname,
        string message,
        string mediaUrl,
        uint256 totalAmount,
        uint256 feeCut
    );

    // =========================================================
    //  CUSTOM ERRORS
    // =========================================================

    /// @notice Dilempar jika donasi di bawah 0.01 MON
    error MinimumDonationNotMet();

    /// @notice Dilempar jika transfer native coin gagal
    error TransferFailed();

    // =========================================================
    //  CONSTRUCTOR
    // =========================================================

    constructor() {
        // Deployer otomatis jadi owner platform
        owner = payable(msg.sender);
    }

    // =========================================================
    //  MAIN FUNCTION
    // =========================================================

    /**
     * @notice Kirim donasi ke streamer.
     * @param _streamer  Address wallet streamer penerima donasi.
     * @param _nickname  Nama pengirim (max 20 char, di-enforce di frontend).
     * @param _message   Pesan donasi. Kosong = mediashare saja.
     * @param _mediaUrl  URL YouTube untuk mediashare. Kosong = donasi teks/TTS.
     *
     * Alur kerja:
     *   1. Cek minimum donasi (CHECKS).
     *   2. Hitung pembagian fee dan jatah streamer (EFFECTS).
     *   3. Transfer ke owner lalu ke streamer (INTERACTIONS).
     *   4. Emit event → ditangkap frontend overlay OBS.
     */
    function donate(
        address payable _streamer,
        string calldata _nickname,
        string calldata _message,
        string calldata _mediaUrl
    ) external payable {

        // --- CHECKS ---
        if (msg.value < 0.01 ether) revert MinimumDonationNotMet();

        // --- EFFECTS: semua kalkulasi selesai sebelum transfer ---
        uint256 feeAmount     = (msg.value * platformFeeBps) / 10_000;
        uint256 streamerShare = msg.value - feeAmount;

        // --- INTERACTIONS ---
        // Transfer 1% fee ke owner platform
        (bool feeSuccess, ) = owner.call{value: feeAmount}("");
        if (!feeSuccess) revert TransferFailed();

        // Transfer 99% sisa ke streamer
        (bool streamerSuccess, ) = _streamer.call{value: streamerShare}("");
        if (!streamerSuccess) revert TransferFailed();

        // Emit event sebagai "API" untuk frontend listener
        emit DonationReceived(
            msg.sender,
            _streamer,
            _nickname,
            _message,
            _mediaUrl,
            msg.value,
            feeAmount
        );
    }
}