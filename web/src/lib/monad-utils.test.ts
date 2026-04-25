import { describe, it, expect, vi } from 'vitest'
import { verifyMonadTransaction } from './monad-utils'

// Mock viem
vi.mock('viem', async () => {
  const actual = await vi.importActual('viem')
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      getTransactionReceipt: vi.fn(async ({ hash }) => {
        if (hash === '0xsuccess') {
          return { status: 'success', blockNumber: 12345n }
        }
        if (hash === '0xreverted') {
          return { status: 'reverted', blockNumber: 12346n }
        }
        throw new Error('Transaction not found')
      }),
    })),
  }
})

describe('verifyMonadTransaction', () => {
  it('should return success and block number for a valid confirmed transaction', async () => {
    const result = await verifyMonadTransaction('0xsuccess')
    expect(result).toEqual({
      status: 'confirmed',
      blockNumber: '12345',
    })
  })

  it('should return failed for a reverted transaction', async () => {
    const result = await verifyMonadTransaction('0xreverted')
    expect(result).toEqual({
      status: 'failed',
      blockNumber: '12346',
    })
  })

  it('should throw an error if the transaction is not found', async () => {
    await expect(verifyMonadTransaction('0xnotfound')).rejects.toThrow('Transaction not found')
  })
})
