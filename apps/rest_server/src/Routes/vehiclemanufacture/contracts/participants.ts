import { Router } from 'express';
import FabricProxy from '../../../fabricproxy';
import { handleRouterCall } from '../../utils';
import { Router as IRouter } from '../../../interfaces/router';

export class ParticipantContractRouter implements IRouter {
    public static contractName = 'org.acme.vehicle_network.participants';

    private router: Router;
    private fabricProxy: FabricProxy;

    constructor(fabricProxy: FabricProxy) {
        this.router = Router();
        this.fabricProxy = fabricProxy;
    }

    public async prepareRoutes() {
        this.router.post('/registerParticipant', (req, res) => {
            handleRouterCall(req, res, this.fabricProxy, ParticipantContractRouter.contractName + ':' + 'registerParticipant', [], 'submitTransaction', false);
        });
    }

    public getRouter(): Router {
        return this.router;
    }
}
