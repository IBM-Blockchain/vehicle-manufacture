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
import * as mockery from 'mockery';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Insurer, Manufacturer, Regulator } from '../organizations';
import { Registrar, Task } from '../participants';
import { VehicleManufactureNetContext } from './context';

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

const REGISTRAR_ROLE_FIELD = 'vehicle_manufacture.role.participant.create';
const ID_FIELD = 'vehicle_manufacture.username';
const ORG_TYPE_FIELD = 'vehicle_manufacture.org_type';

describe ('#ClientIdentity', () => {
    let mockContext: sinon.SinonStubbedInstance<VehicleManufactureNetContext>;

    let VehicleManufactureNetClientIdentity;

    class MockClientIdentity {
        constructor() {} // tslint:disable-line:no-empty

        public getAttributeValue() {} // tslint:disable-line:no-empty
        public assertAttributeValue() {} // tslint:disable-line:no-empty
    }

    const MockFabricShim = {
        ClientIdentity: MockClientIdentity,
        newLogger: () => {}, // tslint:disable-line:no-empty
    };

    before(() => {
        cleanCache();

        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach(() => {

        mockery.registerMock('fabric-shim', MockFabricShim);
        VehicleManufactureNetClientIdentity = requireVehicleManufactureNetClientIdentity();

        mockContext = sinon.createStubInstance(VehicleManufactureNetContext);
    });

    afterEach(() => {
        mockery.deregisterAll();

        cleanCache();
    });

    after(() => {
        mockery.disable();
    });

    describe ('constructor', () => {
        let superConstructorSpy: sinon.SinonSpy;

        beforeEach(() => {
            // NEED TO OVERWRITE OTHER MOCK TO ALLOW SPYING ON CONSTRUCTOR
            mockery.deregisterMock('fabric-shim');

            superConstructorSpy = sinon.spy(MockFabricShim, 'ClientIdentity');
            mockery.registerMock('fabric-shim', MockFabricShim);

            cleanCache();

            VehicleManufactureNetClientIdentity = requireVehicleManufactureNetClientIdentity();
        });

        afterEach(() => {
                superConstructorSpy.restore();
        });

        it ('should set the ctx and call super with the stub', () => {
            // stub the constructor in this class so can check called

            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            superConstructorSpy.should.have.been.calledOnceWithExactly(mockContext.stub);
            ci['ctx'].should.deep.equal(mockContext); // tslint:disable-line:no-string-literal
        });
    });

    describe ('loadParticipant', () => {
        it ('should catch error from get participant list', async () => {
            const getStub = sinon.stub().rejects(new Error('sad error'));

            (mockContext as any).participantList = {get: getStub};

            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            const getAttributeValueStub = sinon.stub(ci, 'getAttributeValue').returns('some id');

            await ci.loadParticipant().should.be.rejectedWith(/sad error/);

            getAttributeValueStub.should.have.been.calledOnceWithExactly(ID_FIELD);
            getStub.should.have.been.calledOnceWithExactly('some id');
        });

        it ('should catch error from get organization list', async () => {
            const mockParticipant = {
                orgId: 'some org id',
            };

            const getParticipantStub = sinon.stub().resolves(mockParticipant);
            const getOrgStub = sinon.stub().rejects(new Error('sad error'));

            (mockContext as any).participantList = {get: getParticipantStub};
            (mockContext as any).organizationList = {get: getOrgStub};

            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            const getAttributeValueStub = sinon.stub(ci, 'getAttributeValue').returns('some id');

            await ci.loadParticipant().should.be.rejectedWith(/sad error/);

            getAttributeValueStub.should.have.been.calledOnceWithExactly(ID_FIELD);
            getParticipantStub.should.have.been.calledOnceWithExactly('some id');
            getOrgStub.should.have.been.calledOnceWithExactly('some org id');
        });

        it ('should return the participant and organization', async () => {
            const mockParticipant = {
                orgId: 'some org id',
            };

            const mockOrg = {
                prop: 'some val',
            };

            const getParticipantStub = sinon.stub().resolves(mockParticipant);
            const getOrgStub = sinon.stub().resolves(mockOrg);

            (mockContext as any).participantList = {get: getParticipantStub};
            (mockContext as any).organizationList = {get: getOrgStub};

            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            (await ci.loadParticipant()).should.deep.equal({
                organization: mockOrg,
                participant: mockParticipant,
            });
        });
    });

    describe ('newParticipantInstance', () => {
        it ('should create a new registrar', () => {
            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            const getAttributeValueStub = sinon.stub(ci, 'getAttributeValue').returns('id@someorg');
            const assertAttributeValue = sinon.stub(ci, 'assertAttributeValue').returns(true);

            ci.newParticipantInstance().should.deep.equal(new Registrar('id@someorg', 'someorg'));
            getAttributeValueStub.should.have.been.calledOnceWithExactly(ID_FIELD);
            assertAttributeValue.should.have.been.calledOnceWithExactly(REGISTRAR_ROLE_FIELD, 'y');
        });

        it ('should create a new task', async () => {
            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            ci.attrs = {
                'hf.Registrar.Roles': {
                    value: 'client',
                },
                'vehicle_manufacture.role.participant.create': {
                    value: 'y',
                },
                'vehicle_manufacture.role.participant.delete': {
                    value: 'n',
                },
                'vehicle_manufacture.role.participant.read': {
                    value: 'y',
                },
            };

            const getAttributeValueStub = sinon.stub(ci, 'getAttributeValue').returns('id@someorg');
            const assertAttributeValue = sinon.stub(ci, 'assertAttributeValue').returns(false);

            ci.newParticipantInstance().should.deep.equal(
                new Task('id@someorg', ['participant.create', 'participant.read'], 'someorg'),
            );
            getAttributeValueStub.should.have.been.calledOnceWithExactly(ID_FIELD);
            assertAttributeValue.should.have.been.calledOnceWithExactly(REGISTRAR_ROLE_FIELD, 'y');
        });
    });

    describe ('newOrganizationInstance', () => {
        it ('should throw an error by default', () => {
            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            const getAttributeValueStub = sinon.stub(ci, 'getAttributeValue').returns('some unknown org type');

            (() => {
                ci.newOrganizationInstance('some org');
            }).should.throw('Invalid organization type: some unknown org type');

            getAttributeValueStub.should.have.been.calledOnceWithExactly(ORG_TYPE_FIELD);
        });

        it ('should return a manufacturer', () => {
            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            const getAttributeValueStub = sinon.stub(ci, 'getAttributeValue').returns('manufacturer');

            ci.newOrganizationInstance('some org', ['info 1', 'info 2']).should.deep.equal(
                new Manufacturer('some org', 'some org', 'info 1', 'info 2'),
            );

            getAttributeValueStub.should.have.been.calledOnceWithExactly(ORG_TYPE_FIELD);
        });

        it ('should return an insurer', () => {
            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            const getAttributeValueStub = sinon.stub(ci, 'getAttributeValue').returns('insurer');

            ci.newOrganizationInstance('some org').should.deep.equal(
                new Insurer('some org', 'some org'),
            );

            getAttributeValueStub.should.have.been.calledOnceWithExactly(ORG_TYPE_FIELD);
        });

        it ('should return a regulator', () => {
            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            const getAttributeValueStub = sinon.stub(ci, 'getAttributeValue').returns('regulator');

            ci.newOrganizationInstance('some org').should.deep.equal(
                new Regulator('some org', 'some org'),
            );

            getAttributeValueStub.should.have.been.calledOnceWithExactly(ORG_TYPE_FIELD);
        });
    });
});

function requireVehicleManufactureNetClientIdentity() {
    return require('./client-identity').VehicleManufactureNetClientIdentity;
}

function cleanCache() {
    delete require.cache[require.resolve('./client-identity')];
}
