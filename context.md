# [Feature] Staking Donasi Streamer (3.5% APR)

## Deskripsi
Fitur ini bertujuan untuk memberikan insentif kepada streamer agar menyimpan pendapatan donasi mereka di dalam platform. Jika streamer menahan (holding) hasil donasi mereka di dalam smart contract selama 1 tahun, mereka akan mendapatkan **APR (Annual Percentage Rate) sebesar 3.5%** dari total donasi yang ditahan.

## Dampak pada Arsitektur Saat Ini
Sistem akan diubah menjadi **Arsitektur Hybrid (Pass-through + Vault)**. Streamer diberikan kebebasan penuh untuk memilih preferensi mereka: apakah donasi ingin langsung dikirim ke *wallet* pribadi (seperti sistem awal), atau ditahan di dalam *smart contract* (Vault/Aave) untuk mendapatkan keuntungan *yield* staking.

## Rencana Perubahan Smart Contract (`TipFy.sol` -> `TipFyVault.sol`)

1. **Penyimpanan Saldo (State Variables)**:
   - Menambahkan `mapping(address => bool) public isStakingEnabled;` untuk menyimpan preferensi streamer.
   - Menambahkan `mapping(address => uint256) public balances;` untuk melacak saldo setiap streamer.
   - Menambahkan `mapping(address => uint256) public lastStakeTimestamp;` untuk melacak waktu holding.
   
2. **Modifikasi Fungsi `donate`**:
   - Menambahkan pengecekan `isStakingEnabled[_streamer]`.
   - **Jika `false` (Direct to Wallet)**: Donasi ditransfer langsung ke *wallet* streamer secara *real-time* (mekanisme asli).
   - **Jika `true` (Staking)**: Dana tidak ditransfer ke *wallet*, melainkan disetorkan ke Vault/Aave, dan `balances[_streamer]` akan bertambah.

3. **Penambahan Fungsi Baru**:
   - `toggleStaking(bool _enable)`: Streamer dapat mengaktifkan atau menonaktifkan fitur staking kapan saja untuk donasi-donasi berikutnya.
   - `withdraw(uint256 amount)`: Memungkinkan streamer menarik dana mereka kapan saja.
   - `calculateYield(address streamer)`: Fungsi internal/view untuk menghitung akumulasi bunga berdasarkan waktu *holding* (APR 3.5%).
   - `claimYield()`: Fungsi untuk mengklaim bunga jika syarat *holding* 1 tahun terpenuhi.

## Pertimbangan Penting (Open Questions)

## Keputusan Teknis & Mekanisme

- **Sumber Dana Yield (Integrasi Aave)**: 
  Smart contract `TipFyVault.sol` akan diintegrasikan dengan protokol **Aave V3**. 
  - **Alur Supply**: Saat ada donasi masuk, kontrak TipFy akan mengubah (wrap) Native Coin menjadi token ERC20 yang didukung (misalnya WETH/WMON) dan menyetorkannya ke Aave Pool melalui fungsi `supply()`. Kontrak TipFy akan menerima *aToken* yang nilainya terus bertambah seiring waktu.
  - **Alur Withdraw**: Saat streamer melakukan penarikan, TipFy akan memanggil fungsi `withdraw()` pada Aave Pool, mencairkan *aToken* menjadi aset asli, mengonversinya kembali ke Native Coin, dan mengirimkannya ke wallet streamer.
- **Syarat Penarikan & Pencairan Bunga**:
  - Streamer **bisa menarik (withdraw) dana pokok mereka kapan saja** tanpa adanya penalti atau dana yang dikunci paksa (*no forced lock-in*).
  - Namun, **bunga 3.5% hanya akan diberikan jika dana pokok tersebut bertahan (di-hold) secara utuh selama 365 hari penuh**. Jika ditarik sebelum 1 tahun, streamer hanya akan mendapatkan nilai pokok donasinya.

## Rencana Perubahan Frontend (`web/`)

1. **Halaman Dashboard Streamer (`/dashboard`)**:
   - Menambahkan **Toggle/Switch "Mode Penerimaan Donasi"**: Pilih antara "Langsung ke Wallet" atau "Staking (3.5% APR)".
   - Menampilkan metrik **"Total Saldo Mengendap"** (Total Balance Held) jika mode staking pernah diaktifkan.
   - Menampilkan metrik **"Estimasi Bunga (Yield)"** dan indikator waktu menuju 1 tahun.
   - Menambahkan tombol **"Withdraw Funds"** (Tarik Dana) dan **"Claim Yield"** (Klaim Bunga).

2. **Integrasi Web3 (Wagmi/Viem)**:
   - Menambahkan hook untuk membaca saldo (read contract) dari `balances[streamer_address]`.
   - Menambahkan fungsi *write contract* untuk `withdraw()`.

## Langkah Implementasi (Task List)

- [ ] **Smart Contract**: Tambahkan interface `IPool` dari Aave V3 dan implementasikan logika `supply()` serta `withdraw()` ke dalam kontrak TipFy.
- [ ] **Smart Contract**: Tulis ulang `TipFy.sol` untuk mengelola *state* saldo streamer.
- [ ] **Smart Contract**: Tambahkan logika kalkulasi APR 3.5% berdasarkan blok/timestamp.
- [ ] **Testing**: Buat *test case* di Foundry untuk mensimulasikan waktu maju 1 tahun (`vm.warp`) dan memverifikasi perhitungan bunga.
- [ ] **Frontend**: Perbarui UI Dashboard untuk mendukung metrik penarikan dan staking.
- [ ] **Integrasi**: Hubungkan tombol *Withdraw* di frontend dengan fungsi *smart contract*.
