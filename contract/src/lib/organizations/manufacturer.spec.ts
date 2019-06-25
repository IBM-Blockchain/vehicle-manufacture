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
import { Manufacturer } from './manufacturer';
import { Organization } from './organization';

chai.should();
chai.use(sinonChai);

describe ('#Manufacturer', () => {

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
            Manufacturer.getClass().should.deep.equal('some class');
            generateClassStub.should.have.been.calledOnceWithExactly('Manufacturer');
        });
    });

    describe ('constructor', () => {
        it ('should set all the properties correctly', () => {
            const makeKeyStub = sandbox.stub(State, 'makeKey').returns('some key');

            const manufacturer = new Manufacturer('some id', 'some name', 'some origin code', 'some manufacturer code');

            (manufacturer as any).class.should.deep.equal('some class');
            (manufacturer as any).key.should.deep.equal('some key');
            manufacturer.id.should.deep.equal('some id');
            manufacturer.name.should.deep.equal('some name');
            manufacturer.originCode.should.deep.equal('some origin code');
            manufacturer.manufacturerCode.should.deep.equal('some manufacturer code');
            generateClassStub.should.have.been.calledOnceWithExactly('Manufacturer');
            makeKeyStub.should.have.been.calledOnceWithExactly(['some id']);
        });
    });
});
