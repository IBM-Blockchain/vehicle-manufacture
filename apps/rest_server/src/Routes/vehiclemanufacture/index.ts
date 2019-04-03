import FabricProxy from '../../fabricproxy';
import { Router } from 'express';
import { SystemContractRouter } from './contracts/system';
import { Router as IRouter } from '../../interfaces/router';
import { ParticipantContractRouter } from './contracts/participants';
import { VehicleContractRouter } from './contracts/vehicle';

export class LocnetRouter implements IRouter {
    private router: Router;
    private fabricProxy: FabricProxy;

    constructor (fabricProxy: FabricProxy) {
        this.router = Router();
        this.fabricProxy = fabricProxy;
    }

    public async prepareRoutes() {
        const sysContractRouter = new SystemContractRouter(this.fabricProxy);
        const participantContractRouter = new ParticipantContractRouter(this.fabricProxy);
        const vehicleContractRouter = new VehicleContractRouter(this.fabricProxy);

        await sysContractRouter.prepareRoutes();
        await participantContractRouter.prepareRoutes();
        await vehicleContractRouter.prepareRoutes();

        this.router.use(`/${SystemContractRouter.contractName}`, sysContractRouter.getRouter());
        this.router.use(`/${ParticipantContractRouter.contractName}`, participantContractRouter.getRouter());
        this.router.use(`/${VehicleContractRouter.contractName}`, vehicleContractRouter.getRouter());
    }

    public getRouter(): Router {
        return this.router;
    }
}
