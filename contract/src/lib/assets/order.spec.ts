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
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { State } from '../ledger-api/state';
import { Asset } from './asset';
import { Order, OrderStatus } from './order';

const should = chai.should();
chai.use(sinonChai);

describe ('#Order', () => {
    const mockVehicleDetails = {
        colour: 'some colour',
        makeId: 'some make',
        modelType: 'some model',
    };

    const mockOptions = {
        extras: ['some', 'extras'],
        interior: 'some interior',
        trim: 'some trim',
    };

    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('getClass', () => {
        it ('should call generate class with the class name', () => {
            const generateClassSpy = sandbox.stub(Asset, 'generateClass');

            Order.getClass();

            generateClassSpy.should.have.been.calledOnceWithExactly(Order.name);
        });
    });

    describe ('constructor', () => {

        beforeEach(() => {
            sandbox.stub(Asset, 'generateClass').withArgs('Order').returns('some class');
            sandbox.stub(State, 'makeKey').withArgs(['some id']).returns('some key');
        });

        it ('should set the properties', () => {
            const order = new Order(
                'some id', mockVehicleDetails, OrderStatus.DELIVERED, mockOptions, 'some orderer', 1234567890,
            );

            (order as any).class.should.deep.equal('some class');
            (order as any).key.should.deep.equal('some key');
            order.vehicleDetails.should.deep.equal(mockVehicleDetails);
            order.orderStatus.should.deep.equal(OrderStatus.DELIVERED);
            (order as any).options.should.deep.equal(mockOptions);
            order.ordererId.should.deep.equal('some orderer');
            (order as any).placed.should.deep.equal(1234567890);
            should.equal(order.vin, undefined);
        });

        it ('should set the vin when sent', () => {
            const order = new Order(
                'some id', mockVehicleDetails, OrderStatus.DELIVERED, mockOptions, 'some orderer', 1234567890,
                'some vin',
            );

            (order as any).class.should.deep.equal('some class');
            (order as any).key.should.deep.equal('some key');
            order.vehicleDetails.should.deep.equal(mockVehicleDetails);
            order.orderStatus.should.deep.equal(OrderStatus.DELIVERED);
            (order as any).options.should.deep.equal(mockOptions);
            order.ordererId.should.deep.equal('some orderer');
            (order as any).placed.should.deep.equal(1234567890);
            order.vin.should.deep.equal('some vin');
        });
    });

    describe ('orderStatus', () => {
        it ('should error when trying to go backwards in status', () => {
            const order = new Order(
                'some id', mockVehicleDetails, OrderStatus.DELIVERED, mockOptions, 'some orderer', 1234567890,
                'some vin',
            );

            (() => {
                order.orderStatus = OrderStatus.DELIVERED - 1;
            }).should.throw('Status of order cannot go backwards or remain the same');
        });

        it ('should error when trying to set same status', () => {
            const order = new Order(
                'some id', mockVehicleDetails, OrderStatus.DELIVERED, mockOptions, 'some orderer', 1234567890,
                'some vin',
            );

            (() => {
                order.orderStatus = OrderStatus.DELIVERED;
            }).should.throw('Status of order cannot go backwards or remain the same');
        });

        it ('should error when trying to skip an order step', () => {
            const order = new Order(
                'some id', mockVehicleDetails, OrderStatus.VIN_ASSIGNED, mockOptions, 'some orderer', 1234567890,
                'some vin',
            );

            (() => {
                order.orderStatus = OrderStatus.DELIVERED;
            }).should.throw('Cannot skip order status step');
        });

        it ('should change the order status', () => {
            const order = new Order(
                'some id', mockVehicleDetails, OrderStatus.VIN_ASSIGNED, mockOptions, 'some orderer', 1234567890,
                'some vin',
            );

            order.orderStatus = OrderStatus.OWNER_ASSIGNED;

            order.orderStatus.should.deep.equal(OrderStatus.OWNER_ASSIGNED);
        });
    });

    describe ('madeByOrg', () => {
        it ('should return false when makeId does not match orgId', () => {
            const order = new Order(
                'some id', mockVehicleDetails, OrderStatus.VIN_ASSIGNED, mockOptions, 'some orderer', 1234567890,
                'some vin',
            );

            order.madeByOrg('not' + mockVehicleDetails.makeId).should.deep.equal(false);
        });

        it ('should return true when makeId does match orgId', () => {
            const order = new Order(
                'some id', mockVehicleDetails, OrderStatus.VIN_ASSIGNED, mockOptions, 'some orderer', 1234567890,
                'some vin',
            );

            order.madeByOrg(mockVehicleDetails.makeId).should.deep.equal(true);
        });
    });
});
