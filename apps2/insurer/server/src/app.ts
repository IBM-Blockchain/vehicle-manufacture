import { setupMiddleware, authHandlerFactory, IFabricConfig, FabricProxy } from 'common';
import * as express from 'express';
import * as path from 'path';
import { Router } from './router/router';
import { getAuth } from './utils';

export async function setup(config: IFabricConfig) {
    const app = express();

    setupMiddleware(app);

    app.use(express.static(path.join(__dirname, '../../client/dist')));

    const fabricProxy = new FabricProxy(config);

    const router = new Router(fabricProxy);

    await router.prepareRoutes();

    app.use('/api', authHandlerFactory(getAuth), router.getRouter());

    app.use('/api/*', (req, res) => {
        res.status(404);
        res.send('No endpoint here. Go away');
    });

    app.use('/*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });

    return app;
}
