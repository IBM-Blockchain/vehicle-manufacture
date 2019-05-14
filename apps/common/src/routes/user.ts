import { Response } from 'express';
import { ContractNames } from '../constants';
import FabricProxy from '../fabricproxy';
import { IRequest } from '../interfaces';
import Utils from '../utils';
import { ContractRouter } from './utils/contractRouter';

export class ParticipantContractRouter extends ContractRouter {
    public static basePath = 'users';

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = ContractNames.participant;
    }

    public async prepareRoutes() {
        this.router.post('/:participantType/register', async (req: IRequest, res: Response) => {
            if (req.params.participantType === 'registrar') {
                req.body.manufacturerCode = '';
                req.body.originCode = '';
            }

            return (
                await this.transactionToCall(
                    'register' + Utils.upperFirstChar(req.params.participantType),
                    false,
                )
            )(req, res);
        });
    }
}
