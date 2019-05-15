import { Response } from 'express';
import { ContractNames } from '../constants';
import FabricProxy from '../fabricproxy';
import { IRequest } from '../interfaces';
import Utils from '../utils';
import { ContractRouter } from './utils/contractRouter';
import { Enroll } from '../enroll';

export class ParticipantContractRouter extends ContractRouter {
    public static basePath = 'users';

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = ContractNames.participant;
    }

    public async prepareRoutes() {
        this.router.post('/enroll', async (req: IRequest, res: Response) => {
            try {
                await Enroll.enrollUser(this.fabricProxy.wallet, this.fabricProxy.ccp, req.body, req.user, this.fabricProxy.ccp.client.organization);
                res.send();
            } catch (err) {
                res.status(400);
                res.send('Error registering user. ' + err.message);
            }
        });


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
