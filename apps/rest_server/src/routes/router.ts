import FabricProxy from '../fabricproxy';
import { Router as ExpressRouter, Request as ExpressRequest, Response } from 'express';
import { IEvent } from '../interfaces/events';
import { v4 } from 'uuid';
import { ContractRouter } from './vehiclemanufacture/contracts/contractRouter';

interface ConnectionList {
    [key: string]: {
        [key: string]: {
            req: Request,
            res: Response
        }
    }
}

export interface Request extends ExpressRequest {
    user: string
}

export class BaseRouter {
    public static basePath = '';

    protected router: ExpressRouter;
    protected readonly fabricProxy: FabricProxy;
    protected connections: ConnectionList;
    protected subRouters: {new (fabricProxy: FabricProxy): BaseRouter, basePath: string}[];

    constructor (fabricProxy: FabricProxy) {
        this.router = ExpressRouter();
        this.fabricProxy = fabricProxy;
        this.connections = {};
        this.subRouters = [];
    }

    public getRouter() {
        return this.router;
    }

    public async prepareRoutes() {
        // do nothing
    }

    protected publishEvent(event: IEvent) {
        if (this.connections.hasOwnProperty(event.event_name)) {
            for (const key in this.connections[event.event_name]) {
                this.connections[event.event_name][key].res.write(`data: ${event.payload.toString()}\n\n`);
            };
        }
    }

    protected initEventSourceListener (req: Request, res: Response, connections: ConnectionList, eventName: string) {
        const uuid = v4();
    
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
    
        res.write('\n');
    
        if (!connections.hasOwnProperty(eventName)) {
            connections[eventName] = {};
        }
    
        connections[eventName][uuid] = {req, res};
    
        req.on('close', () => {
            delete connections[eventName][uuid];
        });
    };
}