import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient} from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query'
import { Web3Provider } from '../integrations/wagmi/root-provider'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Tipfy Protocol',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-mono">
        <h1 className="text-4xl font-black text-neon-pink mb-4 uppercase tracking-[0.2em] glow-pink">
          404: Access Denied
        </h1>
        <p className="text-neutral-500 mb-8 uppercase text-xs tracking-widest italic">
          The requested coordinate does not exist in the grid.
        </p>
        <a
          href="/"
          className="px-6 py-2 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 transition-all uppercase text-xs font-bold glow-cyan"
        >
          Return to Grid
        </a>
      </div>
    )
  },
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext()

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <Web3Provider>{children}</Web3Provider>
        </QueryClientProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
