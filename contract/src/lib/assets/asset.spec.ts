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
import { Asset } from './asset';

chai.should();
chai.use(sinonChai);

describe ('#Asset', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('generateClass', () => {
        it ('should return the generated class', () => {
            Asset.generateClass('someType').should.deep.equal(NetworkName + '.assets.someType');
        });
    });

    describe ('constructor', () => {
        it ('should setup the key, class and id', () => {
            sandbox.stub(Asset, 'generateClass').withArgs('some type').returns('some class');
            sandbox.stub(State, 'makeKey').withArgs(['some id']).returns('some key');

            const asset = new Asset('some id', 'some type');

            (asset as any).class.should.deep.equal('some class');
            (asset as any).key.should.deep.equal('some key');
            asset.id.should.deep.equal('some id');
        });
    });

    describe ('serialize', () => {
        it ('should remove underscore properties and use non underscored version', () => {
            const mockAsset = {
                class: 'some class',
                id: 'some id',
                key: 'some key',
                someOtherProperty: 'some other value',
                someProperty: 'some value',
            };

            sandbox.stub(Asset, 'generateClass').withArgs('some type').returns('some class');
            sandbox.stub(State, 'makeKey').withArgs(['some id']).returns('some key');

            const asset = new Asset('some id', 'some type') as any;

            asset._someOtherProperty = 'some other value';
            asset.someProperty = 'some value';

            JSON.parse(asset.serialize().toString()).should.deep.equal(mockAsset);
        });
    });
});
