// Note: Add "type": "module" to the package.json before running the script
import 'isomorphic-fetch'

import cheerio from 'cheerio'
import detenv from 'dotenv'
import fs from 'fs/promises'
import puppeteer, { Browser, Page } from 'puppeteer'

import OpenSeaMainnetResponse from '../data/open-sea-mainnet-response.json' assert { type: 'json' }
import OpenSeaPolygonResponse from '../data/open-sea-polygon-response.json' assert { type: 'json' }
import QuixoticResponse from '../data/quixotic-response.json' assert { type: 'json' }
import StratosResponse from '../data/stratos-response.json' assert { type: 'json' }
import { Chains } from '@/src/constants/chains'

detenv.config({ path: '.env.local' })

const MAX_OPEN_SEA_MAINNET_ITEMS = 100
const MAX_OPEN_SEA_POLYGON_ITEMS = 100
const MAX_QUIXOTIC_ITEMS = 50
const MAX_STRATOS_ITEMS = 50

type OpenSeaMainnetCollection = {
  node: {
    isVerified: boolean
    logo: string
    name: string
    slug: string
    statsV2: {
      floorPrice: { eth: string } | null
      numOwners: number
      totalSupply: number
      totalVolume: { unit: string }
    }
  }
}

type OpenSeaPolygonCollection = {
  node: {
    isVerified: boolean
    logo: string | null
    name: string
    slug: string
    windowCollectionStats: {
      floorPrice: { eth: string } | null
      numOwners: number
      totalSupply: number
      volume: { unit: string }
    }
  }
}

type QuixoticCollection = {
  name: string
  slug: string | null
  image_url: string
  owners: number
  supply: number
  verified: boolean
  volume: number
  floor: number | null
  address: string
}

type StratosCollection = {
  name: string
  slug: string | null
  image_url: string
  owners: number
  supply: number
  verified: boolean
  volume: number
  floor: number | null
  address: string
}

type NFTCollections = {
  id: string
  address: string
  name: string
  slug: string | null
  imageUrl: string
  isVerified: boolean
  numOwners: number
  totalSupply: number
  floorPrice: number | null
  totalVolume: number | null
  network: number
}

const formatGwei = (wei: number) => wei / 1e8 / 10

const withBrowser = async (fn: (browser: Browser) => void) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized'],
    defaultViewport: null,
  })

  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

const withPage = (browser: Browser) => async (fn: (page: Page) => void) => {
  const page = await browser.newPage()

  await page.setDefaultNavigationTimeout(0)
  await page.setRequestInterception(true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page.on('request', async (req: any) => {
    if (
      req.resourceType() == 'stylesheet' ||
      req.resourceType() == 'font' ||
      req.resourceType() == 'image'
    ) {
      req.abort()
    } else {
      req.continue()
    }
  })

  try {
    return await fn(page)
  } finally {
    await page.close()
  }
}

const OpenSeaMainnetMetadataCollector = async () => {
  const collections = OpenSeaMainnetResponse.data.rankings.edges.slice(
    0,
    MAX_OPEN_SEA_MAINNET_ITEMS,
  )

  const metadata = await withBrowser(async (browser) => {
    return Promise.all(
      collections.map(async (collection: OpenSeaMainnetCollection, index: number) => {
        const {
          isVerified,
          logo: imageUrl,
          name,
          slug,
          statsV2: { floorPrice, numOwners, totalSupply, totalVolume },
        } = collection.node

        return withPage(browser)(async (page) => {
          await page.goto(`https://api.opensea.io/api/v1/collection/${slug}?format=json`)

          const pageData = await page.evaluate(() => ({
            html: document.documentElement.innerHTML,
          }))

          const $ = cheerio.load(pageData.html)

          const content = $('pre').text()

          const json = JSON.parse(content)
          const contractMetadata = json.collection.primary_asset_contracts[0]
          const address = contractMetadata.address
          const contractType = contractMetadata.schema_name
            ? contractMetadata.schema_name.toLowerCase()
            : ''

          return {
            id: index,
            address,
            name,
            slug,
            imageUrl,
            isVerified,
            numOwners,
            totalSupply,
            contractType,
            floorPrice: floorPrice !== null ? Number(floorPrice.eth) : null,
            totalVolume: totalVolume !== null ? Number(totalVolume.unit) : null,
            network: Chains.mainnet,
            updatedAt: Date.now(),
          }
        })
      }),
    )
  })

  // Filter out if collection address is not found
  const metadataFiltered = (metadata as unknown as NFTCollections[]).filter(
    (collection: { address: string }) => {
      return collection.address.length !== 0
    },
  )

  return fs.writeFile(
    `${process.cwd()}/public/data/nft-metadata/open-sea-mainnet-metadata.json`,
    JSON.stringify(metadataFiltered, null, 2),
    'utf8',
  )
}

const OpenSeaPolygonMetadataCollector = async () => {
  const collections = OpenSeaPolygonResponse.data.rankings.edges.slice(
    0,
    MAX_OPEN_SEA_POLYGON_ITEMS,
  )

  const metadata = await withBrowser(async (browser) => {
    return Promise.all(
      collections.map(async (collection: OpenSeaPolygonCollection, index: number) => {
        const {
          isVerified,
          logo: imageUrl,
          name,
          slug,
          windowCollectionStats: { floorPrice, numOwners, totalSupply, volume },
        } = collection.node

        return withPage(browser)(async (page) => {
          await page.goto(`https://api.opensea.io/api/v1/collection/${slug}?format=json`)

          const pageData = await page.evaluate(() => ({
            html: document.documentElement.innerHTML,
          }))

          const $ = cheerio.load(pageData.html)

          const content = $('pre').text()

          const json = JSON.parse(content)
          const contractMetadata = json.collection.primary_asset_contracts[0]
          const address = contractMetadata.address
          const contractType = contractMetadata.schema_name
            ? contractMetadata.schema_name.toLowerCase()
            : ''

          return {
            id: index,
            address,
            name,
            slug,
            imageUrl,
            isVerified,
            numOwners,
            totalSupply,
            contractType,
            floorPrice: floorPrice !== null ? Number(floorPrice.eth) : null,
            totalVolume: volume !== null ? Number(volume.unit) : null,
            network: Chains.polygon,
            updatedAt: Date.now(),
          }
        })
      }),
    )
  })

  // Filter out if collection address is not found
  const metadataFiltered = (metadata as unknown as NFTCollections[]).filter(
    (collection: { address: string }) => {
      return collection.address.length !== 0
    },
  )

  return fs.writeFile(
    `${process.cwd()}/public/data/nft-metadata/open-sea-polygon-metadata.json`,
    JSON.stringify(metadataFiltered, null, 2),
    'utf8',
  )
}

const QuixoticMetadataCollector = async () => {
  const collections = QuixoticResponse.results.slice(0, MAX_QUIXOTIC_ITEMS)

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-API-KEY': process.env.QUIXOTIC_API_TOKEN || '',
    },
  }

  const metadata = await Promise.all(
    collections.map(async (collection: QuixoticCollection, index: number) => {
      const {
        address,
        floor: floorPrice,
        image_url: imageUrl,
        name,
        owners: numOwners,
        slug,
        supply: totalSupply,
        verified: isVerified,
        volume: totalVolume,
      } = collection

      const response = await fetch(
        `https://api.quixotic.io/api/v1/collection/${address}/`,
        options,
      ).then((response) => response.json())

      const { contract_type } = response

      return {
        id: index,
        name,
        slug,
        imageUrl,
        address,
        isVerified,
        numOwners,
        totalSupply,
        floorPrice: floorPrice ? formatGwei(floorPrice) : null,
        totalVolume: formatGwei(totalVolume),
        contractType: contract_type ? contract_type.toLowerCase().replace('-', '') : '',
        paymentSymbol: 'ETH',
        network: Chains.optimism,
        updatedAt: Date.now(),
      }
    }),
  )

  return fs.writeFile(
    `${process.cwd()}/public/data/nft-metadata/quixotic-metadata.json`,
    JSON.stringify(metadata, null, 2),
    'utf8',
  )
}

const StratosMetadataCollector = async () => {
  const collections = StratosResponse.results.slice(0, MAX_STRATOS_ITEMS)

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-API-KEY': process.env.STRATOS_API_TOKEN || '',
    },
  }

  const metadata = await Promise.all(
    collections.map(async (collection: StratosCollection, index: number) => {
      const {
        address,
        floor: floorPrice,
        image_url: imageUrl,
        name,
        owners: numOwners,
        slug,
        supply: totalSupply,
        verified: isVerified,
        volume: totalVolume,
      } = collection

      const response = await fetch(
        `https://api.stratosnft.io/api/v1/collection/${address}/`,
        options,
      ).then((response) => response.json())

      const { contract_type } = response

      return {
        id: index,
        name,
        slug,
        imageUrl,
        address,
        isVerified,
        numOwners,
        totalSupply,
        floorPrice: floorPrice ? formatGwei(floorPrice) : null,
        totalVolume: formatGwei(totalVolume),
        contractType: contract_type ? contract_type.toLowerCase().replace('-', '') : '',
        paymentSymbol: 'ETH',
        network: Chains.arbitrum,
        updatedAt: Date.now(),
      }
    }),
  )

  return fs.writeFile(
    `${process.cwd()}/public/data/nft-metadata/stratos-metadata.json`,
    JSON.stringify(metadata, null, 2),
    'utf8',
  )
}

Promise.all([
  OpenSeaMainnetMetadataCollector(),
  OpenSeaPolygonMetadataCollector(),
  QuixoticMetadataCollector(),
  StratosMetadataCollector(),
])
  .then(() => {
    console.log('Metadata has been collected successfully')
    process.exit()
  })
  .catch((err) => {
    console.log(err)
    process.exit(1)
  })
