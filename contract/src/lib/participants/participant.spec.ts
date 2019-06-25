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
import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';
import { Participant } from './participant';

chai.should();
chai.use(sinonChai);

describe ('#Participant', () => {

    let sandbox: sinon.SinonSandbox;

    let generateClassStub: sinon.SinonStub;
    let makeKeyStub: sinon.SinonStub;

    let participant: Participant;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        generateClassStub = sandbox.stub(Participant, 'generateClass').returns('some class');
        makeKeyStub = sandbox.stub(State, 'makeKey').returns('some key');

        participant = new Participant('some id', ['some', 'roles'], 'some org id', 'some participant type');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('generateClass', () => {
        it ('should produce a class based on org type', () => {
            generateClassStub.restore();

            Participant.generateClass('someOrgType').should.deep.equal(NetworkName + '.participants.someOrgType');
        });
    });

    describe ('constructor', () => {
        it ('should set all the properties correctly', () => {
            (participant as any).class.should.deep.equal('some class');
            (participant as any).key.should.deep.equal('some key');
            participant.id.should.deep.equal('some id');
            (participant as any).roles.should.deep.equal(['some', 'roles']);
            participant.orgId.should.deep.equal('some org id');
            generateClassStub.should.have.been.calledOnceWithExactly('some participant type');
            makeKeyStub.should.have.been.calledOnceWithExactly(['some id']);
        });
    });

    describe ('serialize', () => {
        it ('should remove underscore properties and use non underscored version', () => {
            const expectedParticipant = {
                class: 'some class',
                id: 'some id',
                key: 'some key',
                orgId: 'some org id',
                roles: ['some', 'roles'],
                someOtherProperty: 'some other value',
                someProperty: 'some value',
            };

            (participant as any)._someOtherProperty = 'some other value';
            (participant as any).someProperty = 'some value';

            JSON.parse(participant.serialize().toString()).should.deep.equal(expectedParticipant);
        });
    });

    describe ('hasRole', () => {
        it ('should return true when role is in role list', () => {
            participant.hasRole('roles').should.deep.equal(true);
        });

        it ('should return false when role is in role list', () => {
            participant.hasRole('not roles').should.deep.equal(false);
        });
    });
});
