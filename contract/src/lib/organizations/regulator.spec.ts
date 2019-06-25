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
import { Organization } from './organization';
import { Regulator } from './regulator';

chai.should();
chai.use(sinonChai);

describe ('#Regulator', () => {

    let sandbox: sinon.SinonSandbox;

    let generateClassStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        generateClassStub = sandbox.stub(Organization, 'generateClass').returns('some class');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('getClass', () => {
        it ('should produce a class based on org type', () => {
            Regulator.getClass().should.deep.equal('some class');
            generateClassStub.should.have.been.calledOnceWithExactly('Regulator');
        });
    });

    describe ('constructor', () => {
        it ('should set all the properties correctly', () => {
            const makeKeyStub = sandbox.stub(State, 'makeKey').returns('some key');

            const regulator = new Regulator('some id', 'some name');

            (regulator as any).class.should.deep.equal('some class');
            (regulator as any).key.should.deep.equal('some key');
            regulator.id.should.deep.equal('some id');
            regulator.name.should.deep.equal('some name');
            generateClassStub.should.have.been.calledOnceWithExactly('Regulator');
            makeKeyStub.should.have.been.calledOnceWithExactly(['some id']);
        });
    });
});
