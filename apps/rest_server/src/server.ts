'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import FabricProxy from './fabricproxy';
import { ServerConfig } from './interfaces/config';
import { Swagger } from './interfaces/swagger';
import { Router } from './routes';
import Utils from './utils';

export interface Request extends express.Request {
    user?: string;
}

export default class RestServer {

    private config: ServerConfig;
    private swagger: Swagger;

    private app: express.Application;

    public constructor(config: ServerConfig) {
        this.config = config;
        this.swagger = {
            openapi: '3.0.0',
        } as Swagger;
    }

    public async start() {
        const fabricProxy = new FabricProxy({
            walletPath: this.config.walletPath,
            connectionProfilePath: this.config.connectionProfilePath,
            channelName: 'vehiclemanufacture',
            contractName: 'vehicle-manufacture-chaincode'
        });

        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));

        const auth = (req: Request, res, next) => {
            if (!req.url.includes('events')) {
                // hack - cannot add auth via EventSource could mess around with cookies for handling auth instead
                req.user = Utils.getAuth(req);
            }

            next();
        }

        const router = new Router(fabricProxy);
        await router.prepareRoutes();

        this.app.get('/', (req, res) => {
            res.send('Server up');
        });

        this.app.use('/', auth, router.getRouter());

        this.app.listen(this.config.port, () => {
            console.log(`Server listening on port ${this.config.port}!`);
        });
    }
}
