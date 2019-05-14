import { Response } from 'express';
import { ContractRouter, FabricProxy, IRequest, Utils, ContractNames } from 'common';

export class ParticipantContractRouter extends ContractRouter {
    public static basePath = 'users';

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);
        this.contractName = ContractNames.participant;
    }

    public async prepareRoutes() {
        this.router.post('/:participantType/register', async (req: IRequest, res: Response) => {
            return (
                await this.transactionToCall(
                    'register' + Utils.upperFirstChar(req.params.participantType),
                )
            )(req, res);
        });
    }
}