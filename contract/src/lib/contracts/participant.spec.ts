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
import * as chaiAsPromied from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Roles, RolesPrefix } from '../../constants';
import { OrganizationList, ParticipantList } from '../lists';
import { Organization } from '../organizations';
import { Participant, Task } from '../participants';
import { VehicleManufactureNetClientIdentity } from '../utils/client-identity';
import { VehicleManufactureNetContext } from '../utils/context';
import { ParticipantsContract } from './participants';
chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromied);

describe ('#ParticipantContract', () => {
    let sandbox: sinon.SinonSandbox;
    let contract: ParticipantsContract;
    let ctx: sinon.SinonStubbedInstance<VehicleManufactureNetContext>;
    let clientIdentity: sinon.SinonStubbedInstance<VehicleManufactureNetClientIdentity>;

    let organizationList;
    let participantList;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        contract = new ParticipantsContract();
        ctx = sinon.createStubInstance(VehicleManufactureNetContext);
        clientIdentity = sinon.createStubInstance(VehicleManufactureNetClientIdentity);
        organizationList = sinon.createStubInstance(OrganizationList);
        participantList = sinon.createStubInstance(ParticipantList);

        (ctx as any).organizationList = organizationList;
        (ctx as any).participantList = participantList;
        (ctx as any).clientIdentity = clientIdentity;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('createContext', ()  => {
        it ('should create a VehicleManufacturerNetContext instance', () => {
            const newCtx = contract.createContext();
            newCtx.should.be.instanceof(VehicleManufactureNetContext);
        });
    });

    describe ('getOrganizations', async () => {
        it ('should return everything from the organization list', async () => {
            const stubOrgs = [new Organization('1', 'org1', 'regulator')];
            organizationList.getAll.resolves(stubOrgs);
            const orgs = await contract.getOrganizations(ctx as any);
            orgs.should.equal(stubOrgs);
        });
    });

    describe ('registerRegistrar', () => {
        it ('should throw if the attribute Roles.PARTICIPANT_CREATE is not "y"', async () => {
            stubAttribute(ctx, RolesPrefix + Roles.PARTICIPANT_CREATE, 'n');
            await contract.registerRegistrar(ctx as any, 'UK', 'LG')
                .should.be
                .rejectedWith(
                    `Only callers with role ${RolesPrefix + Roles.PARTICIPANT_CREATE} can register as registrar`,
                );
        });

        it ('should throw if an invalid participant type is given', async () => {
            stubAttribute(ctx, RolesPrefix + Roles.PARTICIPANT_CREATE, 'y');
            stubAttribute(ctx, 'vehicle_manufacture.company', 'IBM');
            stubAttribute(ctx, 'vehicle_manufacture.org_type', 'IT');
            await contract.registerRegistrar(ctx as any, 'UK', 'LG')
                .should.be
                .rejectedWith(
                    `Participant type does not exist: IT`,
                );
        });

        for (const orgType of ['regulator', 'insurer', 'manufacturer']) {
            it (`should register the participant if they are a '${orgType}'`, async () => {
                stubAttribute(ctx, RolesPrefix + Roles.PARTICIPANT_CREATE, 'y');
                stubAttribute(ctx, 'vehicle_manufacture.company', orgType);
                stubAttribute(ctx, 'vehicle_manufacture.org_type', orgType);
                clientIdentity.newParticipantInstance.returns('newParticipant');
                const participant = await contract.registerRegistrar(ctx as any, 'UK', 'LG');
                sinon.assert.calledWith(participantList.add, 'newParticipant');
                participant.should.equal('newParticipant');
            });
        }
    });

    describe ('registerTask', () => {
        let participant;
        let organization;

        beforeEach(() => {
            organization = sinon.createStubInstance(Organization);
            organization.id = 'ORG1';
            organization.name = 'VDA';
            participant = sinon.createStubInstance(Participant);
            clientIdentity.loadParticipant.returns({organization, participant});
        });

        it ('should throw if participant doens\'t have role Roles.PARTICIPANT_CREATE', async () => {
            participant.hasRole.withArgs(Roles.PARTICIPANT_CREATE).returns(false);
            await contract.registerTask(ctx as any, 'TASK_1', [`${RolesPrefix}ROLE1`])
                .should.be
                .rejectedWith(`Only callers with role ${Roles.PARTICIPANT_CREATE} can register a task user`);
        });

        it ('should create add a Task participant to the participant list', async () => {
            participant.hasRole.withArgs(Roles.PARTICIPANT_CREATE).returns(true);
            const task = new Task('TASK_1@VDA', [`ROLE1`], 'ORG1');
            const storedTask = await contract.registerTask(ctx as any, 'TASK_1', [`${RolesPrefix}ROLE1`]);
            sinon.assert.calledWith(participantList.add, task);
            storedTask.should.deep.equal(task);
        });
    });

    describe ('registerOrganization', () => {
        it ('should register an organization', async () => {
            organizationList.exists.resolves(false);
            clientIdentity.newOrganizationInstance.returns('organization');
            await (contract as any).registerOrganization(ctx as any, 'VDA', 'additionalInfo1', 'additionalInfo2');
            sinon.assert.calledWith(
                clientIdentity.newOrganizationInstance,
                'VDA',
                ['additionalInfo1', 'additionalInfo2'],
            );
            sinon.assert.calledWith(organizationList.exists, 'VDA');
            sinon.assert.calledWith(organizationList.add, 'organization');
        });

        it ('should not register an organization', async () => {
            organizationList.exists.resolves(true);
            await (contract as any).registerOrganization(ctx as any, 'VDA', 'additionalInfo1', 'additionalInfo2');
            sinon.assert.notCalled(organizationList.add);
        });
    });
});

function stubAttribute(ctx, attr, value) {
    ctx.clientIdentity
        .getAttributeValue
        .withArgs(attr)
        .returns(value);
}
