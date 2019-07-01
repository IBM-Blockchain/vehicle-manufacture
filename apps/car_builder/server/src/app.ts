/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
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
