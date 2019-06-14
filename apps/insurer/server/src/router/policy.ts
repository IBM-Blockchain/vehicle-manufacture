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
import { CONTRACT_NAMES, ContractRouter, FabricProxy, IRequest, Config } from 'common';
import { Response } from 'express';
import { v4 } from 'uuid';
import { EventNames } from '../constants';
import { post } from 'request-promise-native';

interface InsuranceRequest {
    requestId: string;
    vin: string;
    holderId: string;
    policyType: number;
    endDate: number;
}

export class PolicyRouter extends ContractRouter {
    public static basePath = 'policies';

    private requestInstances: InsuranceRequest[] = [];

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = CONTRACT_NAMES.vehicle;
    }

    public async prepareRoutes() {
        const manufacturerUrl = await Config.getAppUrl('manufacturer');

        this.router.get('/', await this.transactionToCall('getPolicies'));

        this.router.post('/', async (req: IRequest, res) => {
            (await this.transactionToCall('createPolicy'))(req, res);

            if (res.statusCode === 200) {
                const { vin, holderId } = req.body;
                for (const id in this.requestInstances) {
                    if (this.requestInstances.hasOwnProperty(id)) {
                        const requestInstance = this.requestInstances[id];
                        if (requestInstance.vin === vin && requestInstance.holderId === holderId) {
                            delete this.requestInstances[id];
                        }
                    }
                }
            }
        });

        this.router.post('/requests', (req: IRequest, res: Response) => {
            const newInsuranceRequest = Object.assign({requestId: v4()}, req.body) as InsuranceRequest;
            this.requestInstances.push(newInsuranceRequest);

            this.publishEvent({
                event_name: EventNames.REQUEST_POLICY,
                chaincodeId: null,
                txId: null,
                payload: Buffer.from(JSON.stringify(newInsuranceRequest))
            });

            res.send();
        });

        this.router.get('/events/requested', (req: IRequest, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.REQUEST_POLICY);

            this.requestInstances.forEach((ri) => this.publishEvent({
                event_name: EventNames.REQUEST_POLICY,
                payload: Buffer.from(JSON.stringify(ri))
            }));
        });

        this.router.get('/events/created', (req, res) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.CREATE_POLICY);
        });

        this.router.delete('/requests/:requestId', (req: IRequest, res: Response) => {
            this.requestInstances = this.requestInstances.filter((request) => {
                return request.requestId !== req.params.requestId;
            });

            res.send();
        });

        this.router.get('/:policyId', await this.transactionToCall('getPolicy'));

        this.router.get('/:policyId/usage', await this.transactionToCall('getPolicyEvents'));

        this.router.post('/:policyId/setup', async (req, res) => {
            const options = {
                body: req.body,
                json: true,
                headers: {
                    'Authorization': 'Basic ' + Buffer.from('prince:princepw').toString('base64')
                }
            };

            try {
                const data = await post(manufacturerUrl + '/node-red/api/vin', options);
                res.send(data);
            } catch (err) {
                res.status(500);
                res.send(err.message);
            }
        });

        await this.fabricProxy.addContractListener(
            'admin', 'createPolicy', EventNames.CREATE_POLICY, (err, event, txId, status, blockNumber) => {
                this.publishEvent(event);
            }, {filtered: false, replay: true},
        );
    }
}
