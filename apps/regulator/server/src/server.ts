import { ChaincodeName, ChannelName, Config, DefaultLocalConnectionPath, DefaultLocalWalletPath } from 'common';
import { setup } from './app';

async function createServer() {
    const port = (await Config.readConfig()).regulator.port;

    const app = await setup({
        channelName: ChannelName,
        connectionProfilePath: DefaultLocalConnectionPath,
        contractName: ChaincodeName,
        org: 'VDA',
        walletPath: DefaultLocalWalletPath,
    });

    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
}

createServer();
