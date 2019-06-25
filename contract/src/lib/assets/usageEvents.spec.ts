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
import { EventType, UsageEvent } from './usageEvent';

chai.should();
chai.use(sinonChai);

describe ('#UsageEvent', () => {
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

            UsageEvent.getClass();

            generateClassSpy.should.have.been.calledOnceWithExactly(UsageEvent.name);
        });
    });
    describe ('constructor', () => {

        beforeEach(() => {
            sandbox.stub(Asset, 'generateClass').withArgs('UsageEvent').returns('some class');
            sandbox.stub(State, 'makeKey').withArgs(['some id']).returns('some key');
        });

        it ('should set the properties', () => {
            const usageEvent = new UsageEvent(
                'some id', EventType.CRASHED, 1, 2, 3, 4, 5, 6, 7, 'some vin',
            );

            (usageEvent as any).class.should.deep.equal('some class');
            (usageEvent as any).key.should.deep.equal('some key');
            (usageEvent as any).eventType.should.deep.equal(EventType.CRASHED);
            (usageEvent as any).acceleration.should.deep.equal(1);
            (usageEvent as any).airTemperature.should.deep.equal(2);
            (usageEvent as any).engineTemperature.should.deep.equal(3);
            (usageEvent as any).lightLevel.should.deep.equal(4);
            (usageEvent as any).pitch.should.deep.equal(5);
            (usageEvent as any).roll.should.deep.equal(6);
            (usageEvent as any).timestamp.should.deep.equal(7);
            (usageEvent as any).vin.should.deep.equal('some vin');
        });
    });
});
