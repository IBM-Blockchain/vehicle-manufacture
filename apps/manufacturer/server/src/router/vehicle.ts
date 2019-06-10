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
import { ContractRouter, FabricProxy, CONTRACT_NAMES, IRequest } from 'common';
import { Response } from 'express';

const EventNames = {
    PLACE_ORDER: 'PLACE_ORDER',
    UPDATE_ORDER: 'UPDATE_ORDER',
    CREATE_POLICY: 'CREATE_POLICY',
    ADD_USAGE_EVENT: 'ADD_USAGE_EVENT'
};

export class VehicleRouter extends ContractRouter {
    public static basePath = 'vehicles';

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = CONTRACT_NAMES.vehicle;
    }

    public async prepareRoutes() {
        this.router.get('/', await this.transactionToCall('getVehicles'));

        this.router.get('/usage', await this.transactionToCall('getUsageEvents'));

        this.router.get('/usage/events/added', (req: IRequest, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.ADD_USAGE_EVENT);
        });

        this.router.post('/:vin/usage', await this.transactionToCall('addUsageEvent'));

        this.router.get('/:vin/telemetry', (req, res) => {
            this.initEventSourceListener(req, res, this.connections, req.params.vin + '-TELEMETRY');
        })

        this.router.post('/:vin/telemetry', (req, res) => {
            this.publishEvent({
                event_name: req.params.vin + '-TELEMETRY',
                payload: Buffer.from(JSON.stringify(req.body)),
            });
            res.send();
        });

        this.router.get('/:vin', await this.transactionToCall('getVehicle'));

        await this.fabricProxy.addContractListener('admin', 'addUsageEvent', EventNames.ADD_USAGE_EVENT, (err, event) => {
            this.publishEvent(event);
        }, {filtered: false, replay: true});
    }
}
