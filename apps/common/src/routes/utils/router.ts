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
