import {setup} from './app';
import { ChannelName, ChaincodeName, DefaultLocalConnectionPath, DefaultLocalWalletPath } from 'common';

const port = 6002; // Deal with this
async function createServer() {
    const app = await setup({
        walletPath: DefaultLocalWalletPath,
        connectionProfilePath: DefaultLocalConnectionPath,
        channelName: ChannelName,
        contractName: ChaincodeName,
        org: 'Arium'
    });
    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
}

createServer();