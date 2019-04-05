import { Router } from 'express';
import FabricProxy from '../../../fabricproxy';
import { ChaincodeMetadata } from '../../../interfaces/metadata_interfaces';
import { Router as IRouter } from '../../../interfaces/router';
import { handleRouterCall, transactionToCall } from '../../utils';
import { SystemContractRouter } from './system';

export class VehicleContractRouter implements IRouter {
    public static contractName = 'org.acme.vehicle_network.vehicles';

    private router: Router;
    private fabricProxy: FabricProxy;

    constructor(fabricProxy: FabricProxy) {
        this.router = Router();
        this.fabricProxy = fabricProxy;
    }

    public async prepareRoutes() {
        const metadataBuff = await this.fabricProxy.evaluateTransaction('system', SystemContractRouter.contractName + ':GetMetadata');
        const metadata = JSON.parse(metadataBuff.toString()) as ChaincodeMetadata;

        this.router.post('/orders', (req, res) => {
            handleRouterCall(req, res, this.fabricProxy, VehicleContractRouter.contractName + ':' + 'getOrders', [], 'evaluateTransaction', false);
        });

        // auto do the rest as I'm lazy
        metadata.contracts[VehicleContractRouter.contractName].transactions.filter((transaction) => {
            return transaction.tag.includes('submitTx'); // get all submit transactions as handled others above
        }).forEach((transaction) => {
            this.router.post('/' + transaction.name, transactionToCall(this.fabricProxy, transaction, VehicleContractRouter.contractName));
        });
    }

    public getRouter(): Router {
        return this.router;
    }
}
