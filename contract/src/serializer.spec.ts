import * as chai from 'chai';
import * as FabricJSONSerializer from 'fabric-contract-api/lib/jsontransactionserializer';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { JSONSerializer } from './serializer';

const should = chai.should();
chai.use(sinonChai);

interface ISerializer {
    toBuffer: (result: any, schema: object, loggerPrefix: string) => {};
    serialize: (result: any) => {};
}

describe('#Serializer', () => {
    let serializer: ISerializer;
    let sandbox: sinon.SinonSandbox;

    before(() => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(() => {
        serializer = new JSONSerializer() as unknown as ISerializer;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('toBuffer', () => {
        it ('should call serialize and then return the super to buffer', () => {
            const myBuffer = Buffer.from('some buffer');

            const toBufferStub = sandbox.stub(FabricJSONSerializer.prototype, 'toBuffer').returns(myBuffer);
            const serializeStub = sandbox.stub(serializer as any, 'serialize').returns('some serialized result');

            serializer.toBuffer('some original result', {}, 'some prefix').should.deep.equal(myBuffer);

            serializeStub.should.have.been.calledOnceWithExactly('some original result');
            toBufferStub.should.have.been.calledOnceWithExactly('some serialized result', {}, 'some prefix');
        });
    });

    describe('serialize', () => {
        it ('should return null when no result', () => {
            should.equal((serializer as any).serialize(null), null);
        });

        it ('should return the result for a non-array and missing serialize type', () => {
            serializer.serialize('some string').should.deep.equal('some string');
            serializer.serialize(1).should.deep.equal(1);
            serializer.serialize(true).should.deep.equal(true);
        });

        it ('should return the JSON parsed serialized data of an object with a serialize function', () => {
            const customSerializeStub = sinon.stub().returns('{"serialized": "data"}');

            const testObject = {
                serialize: customSerializeStub,
            };

            serializer.serialize(testObject).should.deep.equal({serialized: 'data'});
            customSerializeStub.callCount.should.deep.equal(1);
        });

        it ('should recurse for an array type', () => {
            const serializeSpy = sandbox.spy(serializer, 'serialize');

            const customSerializeStub = sinon.stub().returns('{"serialized": "data"}');

            const testObject = {
                serialize: customSerializeStub,
            };

            const testArr = ['some', 'string', testObject];

            serializer.serialize(testArr).should.deep.equal(['some', 'string', {serialized: 'data'}]);

            serializeSpy.callCount.should.deep.equal(4);
        });
    });
});
