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
import { Participant } from './participant';
import { Task } from './task';
chai.should();
chai.use(sinonChai);

describe ('#Task', () => {

    let sandbox: sinon.SinonSandbox;

    let generateClassStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        generateClassStub = sandbox.stub(Participant, 'generateClass').returns('some class');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('getClass', () => {
        it ('should produce a class based on org type', () => {
            Task.getClass().should.deep.equal('some class');
            generateClassStub.should.have.been.calledOnceWithExactly('Task');
        });
    });

    describe ('constructor', () => {
        it ('should set all the properties correctly', () => {
            const makeKeyStub = sandbox.stub(State, 'makeKey').returns('some key');

            const task = new Task('some id', ['some', 'roles'], 'some org id');

            (task as any).class.should.deep.equal('some class');
            (task as any).key.should.deep.equal('some key');
            task.id.should.deep.equal('some id');
            (task as any).roles.should.deep.equal(['some', 'roles']);
            task.orgId.should.deep.equal('some org id');
            generateClassStub.should.have.been.calledOnceWithExactly('Task');
            makeKeyStub.should.have.been.calledOnceWithExactly(['some id']);
        });
    });
});
