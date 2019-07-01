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

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fabricNetwork from 'fabric-network';
import { SmartContractUtil } from './ts-smart-contract-util';

import { User } from 'fabric-client';
import * as path from 'path';

chai.use(chaiAsPromised);
const expect = chai.expect;

const ARIUM_WALLET_PATH = path.join(__dirname, '../', '../', 'apps', 'manufacturer', 'vehiclemanufacture_fabric', 'wallet');
const VDA_WALLET_PATH = '';
const PRINCE_WALLET_PATH = '';

const ARIUM_CONNECTION_PATH = path.join(__dirname, '../', '../', 'apps', 'manufacturer', 'vehiclemanufacture_fabric', 'local_connection.json');
const VDA_CONNECTION_PATH = '';
const PRINCE_CONNECTION_PATH = '';

describe('org.acme.vehicle_network.vehicles-vehicle-manufacture-chaincode@0.1.0' , () => {
    let discoveryAsLocalhost: boolean;
    let discoveryEnabled: boolean;

    let connectionProfile: any;
    const ariumGateways: Map<string, fabricNetwork.Gateway> = new Map();
    let ca: any;
    let adminUser: User;
    let ariumWallet: fabricNetwork.FileSystemWallet;
    let vdaWallet: fabricNetwork.FileSystemWallet;
    let princeWallet: fabricNetwork.FileSystemWallet;

    before(async () => {
        connectionProfile = await SmartContractUtil.getConnectionProfile(ARIUM_CONNECTION_PATH);
    });

    beforeEach(async function() {
        this.timeout(100000);
        discoveryAsLocalhost = SmartContractUtil.hasLocalhostURLs(connectionProfile);
        discoveryEnabled = false;

        const ariumUsers = ['reports', 'orders', 'production', 'telematics', 'registrar'];
        ariumWallet = new fabricNetwork.FileSystemWallet(ARIUM_WALLET_PATH);
        for (const identity of ariumUsers) {
            const gateway = await SmartContractUtil.createGateway(
                connectionProfile,
                identity,
                ariumWallet,
                {discoveryAsLocalhost, discoveryEnabled},
            );
            ariumGateways.set(identity, gateway);
        }
    });

    afterEach(async () => {
        ariumGateways.forEach((g) => g.disconnect());
        ariumGateways.clear();
    });

    describe('#placeOrder', () => {
        let specialIdentity;
        beforeEach(async () => {
            specialIdentity = 'orders';
        });

        it('should successfully call', async () => {
            const ordererId: string = 'EXAMPLE';
            const vehicleDetails = {makeId: 'Arium'};
            const options = {};
            const args: string[] = [ ordererId, JSON.stringify(vehicleDetails), JSON.stringify(options)];
            const gateway = ariumGateways.get(specialIdentity);

            const response: any = await SmartContractUtil.submitTransaction(
                'org.acme.vehicle_network.vehicles', 'placeOrder', args, gateway,
            );
            expect(response.class).to.equal('org.acme.vehicle_network.assets.Order');
            expect(response.ordererId).to.equal(ordererId);
            expect(response.orderStatus).to.equal(0);
            expect(response.options).to.deep.equal(options);
            expect(response.vehicleDetails).to.deep.equal(vehicleDetails);

            const createdOrder: any = await SmartContractUtil.evaluateTransaction(
                'org.acme.vehicle_network.vehicles', 'getOrder', [response.id], gateway,
            );
            expect(createdOrder.class).to.equal('org.acme.vehicle_network.assets.Order');
            expect(createdOrder.ordererId).to.equal(ordererId);
            expect(createdOrder.orderStatus).to.equal(0);
            expect(createdOrder.options).to.deep.equal(options);
            expect(createdOrder.vehicleDetails).to.deep.equal(vehicleDetails);
        }).timeout(10000);

        it('should receive a contract event', async () => {
            const gateway = ariumGateways.get(specialIdentity);
            const contract = (await gateway.getNetwork('vehiclemanufacture'))
                                .getContract('vehicle-manufacture-chaincode');

            let eventTriggered = false;
            await contract.addContractListener('PLACE_ORDER', 'PLACE_ORDER', async (err, event) => {
                eventTriggered = true;
                console.log(event);
            }, {replay: false});

            const ordererId: string = 'EXAMPLE';
            const vehicleDetails = {makeId: 'Arium'};
            const options = {};
            const args: string[] = [ ordererId, JSON.stringify(vehicleDetails), JSON.stringify(options)];

            await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'placeOrder', args, gateway);

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Event not triggered'));
                }, 25000);
                const interval = setInterval(() => {
                    if (eventTriggered) {
                        clearInterval(interval);
                        clearTimeout(timeout);
                        resolve();
                    }
                }, 100);
            });
            expect(eventTriggered).to.equal(true);
        }).timeout(30000);

        it('should throw if called by a participant without ORDER_CREATE', async () => {
            const identity = 'registrar';
            const gateway = ariumGateways.get(identity);

            const ordererId: string = 'EXAMPLE';
            const vehicleDetails = {makeId: 'Arium'};
            const options = {};
            const args: string[] = [ ordererId, JSON.stringify(vehicleDetails), JSON.stringify(options)];

            await expect(SmartContractUtil.submitTransaction(
                    'org.acme.vehicle_network.vehicles',
                    'placeOrder',
                    args,
                    gateway,
                )).to.be.rejectedWith('Only callers with role order.create can place orders');

        }).timeout(2000);

        it('should throw if participant orgId and vehicle makeId do not match', async () => {
            const gateway = ariumGateways.get(specialIdentity);
            const ordererId: string = 'example';
            const vehicleDetails = {makeId: 'anotherManufacturer'};
            const options = {};
            const args: string[] = [ ordererId, JSON.stringify(vehicleDetails), JSON.stringify(options)];

            await expect(SmartContractUtil.submitTransaction(
                    'org.acme.vehicle_network.vehicles',
                    'placeOrder',
                    args,
                    gateway,
                )).to.be.rejectedWith('Callers may only create orders in their organisation');

        }).timeout(2000);
    });

    describe('#getOrders', () => {
        let specialIdentity;
        beforeEach(async () => {
            specialIdentity = 'orders';
        });

        it('should successfully call', async () => {
            const gateway = ariumGateways.get(specialIdentity);
            const args: string[] = [];
            const response: Buffer = await SmartContractUtil.submitTransaction(
                'org.acme.vehicle_network.vehicles',
                'getOrders',
                args,
                gateway,
            );
        }).timeout(10000);
    });

    // describe('#getOrder', () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const orderId: string = 'EXAMPLE';
    //         const args: string[] = [ orderId];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'getOrder', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#getOrderHistory', () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const orderId: string = 'EXAMPLE';
    //         const args: string[] = [ orderId];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'getOrderHistory', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#scheduleForManufacture', () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const orderId: string = 'EXAMPLE';
    //         const args: string[] = [ orderId];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'scheduleOrderForManufacture', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#registerVehicleForOrder', () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const orderId: string = 'EXAMPLE';
    //         const vin: string = 'EXAMPLE';
    //         const args: string[] = [ orderId, vin];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'registerVehicleForOrder', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#assignOwnershipForOrder', () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const orderId: string = 'EXAMPLE';
    //         const args: string[] = [ orderId];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'assignOwnershipForOrder', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#deliverOrder', () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const orderId: string = 'EXAMPLE';
    //         const args: string[] = [ orderId];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'deliverOrder', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#getVehicles', () => {
    //     it('should successfully call', async () => {
    //         // TODO: Update with parameters of transaction
    //         const args: string[] = [];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'getVehicles', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#getVehicle', () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const vin: string = 'EXAMPLE';
    //         const args: string[] = [ vin];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'getVehicle', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#createPolicy', () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const vin: string = 'EXAMPLE';
    //         const holderId: string = 'EXAMPLE';
    //         const policyType: number = 0;
    //         const endDate: number = 0;
    //         const args: string[] = [ vin, holderId, policyType.toString(), endDate.toString()];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'createPolicy', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#getPolicies', () => {
    //     it('should successfully call', async () => {
    //         // TODO: Update with parameters of transaction
    //         const args: string[] = [];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'getPolicies', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#getPolicy', () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const policyId: string = 'EXAMPLE';
    //         const args: string[] = [ policyId];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'getPolicy', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#addUsageEvent', () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const vin: string = 'EXAMPLE';
    //         const eventType: number = 0;
    //         const acceleration: number = 0;
    //         const airTemperature: number = 0;
    //         const engineTemperature: number = 0;
    //         const lightLevel: number = 0;
    //         const pitch: number = 0;
    //         const roll: number = 0;
    //         const args: string[] = [ vin, eventType.toString(), acceleration.toString(), airTemperature.toString(), engineTemperature.toString(), lightLevel.toString(), pitch.toString(), roll.toString()];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'addUsageEvent', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#getUsageEvents', () => {
    //     it('should successfully call', async () => {

    //         // TODO: Update with parameters of transaction
    //         const args: string[] = [];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'getUsageEvents', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#getVehicleEvents', () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const vin: string = 'EXAMPLE';
    //         const args: string[] = [ vin];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'getVehicleEvents', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

    // describe('#getPolicyEvents', async () => {
    //     it('should successfully call', async () => {
    //         // TODO: populate transaction parameters
    //         const policyId: string = 'EXAMPLE';
    //         const args: string[] = [ policyId];

    //         const response: Buffer = await SmartContractUtil.submitTransaction('org.acme.vehicle_network.vehicles', 'getPolicyEvents', args, gateway);
    //         // submitTransaction returns buffer of transcation return value
    //         // TODO: Update with return value of transaction
    //         assert.equal(true, true);
    //         // assert.equal(JSON.parse(response.toString()), undefined);
    //     }).timeout(10000);
    // });

});
