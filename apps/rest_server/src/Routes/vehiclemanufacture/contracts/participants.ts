import { Router } from 'express';
import FabricProxy from '../../../fabricproxy';
import { transactionToCall, handleRouterCall, upperFirstChar } from '../../utils';
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
        this.router.post('/devices/telematic/register', await this.transactionToCall('registerTelematicsDevice'));

        this.router.post('/:participantType/register', async (req, res) => {
            return (await this.transactionToCall('register' + upperFirstChar(req.params.participantType)))(req, res);
        });
    }

    public getRouter(): Router {
        return this.router;
    }

    private async transactionToCall(transactionName: string) {
        return await transactionToCall(this.fabricProxy, transactionName, ParticipantContractRouter.contractName)
    }
}
