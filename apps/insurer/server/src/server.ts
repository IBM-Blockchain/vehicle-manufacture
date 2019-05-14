import {setup} from './app';
import { ChannelName, ChaincodeName } from 'common';

const port = 4200; // Deal with this
async function createServer() {
    const app = await setup({
        walletPath: '../../installer/vehiclemanufacture_fabric/wallet/PrinceInsurance',
        connectionProfilePath: '../../installer/vehiclemanufacture_fabric/prince_connection.json',
        channelName: ChannelName,
        contractName: ChaincodeName,
        org: 'Arium'
    });
    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
}

createServer();