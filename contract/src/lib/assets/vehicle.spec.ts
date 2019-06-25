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
import { Manufacturer } from '../organizations';
import { Asset } from './asset';
import { Vehicle, VehicleStatus } from './vehicle';

chai.should();
chai.use(sinonChai);

describe ('#Vehicle', () => {
    let sandbox: sinon.SinonSandbox;

    const mockVehicleDetails = {
        colour: 'some colour',
        makeId: 'some make',
        modelType: 'some model',
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('getClass', () => {
        it ('should call generate class with the class name', () => {
            const generateClassSpy = sandbox.stub(Asset, 'generateClass');

            Vehicle.getClass();

            generateClassSpy.should.have.been.calledOnceWithExactly(Vehicle.name);
        });
    });

    describe ('validateVin', () => {
        const manufaturer = new Manufacturer('some id', 'some name', 'S', 'G');

        it ('should return false for vin of invalid length', () => {
            Vehicle.validateVin('some vin', manufaturer, 315532800).should.deep.equal(false);
        });

        it ('should return false for vin with wrong origin code', () => {
            Vehicle.validateVin('AG1234567A1234567', manufaturer, 315532800).should.deep.equal(false);
        });

        it ('should return false for vin with wrong manufacturer code', () => {
            Vehicle.validateVin('SA1234567A1234567', manufaturer, 315532800).should.deep.equal(false);
        });

        it ('should return false for vin with wrong year code', () => {
            Vehicle.validateVin('SG1234567B1234567', manufaturer, 315532800).should.deep.equal(false);
        });

        it ('should return true when all valid', () => {
            Vehicle.validateVin('SG1234567A1234567', manufaturer, 315532800).should.deep.equal(true);
        });
    });

    describe ('constructor', () => {

        beforeEach(() => {
            sandbox.stub(Asset, 'generateClass').withArgs('Vehicle').returns('some class');
            sandbox.stub(State, 'makeKey').withArgs(['some id']).returns('some key');
        });

        it ('should set the properties', () => {
            const vehicle = new Vehicle(
                'some id', mockVehicleDetails, VehicleStatus.ACTIVE, 1,
            );

            (vehicle as any).class.should.deep.equal('some class');
            (vehicle as any).key.should.deep.equal('some key');
            (vehicle as any).vehicleDetails.should.deep.equal(mockVehicleDetails);
            (vehicle as any).vehicleStatus.should.deep.equal(VehicleStatus.ACTIVE);
            (vehicle as any).manufactured.should.deep.equal(1);
        });

        it ('should set the owner id when set', () => {
            const vehicle = new Vehicle(
                'some id', mockVehicleDetails, VehicleStatus.ACTIVE, 1, 'some owner',
            );

            (vehicle as any).class.should.deep.equal('some class');
            (vehicle as any).key.should.deep.equal('some key');
            (vehicle as any).vehicleDetails.should.deep.equal(mockVehicleDetails);
            (vehicle as any).vehicleStatus.should.deep.equal(VehicleStatus.ACTIVE);
            (vehicle as any).manufactured.should.deep.equal(1);
            (vehicle as any).ownerId.should.deep.equal('some owner');
        });
    });

    describe ('madeByOrg', () => {
        it ('should return false when makeId does not match orgId', () => {
            const vehicle = new Vehicle(
                'some id', mockVehicleDetails, VehicleStatus.ACTIVE, 1, 'some owner',
            );

            vehicle.madeByOrg('not' + mockVehicleDetails.makeId).should.deep.equal(false);
        });

        it ('should return true when makeId does match orgId', () => {
            const vehicle = new Vehicle(
                'some id', mockVehicleDetails, VehicleStatus.ACTIVE, 1, 'some owner',
            );

            vehicle.madeByOrg(mockVehicleDetails.makeId).should.deep.equal(true);
        });
    });
});
