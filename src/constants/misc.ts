import { BigNumber } from '@ethersproject/bignumber'
import { HashZero } from '@ethersproject/constants'

// ETHERS/BIGNUMBER CONSTANTS
export const ZERO_BN = BigNumber.from(0)
export const ONE_BN = BigNumber.from(1)
export const TWO_BN = BigNumber.from(2)
export const MAX_BN = BigNumber.from(2).pow(256).sub(1)

export const HIDDEN_POOLS = [
  '0x97fc4e0ce415ef922b08f4725a0fa197d7fdbec3',
  '0x1beb0c0af60c037aa5b7e48b2e5cd952fe512390',
  '0x9c913f2c7239624f3735669ddd80fb114e04f0b3',
  '0x4548621e56dc55c687417711484b8b330b31c085',
  '0x24f0df99f786ebb4bd003ed9869f0db90947de90',
  '0xa1dbe9cd3b2d46dd8fc4a8230648f74e293d9665',
  '0x5a0c73e6468e3dbeafb35040218a12246bb4b245',
  '0x81abe4ecc61c4acd4a4b82b008b04695f40a7bb8',
  '0x4461fe6305a119b25c3047d26fec439784ef5a4b',
  '0xb2df22fc6ecc6b023cb4e5b27cd69e11d78c369f',
  '0x4d8f87c0bd478eb32dd04fb2cfcb36adcd2dd50c',
  '0x0ba3a90c1e249e7d5e9f288d9d7cb3ed8fd22623',
  '0x2d92bcc873fb776c54ef3db2b08051c214ecd513',
]

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const WAD_DECIMALS = 18
export const WAIT_BLOCKS = 8

export const EXCHANGE_DECIMALS = 4
export const STAKING_DECIMALS = 4
export const BASE_DECIMALS = 18
export const DISPLAY_DECIMALS = 2
export const SMALL_NUMBER_DISPLAY_DECIMALS = 4

export const GWEI_PRECISION = 9
export const GWEI_UNIT = 1000000000

export const DEBOUNCED_INPUT_TIME = 600

export const OPEN_SEA_BASE_URL = 'https://opensea.io/'
export const QUIXOTIC_BASE_URL = 'https://qx.app/'
export const STRATOS_BASE_URL = 'https://stratosnft.io/'
export const AELIN_APP_DEV_URL = 'https://testnet.app.aelin.xyz'

export const POOL_NAME_MAX_LENGTH = 30

export const MAX_PRIVATE_ROWS = 20

export const MERKLE_TREE_DATA_EMPTY = {
  index: 0,
  account: ZERO_ADDRESS,
  amount: ZERO_BN,
  merkleProof: [HashZero],
}
