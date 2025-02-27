/* eslint-disable react-hooks/rules-of-hooks */
import { useApolloTracing } from '@envelop/apollo-tracing'
import { createServer as createYogaServer } from '@graphql-yoga/node'
import { NextApiRequest, NextApiResponse } from 'next'
import { getBuiltMesh, rawServeConfig } from '../.mesh'

export async function createServer(endpoint: string) {
  // retrieve the mesh instance (with configured Envelop plugins)
  const mesh = await getBuiltMesh()

  const { cors, playgroundTitle } = rawServeConfig ?? {}

  // pass the Mesh instance to Yoga and configure GraphiQL
  return createYogaServer<{
    req: NextApiRequest
    res: NextApiResponse
  }>({
    plugins: [...mesh.plugins, useApolloTracing()],
    context: ({ req }) => ({ ...req, ...mesh.meshContext }),
    graphiql: {
      endpoint,
      title: playgroundTitle,
    },
    maskedErrors: false,
    parserCache: false,
    validationCache: false,
    logging: mesh.logger,
    cors,
  })
}
