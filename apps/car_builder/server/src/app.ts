import { setupMiddleware, authHandlerFactory } from 'common';
import * as path from 'path';
import * as express from 'express';
import { Router } from './router/router';

export async function setup(): Promise<express.Application> {
    const app = express();

    app.use(express.static(path.join(__dirname, '../../client/www')));

    setupMiddleware(app);

    const router = new Router();

    await router.prepareRoutes();

    app.use('/api', authHandlerFactory(), router.getRouter());

    app.get('/*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/www', 'index.html'));
    });

    return app;
}
