// eslint-disable-next-line @typescript-eslint/no-var-requires,import/no-extraneous-dependencies
const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd())

const codeGenOutDir = process.env.CODEGEN_OUTPUT_FILE || 'types/generated/queries.ts'

module.exports = {
  overwrite: true,
  schema: [
    //process.env.NEXT_PUBLIC_GRAPH_ENDPOINT_MAINNET,
    // process.env.GRAPH_ENDPOINT_OPTIMISM,
    'https://api.thegraph.com/subgraphs/name/aelin-xyz/aelin-mainnet',
    'https://api.thegraph.com/subgraphs/name/aelin-xyz/aelin-optimism',
  ],
  documents: 'src/queries/**/*.ts',
  generates: {
    [codeGenOutDir]: {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
        'plugin-typescript-swr',
      ],
    },
  },
  config: {
    rawRequest: false,
    // excludeQueries:
    // useSWRInfinite: ['poolsCreated'],
    autogenSWRKey: true,
  },
}
