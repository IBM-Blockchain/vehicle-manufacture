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
import { ChaincodeStub } from 'fabric-shim';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { VehicleManufactureNetContext } from '../utils/context';
import { HistoricState, State } from './state';
import { StateList } from './statelist';

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromied);

// tslint:disable:max-classes-per-file

describe ('#StateList', () => {

    let sandbox: sinon.SinonSandbox;

    let mockContext: sinon.SinonStubbedInstance<VehicleManufactureNetContext>;
    let mockState: sinon.SinonStubbedInstance<State>;

    let stateList: StateList<any>;

    let splitKeyStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        mockContext = sinon.createStubInstance(VehicleManufactureNetContext);
        mockContext.stub = sinon.createStubInstance(ChaincodeStub);
        (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).createCompositeKey.returns('some key');

        mockState = sinon.createStubInstance(State);
        mockState.getSplitKey.returns(['some', 'split', 'key']);
        mockState.getKey.returns('state key');

        splitKeyStub = sandbox.stub(State, 'splitKey').returns(['some', 'other', 'split', 'key']);

        stateList = new StateList(mockContext, 'some list name');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('constructor', () => {
        it ('should assign values', () => {
            (stateList as any).ctx.should.deep.equal(mockContext);
            stateList.name.should.deep.equal('some list name');
            stateList.supportedClasses.should.deep.equal(new Map());
        });
    });

    describe ('add', () => {

        beforeEach(() => {
            mockState.serialize.returns('some serialized value');
        });

        it ('should error if already key exists', async () => {
            const existsStub = sandbox.stub(stateList, 'exists').resolves(true);

            await stateList.add(mockState).should.be.rejectedWith(
                'Cannot add state. State already exists for key state key',
            );

            existsStub.should.have.been.calledOnceWithExactly('state key');
            // tslint:disable-next-line:no-unused-expression
            mockState.getSplitKey.should.not.have.been.called;
            // tslint:disable-next-line:no-unused-expression
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).createCompositeKey
                .should.not.have.been.called;
            // tslint:disable-next-line:no-unused-expression
            mockState.serialize.should.not.have.been.called;
            // tslint:disable-next-line:no-unused-expression
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).putState.should.not.have.been.called;
        });

        it ('should put to the world state', async () => {
            const existsStub = sandbox.stub(stateList, 'exists').resolves(false);

            await stateList.add(mockState);

            mockState.getSplitKey.should.have.been.calledOnceWithExactly();
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).createCompositeKey
                .should.have.been.calledOnceWithExactly('some list name', ['some', 'split', 'key']);
            mockState.serialize.should.have.been.calledOnceWithExactly();
            existsStub.should.have.been.calledOnceWithExactly('state key');
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).putState
                .should.have.been.calledOnceWithExactly('some key', 'some serialized value');
        });
    });

    describe ('get', () => {

        let deserializeStub: sinon.SinonStub;

        beforeEach(() => {
            deserializeStub = sandbox.stub(State, 'deserialize').returns({some: 'object'} as any);
        });

        it ('should error when no state exists', async () => {
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).getState.resolves(Buffer.from(''));

            await stateList.get('my key').should.be.rejectedWith(
                'Cannot get state. No state exists for key my key',
            );

            splitKeyStub.should.have.been.calledOnceWithExactly('my key');
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).createCompositeKey
                .should.have.been.calledOnceWithExactly(
                    'some list name', ['some', 'other', 'split', 'key'],
                );
            // tslint:disable-next-line:no-unused-expression
            deserializeStub.should.not.have.been.called;
        });

        it ('should return the deserialized state', async () => {
            const expectedState = Buffer.from('some data');
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).getState.resolves(expectedState);

            const expectedSupportedClasses = new Map([[1, 2], [2, 3], [4, 5]]);

            (stateList as any).supportedClasses = expectedSupportedClasses;

            (await stateList.get('my key')).should.deep.equal({some: 'object'});
            splitKeyStub.should.have.been.calledOnceWithExactly('my key');
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).createCompositeKey
                .should.have.been.calledOnceWithExactly('some list name', ['some', 'other', 'split', 'key']);
            // tslint:disable-next-line:no-unused-expression
            deserializeStub.should.have.been.calledOnceWithExactly(expectedState, expectedSupportedClasses);
        });
    });

    describe ('getHistory', () => {
        it ('should return the history of a state', async () => {
            const values = ['some', 'iterable', 'values'];

            const deserializeStub = sandbox.stub(State, 'deserialize').callsFake((value) => {
                return value as any;
            });

            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).getHistoryForKey
                .resolves(getIterable(values));

            const expectedSupportedClasses = new Map([[1, 2], [2, 3], [4, 5]]);

            (stateList as any).supportedClasses = expectedSupportedClasses;

            const history = await stateList.getHistory('my key');

            splitKeyStub.should.have.been.calledOnceWithExactly('my key');
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).createCompositeKey
                .should.have.been.calledOnceWithExactly('some list name', ['some', 'other', 'split', 'key']);
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).getHistoryForKey
                .should.have.been.calledOnceWithExactly('some key');

            deserializeStub.callCount.should.deep.equal(values.length);
            deserializeStub.getCall(0).args.should.deep.equal([values[0], expectedSupportedClasses]);
            deserializeStub.getCall(1).args.should.deep.equal([values[1], expectedSupportedClasses]);
            deserializeStub.getCall(2).args.should.deep.equal([values[2], expectedSupportedClasses]);

            history.should.deep.equal([
                new HistoricState(0, 'TX -> 0', values[0] as any),
                new HistoricState(1, 'TX -> 1', values[1] as any),
                new HistoricState(2, 'TX -> 2', values[2] as any),
            ]);
        });
    });

    describe ('getAll', () => {
        it ('should run an empty query', async () => {
            const queryStub = sandbox.stub(stateList, 'query').returns('some query result' as any);

            (await stateList.getAll()).should.deep.equal('some query result');
            queryStub.should.have.been.calledOnceWithExactly({});
        });
    });

    describe ('count', () => {
        it ('should return the number of results in state', async () => {
            const values = ['some', 'iterable', 'values'];

            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).getStateByPartialCompositeKey
                .resolves(getIterable(values));

            (await stateList.count()).should.deep.equal(values.length);
        });
    });

    describe ('update', () => {

        beforeEach(() => {
            mockState.serialize.returns('some serialized value');
        });

        it ('should throw an error if no state exists', async () => {
            const existsStub = sandbox.stub(stateList, 'exists').resolves(false);

            await stateList.update(mockState).should.be.rejectedWith(
                'Cannot update state. No state exists for key state key',
            );

            existsStub.should.have.been.calledOnceWithExactly('state key');
            // tslint:disable-next-line:no-unused-expression
            mockState.getSplitKey.should.not.have.been.called;
            // tslint:disable-next-line:no-unused-expression
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).createCompositeKey
                .should.not.have.been.called;
            // tslint:disable-next-line:no-unused-expression
            mockState.serialize.should.not.have.been.called;
            // tslint:disable-next-line:no-unused-expression
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).putState.should.not.have.been.called;
        });

        it ('should put to the world state', async () => {
            const existsStub = sandbox.stub(stateList, 'exists').resolves(true);

            await stateList.update(mockState);

            mockState.getSplitKey.should.have.been.calledOnceWithExactly();
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).createCompositeKey
                .should.have.been.calledOnceWithExactly('some list name', ['some', 'split', 'key']);
            mockState.serialize.should.have.been.calledOnceWithExactly();
            existsStub.should.have.been.calledOnceWithExactly('state key');
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).putState
                .should.have.been.calledOnceWithExactly('some key', 'some serialized value');
        });

        it ('should put to the world state by force', async () => {
            const existsStub = sandbox.stub(stateList, 'exists').resolves(false);

            await stateList.update(mockState, true);

            mockState.getSplitKey.should.have.been.calledOnceWithExactly();
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).createCompositeKey
                .should.have.been.calledOnceWithExactly('some list name', ['some', 'split', 'key']);
            mockState.serialize.should.have.been.calledOnceWithExactly();
            existsStub.should.have.been.calledOnceWithExactly('state key');
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).putState
                .should.have.been.calledOnceWithExactly('some key', 'some serialized value');
        });
    });

    describe ('delete', () => {
        it ('should delete the state at key', async () => {
            await stateList.delete('my key');

            splitKeyStub.should.have.been.calledOnceWithExactly('my key');
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).createCompositeKey
                .should.have.been.calledOnceWithExactly(
                    'some list name', ['some', 'other', 'split', 'key'],
                );
            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).deleteState
                .should.have.been.calledOnceWithExactly('some key');
        });
    });

    describe ('exists', () => {
        it ('should return false when get fails', async () => {
            const getStub = sandbox.stub(stateList, 'get').rejects('some error');

            (await stateList.exists('my key')).should.deep.equal(false);
            getStub.should.have.been.calledOnceWithExactly('my key');
        });

        it ('should return true when get fails', async () => {
            const getStub = sandbox.stub(stateList, 'get').resolves();

            (await stateList.exists('my key')).should.deep.equal(true);
            getStub.should.have.been.calledOnceWithExactly('my key');
        });
    });

    describe ('query', () => {
        let deserializeStub: sinon.SinonStub;

        const values = ['some', 'iterable', 'values'];
        const expectedSupportedClasses = new Map([[1, 2], [2, 3], [4, 5]]);

        beforeEach(() => {
            deserializeStub = sandbox.stub(State, 'deserialize').callsFake((value) => {
                return value as any;
            });

            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).getQueryResult
                .resolves(getIterable(values));

            (stateList as any).supportedClasses = expectedSupportedClasses;
        });

        it ('should query based on passed query', async () => {

            const mockQuery = {
                selector: {
                    some: 'selector',
                },
            };

            const queryResult = await stateList.query(mockQuery);

            const expectedQuery = JSON.parse(JSON.stringify(mockQuery));
            expectedQuery.selector._id = {
                $regex: `.*some list name.*`,
            };

            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).getQueryResult
                .should.have.been.calledOnceWithExactly(JSON.stringify(expectedQuery));
            deserializeStub.callCount.should.deep.equal(3);
            deserializeStub.getCall(0).args.should.deep.equal([values[0], expectedSupportedClasses]);
            deserializeStub.getCall(1).args.should.deep.equal([values[1], expectedSupportedClasses]);
            deserializeStub.getCall(2).args.should.deep.equal([values[2], expectedSupportedClasses]);
            queryResult.should.deep.equal(values);
        });

        it ('should query based on passed when selector not passed', async () => {
            const queryResult = await stateList.query({});

            const expectedQuery = {
                selector: {
                    _id: {
                        $regex: `.*some list name.*`,
                    },
                },
            };

            (mockContext.stub as sinon.SinonStubbedInstance<ChaincodeStub>).getQueryResult
                .should.have.been.calledOnceWithExactly(JSON.stringify(expectedQuery));
            deserializeStub.callCount.should.deep.equal(3);
            deserializeStub.getCall(0).args.should.deep.equal([values[0], expectedSupportedClasses]);
            deserializeStub.getCall(1).args.should.deep.equal([values[1], expectedSupportedClasses]);
            deserializeStub.getCall(2).args.should.deep.equal([values[2], expectedSupportedClasses]);
            queryResult.should.deep.equal(values);
        });
    });

    describe ('use', () => {

        class BadClass {}

        class GoodClass extends State {
            public static getClass() {
                return 'some class';
            }
        }

        class AnotherGoodClass extends State {
            public static getClass() {
                return 'some other class';
            }
        }

        it ('should error when passed value is not of type state', () => {
            (() => {
                stateList.use(GoodClass as any, BadClass as any);
            }).should.throw('Cannot use BadClass as type State');
        });

        it ('should set supported classes', () => {
            stateList.use(GoodClass as any, AnotherGoodClass as any);

            stateList.supportedClasses.should.deep.equal(
                new Map([['some class', GoodClass], ['some other class', AnotherGoodClass]],
            ));
        });
    });
});

function getIterable(values: any[]) {
    let iterationCount = 0;
    return {
        next: () => {
            let result;
            if (iterationCount < values.length) {
                const curr = iterationCount;
                result = {
                    done: false,
                    value: {
                        getTimestamp: () => {
                            return {
                                getSeconds: () => {
                                    return {
                                        toInt: () => curr,
                                    };
                                },
                            };
                        },
                        getTxId: () => 'TX -> ' + curr,
                        getValue: () => {
                            return {
                                toBuffer: () => values[curr],
                            };
                        },
                    },
                };
                iterationCount++;
                return result;
            }
            return { value: null, done: true };
        },
    };
}
