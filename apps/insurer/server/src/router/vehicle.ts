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
import { ContractRouter, FabricProxy, CONTRACT_NAMES, IRequest, Config } from 'common';
import { Response } from 'express';
import { v4 } from 'uuid';
import { EventNames } from '../constants';

interface InsuranceRequest {
    requestId: string;
    vin: string;
    holderId: string;
    policyType: number;
    endDate: number;
}

export class VehicleRouter extends ContractRouter {
    public static basePath = 'vehicles';

    private vinsListeningOn: string[];

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = CONTRACT_NAMES.vehicle;

        this.vinsListeningOn = [];
    }

    public async prepareRoutes() {
        const manufacturerUrl = await Config.getAppApiUrl('manufacturer');

        this.router.get('/usage', await this.transactionToCall('getUsageEvents'));

        this.router.get('/usage/events/added', (req: IRequest, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.ADD_USAGE_EVENT);
        });

        this.router.get('/:vin/telemetry', (req: IRequest, res: Response) => {
            const vin = req.params.vin;
            const eventType = vin + '-TELEMETRY';
            const telemtryURL = `${manufacturerUrl}/vehicles/${vin}/telemetry`;

            this.initEventSourceListener(req, res, this.connections, eventType);


            if (!this.vinsListeningOn.includes(vin) || this.eventSourceTimedOut(vin)) {
                if(!this.vinsListeningOn.includes(vin)) {
                    this.vinsListeningOn.push(vin);
                }

                this.setupEventListener(telemtryURL, (evt) => {
                    this.publishEvent({
                        event_name: eventType,
                        payload: Buffer.from(evt.data),
                    });
                });
            }
        });

        this.router.get('/:vin', await this.transactionToCall('getVehicle'));

        await this.fabricProxy.addContractListener('admin', 'addUsageEvent', EventNames.ADD_USAGE_EVENT, (err, event) => {
            this.publishEvent(event);
        }, {filtered: false, replay: true});
    }
}
