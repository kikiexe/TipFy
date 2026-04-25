# LeMon - TipFy Protocol 🍋

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?style=flat&logo=vercel)](https://tipfy-dyxp.vercel.app/)
[![Monad Testnet](https://img.shields.io/badge/Network-Monad%20Testnet-blue)](https://monad.xyz)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-black?logo=solidity)](https://soliditylang.org/)
[![Stack](https://img.shields.io/badge/Stack-TanStack%20Start-FF4154?logo=react)](https://tanstack.com/start)

**LeMon (TipFy Protocol)** is a next-generation streaming donation platform built on the **Monad Blockchain**. It empowers streamers to not only receive direct support but also grow their treasury through a high-yield staking architecture integrated with Aave V3.

---

## Key Features

### Smart Staking Architecture (TipFyVault)
*   **Dual-Mode Donations**: Supports both direct "Pass-through" transfers and "Vault-based" staking.
*   **Yield Generation**: Integrated with Aave V3 to provide a stable **3.5% APR** on staked donations.
*   **Time-Weighted Claiming**: Fair yield calculation using weighted average timestamps for streamers who maintain long-term holdings.

### Streamer Command Center
*   **Real-time Alerts**: Low-latency donation notifications powered by **Ably**.
*   **Overlay Customization**: Fully configurable alerts, soundboards, leaderboards, and running text overlays.
*   **QR Code Integration**: Seamless on-chain donation flow via QR codes.

### Secure & Scalable
*   **Monad Native**: Optimized for Monad's high-throughput EVM.
*   **Drizzle & Neon**: Type-safe database interactions with Neon Serverless PostgreSQL.
*   **T3-Style Env Validation**: Robust environment variable handling for production reliability.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | TanStack Start (React 19), Vite, Tailwind CSS, Framer Motion |
| **Backend** | Nitro Server, Drizzle ORM |
| **Blockchain** | Solidity, Foundry, Monad Testnet |
| **Integration** | Wagmi, Viem, ConnectKit, Aave V3 |
| **Infrastructure** | Vercel, Neon Database, Ably, Google Cloud Storage |

---

## Project Structure

```bash
├── contract/       # Foundry project (Smart Contracts & Deployment scripts)
│   ├── src/        # TipFyVault.sol & interfaces
│   ├── test/       # Full test suite with Aave Mocks
│   └── script/     # Deployment and verification scripts
├── web/            # TanStack Start Application (Frontend & Server Functions)
│   ├── src/routes/ # TanStack File-based routing
│   ├── src/lib/    # Shared utilities (Blockchain, Database, Storage)
│   └── src/db/     # Drizzle Schema & Migrations
└── README.md       # Project Documentation
```

---

## Getting Started

### 1. Smart Contract (Foundry)
```bash
cd contract
forge build
forge test
# Deployment to Monad Testnet
forge script script/Deploy.s.sol:DeployTipFyVault --rpc-url $RPC_URL --broadcast --verify
```

### 2. Web Application (TanStack Start)
```bash
cd web
pnpm install
pnpm dev
```

### 3. Environment Variables
Create a `.env` in the `web` folder with:
```env
DATABASE_URL=
GROQ_API_KEY=
GCS_BUCKET_NAME=
GOOGLE_APPLICATION_CREDENTIALS=
ABLY_API_KEY=
UPLOADTHING_TOKEN=
VITE_WC_PROJECT_ID=
```

---

## Smart Contract Addresses (Monad Testnet)

| Contract | Address |
| :--- | :--- |
| **TipFyVault** | `0x1be88627d42a8b583cfab2cd110196e8216ddb8d` |
| **MockWMON** | `0xefea2880f52f845cb6a5a7bafbbe74ec67b38606` |
| **MockAavePool** | `0xa4a69e91994a788375537171620650a6d7ff4b08` |

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

Created with ❤️ by the **LeMon Team** for Monad Blitz Jogja.