import FabricProxy from '../../../fabricproxy';
import { ContractRouter } from './contractRouter';

const contractName = 'org.hyperledger.fabric';

export class SystemContractRouter extends ContractRouter {
    public static basePath: string = contractName;

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = contractName;
    }

    public async prepareRoutes() {
        this.router.get('/metadata', await this.transactionToCall('GetMetadata', true));
    }
}
