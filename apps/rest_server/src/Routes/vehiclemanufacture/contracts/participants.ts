import { Router } from 'express';
import FabricProxy from '../../../fabricproxy';
import { transactionToCall } from '../../utils';
import { Router as IRouter } from '../../../interfaces/router';
import { ChaincodeMetadata } from '../../../interfaces/metadata_interfaces';
import { SystemContractRouter } from './system';

export class ParticipantContractRouter implements IRouter {
    public static contractName = 'org.acme.vehicle_network.participants';

    private router: Router;
    private fabricProxy: FabricProxy;

    constructor(fabricProxy: FabricProxy) {
        this.router = Router();
        this.fabricProxy = fabricProxy;
    }

    public async prepareRoutes() {
        const metadataBuff = await this.fabricProxy.evaluateTransaction('system', SystemContractRouter.contractName + ':GetMetadata');
        const metadata = JSON.parse(metadataBuff.toString()) as ChaincodeMetadata;

        metadata.contracts[ParticipantContractRouter.contractName].transactions.filter((transaction) => {
            return transaction.tag.includes('submitTx'); // get all submit transactions as handled others above
        }).forEach((transaction) => {
            const splitName = transaction.name.replace( /([A-Z])/g, " $1" ).split(' ');
            this.router.post('/' + splitName[1].toLowerCase() + '/' + splitName[0].toLowerCase(), transactionToCall(this.fabricProxy, transaction, ParticipantContractRouter.contractName));
        });
    }

    public getRouter(): Router {
        return this.router;
    }
}
