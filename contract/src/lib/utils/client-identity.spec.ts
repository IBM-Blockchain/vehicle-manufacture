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
import { OrganizationList, ParticipantList } from '../lists';
import { Insurer, Manufacturer, Regulator } from '../organizations';
import { Task } from '../participants';
import { VehicleManufactureNetContext } from './context';

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

const ORG_NAME_FIELD = 'vehicle_manufacture.company';
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

    describe ('init', () => {

        const mockOrg = {
            prop: 'some val',
        };

        let participantList: sinon.SinonStubbedInstance<ParticipantList>;
        let organizationList: sinon.SinonStubbedInstance<OrganizationList>;

        beforeEach(() => {
            participantList = sinon.createStubInstance(ParticipantList);
            organizationList = sinon.createStubInstance(OrganizationList);

            (mockContext as any).participantList = participantList;
            (mockContext as any).organizationList = organizationList;
        });

        it ('should set the participant and organization from world state', async () => {
            const mockParticipant = {
                orgId: 'some org id',
            };

            participantList.get.returns(mockParticipant);
            organizationList.get.returns(mockOrg);

            participantList.exists.returns(false).withArgs('some id').returns(true);

            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            const getAttributeValueStub = sinon.stub(ci, 'getAttributeValue').returns('some id');

            await ci.init();

            getAttributeValueStub.should.have.been.calledOnceWithExactly(ID_FIELD);
            ci.participant.should.deep.equal(mockParticipant);
            ci.organization.should.deep.equal(mockOrg);
        });

        it ('should create a new task but not org when org exists', async () => {
            participantList.exists.returns(true).withArgs('id@org').returns(false);
            organizationList.exists.returns(false).withArgs('org').returns(true);

            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            ci.attrs = {
                'hf.Registrar.Roles': 'client',
                'vehicle_manufacture.role.participant.create': 'y',
                'vehicle_manufacture.role.participant.delete': 'n',
                'vehicle_manufacture.role.participant.read': 'y',
            };

            organizationList.get.withArgs('org').returns(mockOrg);

            const getAttributeValueStub = sinon.stub(ci, 'getAttributeValue').returns('id@org');

            await ci.init();

            getAttributeValueStub.should.have.been.calledOnceWithExactly(ID_FIELD);

            (ci as any)._participant.should.deep.equal(
                new Task('id@org', ['participant.create', 'participant.read'], 'org'),
            );
            (ci as any)._organization.should.deep.equal(mockOrg);
        });

        it ('should create a new task and org when org does not exist', async () => {
            participantList.exists.returns(true).withArgs('id@org').returns(false);
            organizationList.exists.returns(true).withArgs('org').returns(false);

            const ci = new VehicleManufactureNetClientIdentity(mockContext);

            ci.attrs = {
                'hf.Registrar.Roles': 'client',
                'vehicle_manufacture.role.participant.create': 'y',
                'vehicle_manufacture.role.participant.delete': 'n',
                'vehicle_manufacture.role.participant.read': 'y',
            };

            const getAttributeValueStub = sinon.stub(ci, 'getAttributeValue');
            getAttributeValueStub.withArgs(ID_FIELD).returns('id@org');
            getAttributeValueStub.withArgs(ORG_NAME_FIELD).returns('some org');

            const newOrganizationInstanceStub = sinon.stub(ci, 'newOrganizationInstance').returns(mockOrg);

            await ci.init();

            getAttributeValueStub.callCount.should.deep.equal(2);
            getAttributeValueStub.should.have.been.calledWithExactly(ID_FIELD);
            getAttributeValueStub.should.have.been.calledWithExactly(ORG_NAME_FIELD);
            newOrganizationInstanceStub.should.have.been.calledOnceWithExactly('some org');

            (ci as any)._participant.should.deep.equal(
                new Task('id@org', ['participant.create', 'participant.read'], 'org'),
            );
            // tslint:disable-next-line: no-unused-expression
            organizationList.get.should.not.have.been.called;
            (ci as any)._organization.should.deep.equal(mockOrg);
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

            ci.newOrganizationInstance('some org').should.deep.equal(
                new Manufacturer('some org', 'some org', null, null),
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
