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
import * as fs from 'fs-extra';
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

    app.use('/assets/images/vehicles/:make/:model/:colour', async (req, res) => {
        let colour1 = '#F00';
        let colour2 = '#0F0';

        switch (req.params.colour.toLowerCase()) {
            case 'sunburst_orange': colour1 = '#ffa047'; colour2 = '#d97122'; break;
            case 'inferno_red': colour1 = '#f5515f'; colour2 = '#9f031b'; break;
            case 'royal_purple': colour1 = '#c96dd8'; colour2 = '#912ba1'; break;
            case 'alpine_green': colour1 = '#b4ed50'; colour2 = '#429321'; break;
            case 'statement_blue': colour1 = '#51f5eb'; colour2 = '#03939f'; break;
            case 'vibrant_grape': colour1 = '#dd5589'; colour2 = '#ae2358'; break;
        }

        let file = (await fs.readFile(
            path.join(
                __dirname,
                '../../client/src/assets/images',
                req.params.make.toLowerCase() + '_' + req.params.model.toLowerCase() + '.tmpl'
            )
        )).toString();

        file = file.split('{{COLOUR_1}}').join(colour1);
        file = file.split('{{COLOUR_2}}').join(colour2);

        res.setHeader('content-type', 'image/svg+xml');
        res.send(file);
    });

    app.use('/*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/dist/insurer/index.html'));
    });

    return app;
}
