import FabricProxy from '../fabricproxy';
import { Router as ExpressRouter } from 'express';
import { LocnetRouter } from './vehiclemanufacture';
import { Router as IRouter } from '../interfaces/router';

export class Router implements IRouter {
    private router: ExpressRouter;
    private fabricProxy: FabricProxy;

    constructor (fabricProxy: FabricProxy) {
        this.router = ExpressRouter();
        this.fabricProxy = fabricProxy;
    }

    public async prepareRoutes() {

        const locnetRouter = new LocnetRouter(this.fabricProxy);

        await locnetRouter.prepareRoutes();

        this.router.use(locnetRouter.getRouter());
    }

    public getRouter() {
        return this.router;
    }
}