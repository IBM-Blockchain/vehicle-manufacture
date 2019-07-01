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
import * as FabricJSONSerializer from 'fabric-contract-api/lib/jsontransactionserializer';

// SERIALIZER SPECIFIC TO THIS DEMO - NOT A GENERIC SOLUTION
export class JSONSerializer extends FabricJSONSerializer {
    public toBuffer(result: any, schema: object = {}, loggerPrefix: string): Buffer {
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
