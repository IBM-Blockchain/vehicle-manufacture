import * as FabricJSONSerializer from 'fabric-contract-api/lib/jsontransactionserializer';
import { newLogger } from 'fabric-shim';

const logger = newLogger('SERIALIZER');

// SERIALIZER SPECIFIC TO THIS DEMO - NOT A GENERIC SOLUTION
export class JSONSerializer extends FabricJSONSerializer {
    public toBuffer(result: any, schema: object = {}, loggerPrefix: string) {
        result = this.serialize(result);

        return super.toBuffer(result, schema, loggerPrefix);   
    }

    private serialize(result: any): any {
        if (!result) {
            return null;
        } else if (Array.isArray(result)) {
            return result.map((el) => {
                return this.serialize(el);
            });
        } else if (typeof result.serialize === 'function') {
            return JSON.parse(result.serialize());
        }

        return result;
    }
}
