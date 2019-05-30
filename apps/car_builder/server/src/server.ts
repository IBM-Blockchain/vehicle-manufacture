import { Config } from 'common';
import { setup } from './app';

async function createServer() {
    const port = (await Config.readConfig()).carBuilder.port;
    const app = await setup();

    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
}

createServer();
