import { Context } from 'fabric-contract-api';
import { State } from './state';
export interface IHistoricState {
    value: any;
    timestamp: Date;
    txId: string;
}
export declare class StateList {
    private ctx;
    private name;
    private supportedClasses;
    constructor(ctx: Context, listName: string);
    getCtx(): Context;
    addState(state: State): Promise<void>;
    getState(key: string): Promise<any>;
    getStateHistory(key: string): Promise<IHistoricState[]>;
    getAllStates(): Promise<Map<string, any>>;
    getNumberStates(): Promise<number>;
    updateState(state: any): Promise<void>;
    use(...stateClasses: any[]): void;
}
