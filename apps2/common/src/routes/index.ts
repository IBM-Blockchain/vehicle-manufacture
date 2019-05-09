import FabricProxy from '../fabricproxy';
import { SystemContractRouter } from './system';
import { ParticipantContractRouter } from './user';
import { BaseRouter } from './utils/router';

export * from './system';
export * from './user';

export class Router extends BaseRouter {
    private fabricProxy: FabricProxy;

    constructor(fabricProxy: FabricProxy) {
        super();

        this.fabricProxy = fabricProxy;
        this.subRouters = [SystemContractRouter, ParticipantContractRouter];
    }

    public async prepareRoutes() {
        for (const subRouterClass of this.subRouters) {
            const subRouter = new subRouterClass(this.fabricProxy);

            await subRouter.prepareRoutes();

            this.router.use('/' + subRouterClass.basePath, subRouter.getRouter());
        }
    }
}
