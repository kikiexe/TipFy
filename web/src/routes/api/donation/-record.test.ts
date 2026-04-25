import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyMonadTransaction } from '#/lib/monad-utils'

// We need to import the route handler, but since it's a TanStack Start route,
// it might be tricky to test directly without the full environment.
// For TDD, let's assume we can mock the request and call the handler if we had access.
// Since TanStack Start routes are exported as part of Route, we'll try to access the POST handler.

import { Route } from './record'

// Mock dependencies
vi.mock('#/db/index', () => ({
  db: {
    query: {
      profile: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: 1, status: 'confirmed' }]),
      })),
    })),
  },
}))

vi.mock('#/lib/monad-utils', () => ({
  verifyMonadTransaction: vi.fn(),
}))

vi.mock('#/lib/ai-utils', () => ({
  censorMessageServerFn: vi.fn(async ({ data }) => ({ censored: data.message })),
}))

vi.mock('ably', () => ({
  default: {
    Rest: vi.fn(() => ({
      channels: {
        get: vi.fn(() => ({
          publish: vi.fn(),
        })),
      },
    })),
  },
}))

describe('POST /api/donation/record', () => {
  const postHandler = (Route.options.server as any).handlers.POST

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully record a donation when verification succeeds', async () => {
    const { db } = await import('#/db/index')
    
    ;(db.query.profile.findFirst as any).mockResolvedValue({ id: 1, walletAddress: '0xTarget', slug: 'target' })
    ;(verifyMonadTransaction as any).mockResolvedValue({ status: 'confirmed', blockNumber: '123' })

    const request = new Request('http://localhost/api/donation/record', {
      method: 'POST',
      body: JSON.stringify({
        slug: 'target',
        senderAddress: '0xSender',
        senderName: 'Sender',
        amount: '1.0',
        txHash: '0xHash',
        message: 'Hello',
      }),
    })

    const response = await postHandler({ request })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(verifyMonadTransaction).toHaveBeenCalledWith('0xHash')
    expect(db.insert).toHaveBeenCalled()
  })

  it('should return 400 when verification fails', async () => {
    const { db } = await import('#/db/index')
    ;(db.query.profile.findFirst as any).mockResolvedValue({ id: 1, walletAddress: '0xTarget', slug: 'target' })
    ;(verifyMonadTransaction as any).mockResolvedValue({ status: 'failed', blockNumber: '124' })

    const request = new Request('http://localhost/api/donation/record', {
      method: 'POST',
      body: JSON.stringify({
        slug: 'target',
        txHash: '0xBadHash',
        amount: '1.0',
      }),
    })

    const response = await postHandler({ request })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Transaction verification failed')
  })
})
