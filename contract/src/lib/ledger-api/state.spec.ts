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
import 'reflect-metadata';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { HistoricState, State } from './state';

// tslint:disable:max-classes-per-file

const should = chai.should();
chai.use(sinonChai);

describe ('#State', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('serialize', () => {
        it ('should create buffer from JSON serialized object', () => {
            State.serialize({some: 'object'}).should.deep.equal(Buffer.from('{"some":"object"}'));
        });
    });

    describe ('deserialize', () => {
        it ('should throw an error if class not found', () => {
            const classMap = new Map();
            classMap.set('some class name', 'some class');

            (() => {
                State.deserialize(Buffer.from('{"some":"object","class":"unknown class"}'), classMap);
            }).should.throw('Unknown class of unknown class');
        });

        it ('should return call constructor', () => {
            const classMap = new Map();
            classMap.set('some class name', 'some class');

            const callConstructorStub = sandbox.stub(State as any, 'callConstructor').returns('something');

            State.deserialize(
                Buffer.from('{"some":"object","class":"some class name"}'), classMap,
            ).should.deep.equal('something');

            callConstructorStub.should.have.been.calledOnceWithExactly('some class', {
                class: 'some class name',
                some: 'object',
            });
        });
    });

    describe ('makeKey', () => {
        it ('should join the key parts with a colon', () => {
            State.makeKey(['some', 'key', 'parts']).should.deep.equal('some:key:parts');
        });
    });

    describe ('splitKey', () => {
        it ('should split the key parts on a colon', () => {
            State.splitKey('some:key:parts').should.deep.equal(['some', 'key', 'parts']);
        });
    });

    describe ('callConstructor', () => {
        it ('should throw an error if class is not instance of state', () => {
            class MockClass {}

            (() => {
                (State as any).callConstructor(MockClass, {some: 'object'});
            }).should.throw('Cannot use MockClass as type State');
        });

        it ('should throw an error if json is missing param name found in the constructor', () => {
            class MockClass extends State {
                constructor(property1: string, property2: string) {
                    super('mockClass', ['key', 'parts']);
                }
            }

            (() => {
                (State as any).callConstructor(MockClass, {some: 'object'});
            }).should.throw('Could not deserialize JSON. Missing required fields. ["property1","property2"]');
        });

        it ('should create new instance of the class passed', () => {
            class MockClass extends State {

                public property1: string;
                public property2: string;

                constructor(property1: string, property2: string) {
                    super('mockClass', ['key', 'parts']);

                    this.property1 = property1;
                    this.property2 = property2;
                }
            }

            const mockClass = (State as any).callConstructor(
                MockClass, {some: 'object', property1: 'some property', property2: 'some other property'},
            );

            // tslint:disable-next-line:no-unused-expression
            (mockClass instanceof MockClass).should.be.true;
            mockClass.property1.should.deep.equal('some property');
            mockClass.property2.should.deep.equal('some other property');
        });

        it ('should use metadata when set', () => {
            class MockClass extends State {

                public property1: string;
                public property2: string;

                constructor(property1: string, property2: string) {
                    super('mockClass', ['key', 'parts']);

                    this.property1 = property1;
                    this.property2 = property2;
                }
            }

            Reflect.defineMetadata(
                'contract:function', ['property1', 'property2', 'property3'], MockClass.prototype, 'constructor',
            );

            (() => {
                (State as any).callConstructor(
                    MockClass, {some: 'object', property1: 'some property', property2: 'some other property'},
                );
            }).should.throw('Could not deserialize JSON. Missing required fields. ["property3"]');
        });

        it ('should handle optional properties', () => {
            class MockClass extends State {

                public property1: string;
                public property2: string;

                constructor(property1: string, property2?: string) {
                    super('mockClass', ['key', 'parts']);

                    this.property1 = property1;

                    if (property2) {
                        this.property2 = 'was set';
                    }
                }
            }

            Reflect.defineMetadata(
                'contract:function', ['property1', 'property2?'], MockClass.prototype, 'constructor',
            );

            const mockClass = (State as any).callConstructor(
                MockClass, {some: 'object', property1: 'some property'},
            );

            // tslint:disable-next-line:no-unused-expression
            (mockClass instanceof MockClass).should.be.true;
            mockClass.property1.should.deep.equal('some property');
            should.equal(mockClass.property2, undefined);

            const mockClass2 = (State as any).callConstructor(
                MockClass, {some: 'object', property1: 'some property', property2: 'hello'},
            );

            // tslint:disable-next-line:no-unused-expression
            (mockClass2 instanceof MockClass).should.be.true;
            mockClass2.property1.should.deep.equal('some property');
            mockClass2.property2.should.deep.equal('was set');
        });
    });

    describe ('getClass', () => {
        it ('should return the class', () => {
            const state = new State('some class', ['key', 'parts']);

            state.getClass().should.deep.equal('some class');
        });
    });

    describe ('getKey', () => {
        it ('should return the key', () => {
            sandbox.stub(State, 'makeKey').returns('some:joined:key');

            const state = new State('some class', ['key', 'parts']);

            state.getKey().should.deep.equal('some:joined:key');
        });
    });

    describe ('getSplitKey', () => {
        it ('should return split key', () => {
            sandbox.stub(State, 'makeKey').returns('some:joined:key');
            const staticSplit = sandbox.stub(State, 'splitKey').returns(['some', 'split', 'key']);

            const state = new State('some class', ['key', 'parts']);

            state.getSplitKey().should.deep.equal(['some', 'split', 'key']);
            staticSplit.should.have.been.calledOnceWithExactly('some:joined:key');
        });
    });

    describe ('serialize', () => {
        it ('should return serialized state', () => {
            const expected = Buffer.from(JSON.stringify({some: 'serialized', object: 'woo'}));

            const staticSerialize = sandbox.stub(State, 'serialize').returns(expected);

            const state = new State('some class', ['key', 'parts']);

            state.serialize().should.deep.equal(expected);
            staticSerialize.should.have.been.calledOnceWithExactly(state);
        });
    });
});

describe ('#HistoricState', () => {

    class MockClass {
        // tslint:disable-next-line:no-empty
        constructor() {}

        public serialize(): Buffer {
            return Buffer.from('some value');
        }
    }

    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('constructor', () => {
        it ('should set values', () => {
            const mockClass = new MockClass();

            const historicState = new HistoricState(12345, 'some tx id', mockClass as any);

            historicState.timestamp.should.deep.equal(12345);
            historicState.txId.should.deep.equal('some tx id');
            historicState.value.should.deep.equal(mockClass);
        });
    });

    describe ('serialize', () => {
        it ('should serialize its data and use serialized data from value', () => {
            const mockClass = new MockClass();

            const expectedSerializedValue = Buffer.from(JSON.stringify({some: 'object'}));

            const serializeStub = sandbox.stub(mockClass, 'serialize').returns(expectedSerializedValue);

            const historicState = new HistoricState(12345, 'some tx id', mockClass as any);

            const expectedSerialized = Buffer.from(JSON.stringify({
                timestamp: 12345,
                txId: 'some tx id',
                value: {
                    some: 'object',
                },
            }));

            historicState.serialize().should.deep.equal(expectedSerialized);
            serializeStub.should.have.been.calledOnceWithExactly();
        });
    });
});
