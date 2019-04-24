import FabricProxy from '../../../fabricproxy';
import {  upperFirstChar } from '../../utils';
import { ContractRouter } from './contractRouter';
import { Request } from '../../router';
import { Response } from 'express';

const contractName = 'org.acme.vehicle_network.participants';

export class ParticipantContractRouter extends ContractRouter {
    public static basePath = contractName;

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = contractName;
    }

    public async prepareRoutes() {
        this.router.post('/devices/telematic/register', await this.transactionToCall('registerTelematicsDevice'));

        this.router.post('/:participantType/register', async (req: Request, res: Response) => {
            return (await this.transactionToCall('register' + upperFirstChar(req.params.participantType)))(req, res);
        });
    }
}
