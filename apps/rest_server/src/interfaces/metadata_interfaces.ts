export interface Schema {
    $ref?: string;
    type?: string;
    properties?: [ParameterMetadata];
}

export interface ParameterMetadata {
    name: string;
    schema: Schema;
}

export interface TransactionMetadata {
    parameters: ParameterMetadata[];
    returns: Schema;
    name: string;
    tag: string[];
}

export interface ContractMetadata {
    name: string;
    transactions: TransactionMetadata[];
}

export interface ComponentMetadata {
    schemas: {[s: string]: object};
}

export interface ChaincodeMetadata {
    name: string;
    components: ComponentMetadata;
    contracts: {[s: string]: ContractMetadata};
}