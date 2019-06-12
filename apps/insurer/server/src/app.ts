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
import { setupMiddleware, IFabricConfig, FabricProxy } from 'common';
import * as express from 'express';
import * as path from 'path';
import { Router } from './router/router';
import { getAuth, authHandlerFactory } from './utils';

export async function setup(config: IFabricConfig) {
    const app = express();

    setupMiddleware(app);

    app.use(express.static(path.join(__dirname, '../../client/dist/insurer')));

    const fabricProxy = new FabricProxy(config);

    const router = new Router(fabricProxy);

    await router.prepareRoutes();

    app.use('/api', authHandlerFactory(getAuth), router.getRouter());

    app.use('/api/*', (req, res) => {
        res.status(404);
        res.send('No endpoint here. Go away');
    });

    app.use('/*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/dist/insurer/index.html'));
    });

    return app;
}
