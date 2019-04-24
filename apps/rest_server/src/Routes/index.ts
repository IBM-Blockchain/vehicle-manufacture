import FabricProxy from '../fabricproxy';
import { BaseRouter } from './router';
import { SystemContractRouter } from './vehiclemanufacture/contracts/system';
import { ParticipantContractRouter } from './vehiclemanufacture/contracts/participants';
import { VehicleContractRouter } from './vehiclemanufacture/contracts/vehicle';
import { IdentityRouter } from './identity/identity';

export class Router extends BaseRouter {
    constructor (fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.subRouters = [SystemContractRouter, ParticipantContractRouter, VehicleContractRouter, IdentityRouter];
    }

    public async prepareRoutes() {
        for (const SubRouter of this.subRouters) {
            const subRouter = new SubRouter(this.fabricProxy);

            await subRouter.prepareRoutes();

            this.router.use('/' + SubRouter.basePath, subRouter.getRouter());
        }
    }
}
