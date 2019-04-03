import { Router } from 'express';
import FabricProxy from '../../../fabricproxy';
import { handleRouterCall } from '../../utils';
import { Router as IRouter } from '../../../interfaces/router';

export class SystemContractRouter implements IRouter {
    public static contractName: string = 'org.hyperledger.fabric';

    private router: Router;
    private fabricProxy: FabricProxy;

    constructor(fabricProxy: FabricProxy) {
        this.router = Router();
        this.fabricProxy = fabricProxy;
    }

    public async prepareRoutes() {
        this.router.get('/metadata', (req, res) => {
            handleRouterCall(req, res, this.fabricProxy, SystemContractRouter.contractName + ':GetMetadata', [], 'evaluateTransaction', true);
        });
    }

    public getRouter() {
        return this.router;
    }
}
