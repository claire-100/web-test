import express from "express";
import { ApolloServer, PubSub } from "apollo-server-express";
// import { GraphQLServer, PubSub } from 'graphql-yoga';
import { importSchema } from "graphql-import";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import WebSocket from 'ws'
import "dotenv-defaults/config.js";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import resolvers from "./backend/resolvers/index.js";
import db from "./db.js";
import Query from "./backend/resolvers/Query.js";
import Mutation from "./backend/resolvers/Mutation.js";
import Subscription from "./backend/resolvers/Subscription.js";

import {checkLogOut} from "./backend/utils/onCloseFunction.js";
import {generateTeleport} from "./backend/utils/generateTeleport.js";
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
// import { schema } from './backend/schema.graphql';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = 5000;

const typeDefs = importSchema("./backend/schema.graphql");
const pubsub = new PubSub();
const app = express();

app.use(cors());
// app.use("/api", apiRoute);
app.use('/graphql', bodyParser.json());
app.use(express.static(path.join(__dirname, "build")));
// app.get("/*", function (req, res) {
//   res.sendFile(path.join(__dirname, "build", "index.html"));
// });

const server = new ApolloServer({
  typeDefs,
  resolvers: resolvers,
  // subscriptions: "/subscriptions",
  context: {
    db,
    pubsub,
  },
});


server.applyMiddleware({ app });
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const port2 = 3000
const webserver = express()
    .listen(port2, () => console.log(`Listening on ${port2}`))


// const wss = new WebSocket.Server({ noServer: true });

// const wss = new WebSocket.Server({server: httpServer2});

const wss = new WebSocket.Server({server: webserver});


const intervalObj = {}  // 用來記錄 timeInterval 物件，之後才可刪除

wss.on('connection', function connection(client) {
    console.log("client 已連接")

    client.player = ""

    // 向 Client 傳送訊息，目前沒用到
    client.sendEvent = (e) => {
        return client.send(JSON.stringify(e))
    };

    // 接收 Client 訊息，目前只有 Login 與 GameRoom Host 可與 WebScoket 溝通
    client.on('message', async function incoming(message) {
        message = JSON.parse(message)
        const {type, data} = message

        // console.log("client 已連接",message,type,data)

        switch (type) {
            // 登入時紀錄玩家名稱
            case "LOGIN": {
                const {name} = data;
                client.player = name;
            }
            break;

            // Client 向 Server 申請自動產生傳送點
            case "REQUEST_TELEPORT_POSITION": {
                const {roomID, teleportCycle} = data;
                intervalObj[roomID] = setInterval(() => {
                    generateTeleport(roomID, db);
                }, teleportCycle * 1000);
            }
            break;

            // Client 向 Server 取消自動產生傳送點
            case "CANCEL_TELEPORT_POSITION": {
                const {roomID} = data;
                clearInterval(intervalObj[roomID]);
            }
                break;
            default:
                break;
        }
    });
    // disconnected
    client.once('close', () => {
        checkLogOut(client.player, db, intervalObj);    // Client 斷線時，到 DB 清除 Player 的紀錄
        console.log("client 已斷開")
    });
});

// });
// //========== subscriptionServer ============//
// //========== subscriptionServer ============//
// //========== subscriptionServer ============//

// const subscriptionServer = SubscriptionServer.create(
//   {
//     typeDefs,
//     execute,
//     subscribe,
//   },
//   {
//     server: wss,
//     path: '/subscriptions',
//   },
// );

// //========== no server 使用 ============//
// //========== no server 使用 ============//
// //========== no server 使用 ============//

// httpServer2.on('upgrade', function (request, socket, head) {
//   wss.handleUpgrade(request, socket, head, function (ws) {
//      wss.emit('connection', ws, request);
//   })
// })


httpServer.listen(port, () => {
  console.log(`🚀 Server Ready at ${port}! 🚀`);
  console.log(`Graphql Port at ${port}${server.subscriptionsPath}`);
});

// server.start({ port: process.env.PORT2 | 4000 }, () => {
//     console.log(`GraphQl Server listening at http://localhost:${process.env.PORT2 | 4000}`);
// })
