import { ApolloClient, InMemoryCache, createHttpLink, from, split } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

// HTTP link for queries and mutations
const httpLink = createHttpLink({
  uri: 'http://localhost:3200/graphql',
})

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:3200/graphql',
}))

// Split links based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink
)

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken')
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
})

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    )
  if (networkError) console.log(`[Network error]: ${networkError}`)
})

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, splitLink]),
  cache: new InMemoryCache(),
})
