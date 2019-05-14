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
