import {setup} from './app';
import { ChannelName, ChaincodeName } from 'common';

const port = 8100; // Deal with this
async function createServer() {
    const app = await setup();
    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
}

createServer();