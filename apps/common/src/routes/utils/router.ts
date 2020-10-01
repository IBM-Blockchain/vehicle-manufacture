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
import * as EventSource from 'eventsource';
import { Response, Router as ExpressRouter } from 'express';
import { v4 } from 'uuid';
import FabricProxy from '../../fabricproxy';
import { IEvent } from '../../interfaces/events';
import { IRequest } from '../../interfaces/expressextensions';

const timeout = 600;

interface IConnectionList {
    [key: string]: {
        [key: string]: {
            req: IRequest,
            res: Response,
        },
    };
}

interface ISubRouter {
    basePath: string;
    new (fabricProxy?: FabricProxy): BaseRouter;
}

export class BaseRouter {
    public static basePath = '';

    protected router: ExpressRouter;
    protected connections: IConnectionList;
    protected subRouters: ISubRouter[];

    private eventSourceRetries: Map<string, number>;

    constructor() {
        this.router = ExpressRouter();
        this.connections = {};
        this.subRouters = [];
        this.eventSourceRetries = new Map();
    }

    public addSubRouter(subRouter: ISubRouter) {
        this.subRouters.push(subRouter);
    }

    public getRouter() {
        return this.router;
    }

    public async prepareRoutes() {
        for (const subRouterClass of this.subRouters) {
            const subRouter = new subRouterClass();

            await subRouter.prepareRoutes();

            this.router.use('/' + subRouterClass.basePath, subRouter.getRouter());
        }
    }

    protected publishEvent(event: IEvent) {
        if (this.connections.hasOwnProperty(event.event_name)) {
            const connections = this.connections[event.event_name];

            for (const key in connections) {
                if (connections.hasOwnProperty(key)) {
                    connections[key].res.write(`data: ${event.payload.toString()}\n\n`);
                }
            }
        }
    }

    protected initEventSourceListener(req: IRequest, res: Response, connections: IConnectionList, eventName: string) {
        const uuid = v4();

        res.writeHead(200, {
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Content-Type': 'text/event-stream',
        });

        res.write('\n');

        if (!connections.hasOwnProperty(eventName)) {
            connections[eventName] = {};
        }

        connections[eventName][uuid] = {req, res};
        this.connections = connections;

        req.on('close', () => {
            delete connections[eventName][uuid];
        });
    }

    protected setupEventListener(url: string, callback: (evt: MessageEvent) => void) {
        if (!this.eventSourceRetries.has(url)) {
            this.eventSourceRetries.set(url, 0);
        }

        const es = new EventSource(url);

        es.onopen = (evt) => {
            console.log('OPEN', evt);
            this.eventSourceRetries.set(url, 0);
        };

        es.onerror = (evt) => {
            console.log('ERROR', evt);

            let connectionRetries = this.eventSourceRetries.get(url);
            this.eventSourceRetries.set(url, ++connectionRetries);

            if (connectionRetries < timeout) {
                console.log('RETRYING CONNECTION', connectionRetries);

                setTimeout(() => {
                  this.setupEventListener(url, callback);
                }, 100);
            } else {
                console.log('CONNECTION TIMED OUT');
            }
        };

        es.onmessage = (evt) => {
            callback(evt);
        };
    }

    protected eventSourceTimedOut(url: string): boolean {
        if (!this.eventSourceRetries.has(url)) {
            throw new Error('Event source not created');
        }

        return !(this.eventSourceRetries.get(url) < timeout);
    }
}
