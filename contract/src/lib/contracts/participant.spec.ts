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
import { Roles } from '../../constants';
import { OrganizationList, ParticipantList } from '../lists';
import { Manufacturer, Organization } from '../organizations';
import { Participant } from '../participants';
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

    let participant: sinon.SinonStubbedInstance<Participant>;
    let organization: sinon.SinonStubbedInstance<Organization>;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        contract = new ParticipantsContract();
        ctx = sinon.createStubInstance(VehicleManufactureNetContext);
        clientIdentity = sinon.createStubInstance(VehicleManufactureNetClientIdentity);
        organizationList = sinon.createStubInstance(OrganizationList);
        participantList = sinon.createStubInstance(ParticipantList);

        organization = sinon.createStubInstance(Organization);
        participant = sinon.createStubInstance(Participant);
        participant.hasRole.returns(true);

        (clientIdentity as any)._participant = participant;
        (clientIdentity as any)._organization = organization;

        (ctx as any).organizationList = organizationList;
        (ctx as any).participantList = participantList;
        (ctx as any)._clientIdentity = clientIdentity;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('provideManufacturerDetails', () => {
        it ('should throw an error if the participant does not have role', async () => {
            participant.hasRole.returns(true).withArgs(Roles.ORGANIZATION_UPDATE).returns(false);

            await contract.provideManufacturerDetails(ctx as any, 'some origin', 'some manufacturer')
                .should.be.rejectedWith(
                    `Only callers with role ${Roles.ORGANIZATION_UPDATE} can update their organization`,
                );
        });

        it ('should throw an error when organization is not a manufacturer', async () => {
            await contract.provideManufacturerDetails(ctx as any, 'some origin', 'some manufacturer')
                .should.be.rejectedWith(
                    'Only callers from organisations of type Manufacturer can provide manufacturer details',
                );
        });

        it ('should update the organization ', async () => {
            organization = sinon.createStubInstance(Manufacturer);
            (organization as any).id = 'some org id';
            (clientIdentity as any)._organization = organization;

            await contract.provideManufacturerDetails(ctx as any, 'some origin', 'some manufacturer');

            ctx.organizationList.update.should.have.been.calledOnceWithExactly(organization, true);
            (organization as sinon.SinonStubbedInstance<Manufacturer>).originCode.should.deep.equal('some origin');
            (organization as sinon.SinonStubbedInstance<Manufacturer>).manufacturerCode
                .should.deep.equal('some manufacturer');
        });
    });
});
