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
            contractName: 'vehicle-manufacture-chaincode',
            org: this.config.org
        });

        this.app = express();
        const whitelist = ['http://localhost:6001', 'http://localhost:8100', 'http://localhost:4200']        

        this.app.use((req, res, next) => {
            //Enabling CORS
            const origin = req.header('Origin');

            if (whitelist.includes(origin)) {
                res.header('Access-Control-Allow-Origin', origin);
            }

            res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            res.header('Access-Control-Allow-Credentials', 'true')

            if ('OPTIONS' === req.method) {
                res.send(200);
                return;
            }

            next();
        });

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        // this.app.use(cors());

        const auth = (req: Request, res, next) => {
            if (!req.url.includes('events')) {
                // hack - cannot add auth via EventSource could mess around with cookies for handling auth instead
                try {
                    req.user = Utils.getAuth(req);
                } catch (err) {
                    return next(err);
                }
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
