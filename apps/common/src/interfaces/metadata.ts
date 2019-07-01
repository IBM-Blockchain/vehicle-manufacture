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
export interface ISchema {
    $ref?: string;
    type?: string;
    properties?: [IParameterMetadata];
}

export interface IParameterMetadata {
    name: string;
    schema: ISchema;
}

export interface ITransactionMetadata {
    parameters: IParameterMetadata[];
    returns: ISchema;
    name: string;
    tag: string[];
}

export interface IContractMetadata {
    name: string;
    transactions: ITransactionMetadata[];
    contractInstance: {
        name: string;
        default?: boolean;
    };
}

export interface IComponentMetadata {
    schemas: {[s: string]: object};
}

export interface IChaincodeMetadata {
    name: string;
    components: IComponentMetadata;
    contracts: {[s: string]: IContractMetadata};
}
