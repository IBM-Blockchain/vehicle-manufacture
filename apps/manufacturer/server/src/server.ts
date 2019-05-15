import { setup } from './app';
import * as express from 'express';
import { ChannelName, ChaincodeName, DefaultLocalConnectionPath, DefaultLocalWalletPath } from 'common';
import * as RED from 'node-red';
import * as path from 'path';
import * as http from 'http';

const port = 6001; // Deal with this
async function createServer() {
    const app = express();

    const server = http.createServer(app);

    const nodeRedSettings = {
        httpAdminRoot: '/node-red',
        httpNodeRoot: '/node-red/api',
        flowFile: path.join(__dirname, '../../config/node-red-flow.json')
    }

    RED.init(server, nodeRedSettings);

    app.use(nodeRedSettings.httpAdminRoot, RED.httpAdmin);
    app.use(nodeRedSettings.httpNodeRoot, RED.httpNode);

    await setup(app,{
        walletPath: DefaultLocalWalletPath,
        connectionProfilePath: DefaultLocalConnectionPath,
        channelName: ChannelName,
        contractName: ChaincodeName,
        org: 'Arium'
    });

    server.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })

    RED.start();
}

createServer();