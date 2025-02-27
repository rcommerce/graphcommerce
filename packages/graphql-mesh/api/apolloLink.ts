/* eslint-disable import/no-extraneous-dependencies */

/**
 * This is a direct copy from
 * https://github.com/Urigo/graphql-mesh/blob/master/packages/apollo-link/src/index.ts but because
 * it throws an error we've created a local copy of it.
 *
 * https://github.com/apollographql/apollo-client/issues/9925
 * https://github.com/Urigo/graphql-mesh/issues/4196
 */

// export * from '@graphql-mesh/apollo-link'
import { ApolloLink, FetchResult, Observable, Operation, RequestHandler } from '@apollo/client/core'
import { ExecuteMeshFn, SubscribeMeshFn } from '@graphql-mesh/runtime'
import { isAsyncIterable } from '@graphql-tools/utils'
import { getOperationAST } from 'graphql'

export interface MeshApolloRequestHandlerOptions {
  execute: ExecuteMeshFn
  subscribe?: SubscribeMeshFn
}

const ROOT_VALUE = {}
function createMeshApolloRequestHandler(options: MeshApolloRequestHandlerOptions): RequestHandler {
  return function meshApolloRequestHandler(operation: Operation): Observable<FetchResult> {
    const operationAst = getOperationAST(operation.query, operation.operationName)
    if (!operationAst) {
      throw new Error('GraphQL operation not found')
    }
    const operationFn =
      operationAst.operation === 'subscription' && options.subscribe
        ? options.subscribe
        : options.execute

    return new Observable((observer) => {
      Promise.resolve()
        .then(async () => {
          const results = await operationFn(
            operation.query,
            operation.variables,
            operation.getContext(),
            ROOT_VALUE,
            operation.operationName,
          )
          if (isAsyncIterable(results)) {
            for await (const result of results) {
              if (observer.closed) {
                return
              }
              observer.next(result)
            }
            observer.complete()
          } else if (!observer.closed) {
            observer.next(results)
            observer.complete()
          }
        })
        .catch((error) => {
          if (!observer.closed) {
            observer.error(error)
          }
        })
    })
  }
}

export class MeshApolloLink extends ApolloLink {
  constructor(options: MeshApolloRequestHandlerOptions) {
    super(createMeshApolloRequestHandler(options))
  }
}
