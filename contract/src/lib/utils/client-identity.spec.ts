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
import * as mockery from 'mockery';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

const should = chai.should();
chai.use(sinonChai);

describe('#ClientIdentity', () => {
    const mockContext = {
        stub: 'some stub',
    };

    let VehicleManufactureNetClientIdentity;

    class MockClientIdentity {
        constructor() {
        } // tslint:disable-line:no-empty
    }

    const MockFabricShim = {
        ClientIdentity: MockClientIdentity,
        newLogger: () => {}, // tslint:disable-line:no-empty
    };

    let superConstructorSpy: sinon.SinonSpy;

    before(() => {
        mockery.enable();
    });

    beforeEach(() => {
        superConstructorSpy = sinon.spy(MockFabricShim, 'ClientIdentity');
        mockery.registerMock('fabric-shim', MockFabricShim);
        VehicleManufactureNetClientIdentity = require('./client-identity').VehicleManufactureNetClientIdentity;
    });

    afterEach(() => {
        mockery.deregisterAll();
    });

    after(() => {
        mockery.disable();
    });

    describe('constructor', () => {
        it ('should set the ctx and call super with the stub', () => {
            // stub the constructor in this class so can check called

            const ci = new VehicleManufactureNetClientIdentity(mockContext as any);

            superConstructorSpy.should.have.been.calledOnceWithExactly(mockContext.stub);
            ci.ctx.should.deep.equal(mockContext);
        });
    });
});
