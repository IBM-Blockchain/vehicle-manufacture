/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { Response } from 'express';
import { ContractRouter, Enroll, FabricProxy, IRequest, CONTRACT_NAMES } from 'common';

export class ParticipantContractRouter extends ContractRouter {
    public static basePath = 'users';

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);
        this.contractName = CONTRACT_NAMES.participant;
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
    }
}
