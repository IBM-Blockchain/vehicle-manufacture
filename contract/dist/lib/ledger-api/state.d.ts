/// <reference types="node" />
export interface IState {
    getClass(): string;
}
export declare class State {
    static serialize(object: object): Buffer;
    static deserialize(data: Buffer, supportedClasses: Map<string, any>): object;
    static deserializeClass(data: string, objClass: any): object;
    static makeKey(keyParts: string[]): string;
    static splitKey(key: string): string[];
    private static callConstructor;
    private class;
    private key;
    constructor(stateClass: string, keyParts: string[]);
    getClass(): string;
    getKey(): string;
    getSplitKey(): string[];
    serialize(): Buffer;
}
