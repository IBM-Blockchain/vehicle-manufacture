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
import { Asset } from './asset';
import { Policy, PolicyType } from './policy';

chai.should();
chai.use(sinonChai);

describe ('#Policy', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('getClass', () => {
        it ('should call generate class with the class name', () => {
            const generateClassSpy = sandbox.stub(Asset, 'generateClass');

            Policy.getClass();

            generateClassSpy.should.have.been.calledOnceWithExactly(Policy.name);
        });
    });

    describe ('constructor', () => {

        beforeEach(() => {
            sandbox.stub(Asset, 'generateClass').withArgs('Policy').returns('some class');
            sandbox.stub(State, 'makeKey').withArgs(['some id']).returns('some key');
        });

        it ('should set the properties', () => {
            const policy = new Policy(
                'some id', 'some vin', 'some insurer', 'some holder', PolicyType.FIRE_AND_THEFT, 1, 2,
            );

            (policy as any).class.should.deep.equal('some class');
            (policy as any).key.should.deep.equal('some key');
            policy.vin.should.deep.equal('some vin');
            policy.insurerId.should.deep.equal('some insurer');
            policy.holderId.should.deep.equal('some holder');
            policy.startDate.should.deep.equal(1);
            policy.endDate.should.deep.equal(2);
        });
    });
});
