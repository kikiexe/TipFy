import { createPublicClient, http } from 'viem'
import { monadTestnet } from 'viem/chains'

const client = createPublicClient({
  chain: monadTestnet,
  transport: http(),
})

export async function verifyMonadTransaction(hash: string) {
  try {
    const receipt = await client.getTransactionReceipt({
      hash: hash as `0x${string}`,
    })

    return {
      status: receipt.status === 'success' ? 'confirmed' : 'failed',
      blockNumber: receipt.blockNumber.toString(),
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Transaction not found')) {
      throw error
    }
    throw new Error(`Failed to verify transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
