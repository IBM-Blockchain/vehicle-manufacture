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
