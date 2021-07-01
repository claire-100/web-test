import { GraphQLServer, PubSub } from 'graphql-yoga';
import db from "./db.js";
import resolvers from "./backend/resolvers/index.js";
import http from 'http';
import WebSocket from 'ws';
import { importSchema } from "graphql-import";
import express from 'express';
import pkg from 'apollo-server-express';
const {graphqlExpress,graphiqlExpress,} = pkg;
// import {graphqlExpress,graphiqlExpress,} from 'apollo-server-express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { execute, subscribe } from 'graphql';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';


import {checkLogOut} from "./backend/utils/onCloseFunction.js";
import {generateTeleport} from "./backend/utils/generateTeleport.js";
// import { schema } from './backend/schema';

const schema = importSchema("./backend/schema.graphql");
const PORT = 5000;
const server = express();

server.use('*', cors({ origin: `http://localhost:${PORT}` }));

server.use('/graphql', bodyParser.json(), graphqlExpress({
  schema
}));

server.use('/graphql', graphiqlExpress({
  endpointURL: '/graphql',
  subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`
}));

// Wrap the Express server
const ws = createServer(server);
ws.listen(PORT, () => {
  console.log(`Apollo Server is now running on http://localhost:${PORT}`);
  // Set up the WebSocket for handling GraphQL subscriptions
  new SubscriptionServer({
    execute,
    subscribe,
    schema
  }, {
    server: ws,
    path: '/subscriptions',
  });
});