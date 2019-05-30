import {setup} from './app';
import { ChannelName, ChaincodeName, DefaultLocalConnectionPath, DefaultLocalWalletPath, Config } from 'common';

async function createServer() {
    const port = (await Config.readConfig()).insurer.port;

    const app = await setup({
        walletPath: DefaultLocalWalletPath,
        connectionProfilePath: DefaultLocalConnectionPath,
        channelName: ChannelName,
        contractName: ChaincodeName,
        org: 'PrinceInsurance'
    });

    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
}

createServer();
