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
import { Insurer } from './insurer';
import { Organization } from './organization';

chai.should();
chai.use(sinonChai);

describe ('#Insurer', () => {

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
            Insurer.getClass().should.deep.equal('some class');
            generateClassStub.should.have.been.calledOnceWithExactly('Insurer');
        });
    });

    describe ('constructor', () => {
        it ('should set all the properties correctly', () => {
            const makeKeyStub = sandbox.stub(State, 'makeKey').returns('some key');

            const insurer = new Insurer('some id', 'some name');

            (insurer as any).class.should.deep.equal('some class');
            (insurer as any).key.should.deep.equal('some key');
            insurer.id.should.deep.equal('some id');
            insurer.name.should.deep.equal('some name');
            generateClassStub.should.have.been.calledOnceWithExactly('Insurer');
            makeKeyStub.should.have.been.calledOnceWithExactly(['some id']);
        });
    });
});
