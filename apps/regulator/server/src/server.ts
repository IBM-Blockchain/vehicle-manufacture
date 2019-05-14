import {setup} from './app';
import { ChannelName, ChaincodeName } from 'common';

const port = 6002; // Deal with this
async function createServer() {
    const app = await setup({
        walletPath: '../../installer/vehiclemanufacture_fabric/wallet/VDA',
        connectionProfilePath: '../../installer/vehiclemanufacture_fabric/vda_connection.json',
        channelName: ChannelName,
        contractName: ChaincodeName,
        org: 'Arium'
    });
    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
}

createServer();