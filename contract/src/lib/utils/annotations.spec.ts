import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { NotRequired } from './annotations';

const should = chai.should();
chai.use(sinonChai);

// tslint:disable:max-classes-per-file

describe('#Annotations', () => {
    let sandbox: sinon.SinonSandbox;

    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('NotRequired', () => {
        it ('should put question mark next to annotated params name in functions metadata when defined', () => {
            const getMetadataStub = sandbox.stub(Reflect, 'getMetadata').returns(['param1', 'param2']);
            const defineMetadataStub = sandbox.stub(Reflect, 'defineMetadata');

            class MyClass {
                // tslint:disable-next-line:no-empty
                public myFunc(param1: string, @NotRequired param2?: string) {}
            }

            getMetadataStub.should.have.been.calledOnceWithExactly('contract:function', sinon.match.object, 'myFunc');
            defineMetadataStub.should.have.been.calledOnceWithExactly(
                'contract:function', ['param1', 'param2?'], sinon.match.object, 'myFunc',
            );
        });

        it ('should put question mark next to annotated params name in functions metadata when not defined', () => {
            const getMetadataStub = sandbox.stub(Reflect, 'getMetadata').returns(null);
            const defineMetadataStub = sandbox.stub(Reflect, 'defineMetadata');

            class MyClass {
                // tslint:disable-next-line:no-empty
                public myFunc(param1: string, @NotRequired param2?: string) {}
            }

            getMetadataStub.should.have.been.calledOnceWithExactly('contract:function', sinon.match.object, 'myFunc');
            defineMetadataStub.should.have.been.calledOnceWithExactly(
                'contract:function', ['param1', 'param2?'], sinon.match.object, 'myFunc',
            );
        });

        it ('should handle when param is part of constructor', () => {
            const getMetadataStub = sandbox.stub(Reflect, 'getMetadata').returns(['param1', 'param2']);
            const defineMetadataStub = sandbox.stub(Reflect, 'defineMetadata');

            class MyClass {
                // tslint:disable-next-line:no-empty
                constructor(param1: string, @NotRequired param2?: string) {}
            }

            getMetadataStub.should.have.been.calledOnceWithExactly(
                'contract:function', MyClass.prototype, 'constructor',
            );
            defineMetadataStub.should.have.been.calledOnceWithExactly(
                'contract:function', ['param1', 'param2?'], MyClass.prototype, 'constructor',
            );
        });

        it ('should handle when param already has ? at the end', () => {
            const getMetadataStub = sandbox.stub(Reflect, 'getMetadata').returns(['param1', 'param2?']);
            const defineMetadataStub = sandbox.stub(Reflect, 'defineMetadata');

            class MyClass {
                // tslint:disable-next-line:no-empty
                constructor(param1: string, @NotRequired param2?: string) {}
            }

            getMetadataStub.should.have.been.calledOnceWithExactly(
                'contract:function', MyClass.prototype, 'constructor',
            );
            defineMetadataStub.should.have.been.calledOnceWithExactly(
                'contract:function', ['param1', 'param2?'], MyClass.prototype, 'constructor',
            );
        });
    });
});
