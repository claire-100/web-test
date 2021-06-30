import React from 'react';
import ReactDOM from 'react-dom';

/* -------------------- 載入 Aplollo 相關套件 -------------------- */
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';
import { split } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';

import "antd/dist/antd.css";
import App from './App';

const url = new URL("/graphql", window.location.href);

/* -------------------------------------------------------------------------- */
/*                                   GraphQL                                  */
/* -------------------------------------------------------------------------- */
// Create an http link:
const httpLink = new HttpLink({
//     uri: 'http://web-f.herokuapp.com/graphql',
     uri: url.href,
});

// Create a WebSocket link:
const wsLink = new WebSocketLink({
//     uri: `ws://web-f.herokuapp.com/graphql`,
    uri: url.href.replace("http", "ws"),
    options: {reconnect: true},
});


// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
    // split based on operation type
    ({query}) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpLink,
);

const client = new ApolloClient({
    link,
    cache: new InMemoryCache().restore({}),
});


/* -------------------------------------------------------------------------- */
/*                                   Render                                   */
/* -------------------------------------------------------------------------- */
ReactDOM.render(
    <React.StrictMode>
        <ApolloProvider client={client}>
            <App/>
        </ApolloProvider>
    </React.StrictMode>
    ,
    document.getElementById('root')
);
