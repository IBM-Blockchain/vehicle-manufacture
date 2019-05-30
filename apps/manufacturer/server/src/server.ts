import { ChaincodeName, ChannelName, Config, DefaultLocalConnectionPath, DefaultLocalWalletPath } from 'common';
import * as express from 'express';
import * as http from 'http';
import * as RED from 'node-red';
import * as path from 'path';
import { setup } from './app';

async function createServer() {
    const port = (await Config.readConfig()).manufacturer.port;

    const app = express();

    const server = http.createServer(app);

    const nodeRedSettings = {
        flowFile: path.join(__dirname, '../../config/node-red-flow.json'),
        httpAdminRoot: '/node-red',
        httpNodeRoot: '/node-red/api',
    };

    RED.init(server, nodeRedSettings);

    app.use(nodeRedSettings.httpAdminRoot, RED.httpAdmin);
    app.use(nodeRedSettings.httpNodeRoot, RED.httpNode);

    await setup(app, {
        channelName: ChannelName,
        connectionProfilePath: DefaultLocalConnectionPath,
        contractName: ChaincodeName,
        org: 'Arium',
        walletPath: DefaultLocalWalletPath,
    });

    server.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });

    RED.start();
}

createServer();
