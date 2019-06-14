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
import { Response, Router as ExpressRouter } from 'express';
import { v4 } from 'uuid';
import FabricProxy from '../../fabricproxy';
import { IEvent } from '../../interfaces/events';
import { IRequest } from '../../interfaces/expressextensions';

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

    constructor() {
        this.router = ExpressRouter();
        this.connections = {};
        this.subRouters = [];
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
}
