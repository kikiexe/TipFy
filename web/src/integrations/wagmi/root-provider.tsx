import { WagmiProvider, createConfig, http } from 'wagmi'
import { monadTestnet } from 'wagmi/chains'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import { useEffect  } from 'react'
import type {ReactNode} from 'react';

const projectId =
  import.meta.env.VITE_WC_PROJECT_ID || '49cc0f94fd76627001ad0ff75091fb9c'

const config = createConfig(
  getDefaultConfig({
    walletConnectProjectId: projectId,
    appName: 'Tipfy Protocol',
    chains: [monadTestnet],
    transports: {
      [monadTestnet.id]: http(),
    },
  }),
)

export function Web3Provider({ children }: { children: ReactNode }) {
  useEffect(() => {
    console.log('[Web3Provider] Mounted')
  }, [])

  return (
    <WagmiProvider config={config}>
      <ConnectKitProvider>{children}</ConnectKitProvider>
    </WagmiProvider>
  )
}
