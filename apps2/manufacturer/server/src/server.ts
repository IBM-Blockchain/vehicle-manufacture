import {setup} from './app';
import { ChannelName, ChaincodeName } from 'common';

const port = 6001; // Deal with this
async function createServer() {
    const { app, RED } = await setup({
        walletPath: '../../installer/vehiclemanufacture_fabric/wallet/Arium',
        connectionProfilePath: '../../installer/vehiclemanufacture_fabric/arium_connection.json',
        channelName: ChannelName,
        contractName: ChaincodeName,
        org: 'Arium'
    });

    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })

    RED.start();
}

createServer();