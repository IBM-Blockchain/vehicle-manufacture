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
import { ChaincodeStub } from 'fabric-shim';
import * as mockery from 'mockery';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Order, Policy, UsageEvent, Vehicle } from '../assets';
import { IState, State } from '../ledger-api/state';
import { StateList } from '../ledger-api/statelist';
import { AssetList, OrganizationList, ParticipantList } from '../lists';
import { Insurer, Manufacturer, Regulator } from '../organizations';
import { Task } from '../participants';

chai.should();
chai.use(sinonChai);

describe ('#Context', () => {

    let sandbox: sinon.SinonSandbox;

    let VehicleManufactureNetContext;

    class MockClientIdentity {
        constructor() {} // tslint:disable-line:no-empty
    }

    const MockVehicleManufactureNetClientIdentity = {
        VehicleManufactureNetClientIdentity: MockClientIdentity,
    };

    let context;

    before(() => {
        cleanCache();

        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach(() => {
        mockery.registerMock('./client-identity', MockVehicleManufactureNetClientIdentity);

        VehicleManufactureNetContext = requireVehicleManufactureNetContext();

        sandbox = sinon.createSandbox();
        context = new VehicleManufactureNetContext();
    });

    afterEach(() => {
        mockery.deregisterAll();

        cleanCache();

        sandbox.restore();
    });

    after(() => {
        mockery.disable();
    });

    describe ('constructor', () => {
        it ('should set all the properties correctly', () => {
            context.organizationList.should.be.instanceof(OrganizationList);
            testSupportedClasses(context.organizationList, [Manufacturer, Insurer, Regulator]);

            context.participantList.should.be.instanceof(ParticipantList);
            testSupportedClasses(context.participantList, [Task]);

            context.vehicleList.should.be.instanceof(AssetList);
            testSupportedClasses(context.vehicleList, [Vehicle]);

            context.orderList.should.be.instanceof(AssetList);
            testSupportedClasses(context.orderList, [Order]);

            context.policyList.should.be.instanceof(AssetList);
            testSupportedClasses(context.policyList, [Policy]);

            context.usageList.should.be.instanceof(AssetList);
            testSupportedClasses(context.usageList, [UsageEvent]);
        });
    });

    describe ('setEvent', () => {
        it ('should set event on stub', () => {
            const mockState = sinon.createStubInstance(State);
            mockState.serialize.returns(JSON.stringify({some: 'object'}));

            context.stub = sinon.createStubInstance(ChaincodeStub);
            (context.stub as sinon.SinonStubbedInstance<ChaincodeStub>).getTxTimestamp.returns({
                getSeconds: () => {
                    return {
                        toInt: () => {
                            return 1;
                        },
                    };
                },
            });

            context.setEvent('some name', mockState as any);

            mockState.serialize.should.have.been.calledOnceWithExactly();
            (context.stub as sinon.SinonStubbedInstance<ChaincodeStub>).setEvent
                .should.have.been.calledOnceWithExactly('some name', Buffer.from(JSON.stringify({
                    some: 'object',
                    timestamp: 1000,
                })));
        });
    });

    describe ('setClientIdentity', () => {
        let ciConstructorSpy: sinon.SinonSpy;

        beforeEach(() => {
            // NEED TO OVERWRITE OTHER MOCK TO ALLOW SPYING ON CONSTRUCTOR
            mockery.deregisterMock('./client-identity');

            ciConstructorSpy = sinon.spy(
                MockVehicleManufactureNetClientIdentity, 'VehicleManufactureNetClientIdentity',
            );
            mockery.registerMock('./client-identity', MockVehicleManufactureNetClientIdentity);

            cleanCache();

            VehicleManufactureNetContext = requireVehicleManufactureNetContext();

            context = new VehicleManufactureNetContext();
        });

        afterEach(() => {
            ciConstructorSpy.restore();
        });

        it ('should set the client identity', () => {
            // NEED TO USE MOCKERY ON VehicleManufactureNetClientIdentity

            context.setClientIdentity();

            context.clientIdentity.should.be.instanceof(MockClientIdentity);
            ciConstructorSpy.should.have.been.calledOnceWithExactly(context);
        });
    });
});

function testSupportedClasses(list: StateList<any>, expectedValues: Array<IState<any>>) {
    const listClasses = [];
    list.supportedClasses.forEach((value) => {
        listClasses.push(value);
    });

    listClasses.should.deep.equal(expectedValues);
}

function requireVehicleManufactureNetContext() {
    return require('./context').VehicleManufactureNetContext;
}

function cleanCache() {
    delete require.cache[require.resolve('./context')];
}
