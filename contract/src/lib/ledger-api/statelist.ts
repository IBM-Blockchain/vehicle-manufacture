/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';
import { Context } from 'fabric-contract-api';
import { IState, State } from './state';

export interface IHistoricState {
    value: any;
    timestamp: Date;
    txId: string;
}

export class StateList {

    private ctx: Context;
    private name: string;
    private supportedClasses: Map<string, IState>;

    constructor(ctx: Context, listName: string) {
        this.ctx = ctx;
        this.name = listName;
        this.supportedClasses = new Map();
    }

    public getCtx(): Context {
        return this.ctx;
    }

    public async addState(state: State) {
        const key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
        const data = state.serialize();

        const buff = await this.ctx.stub.getState(key);

        if (buff.length > 0) {
            throw new Error('Cannot create new state. State already exists for key');
        }

        await this.ctx.stub.putState(key, data);
    }

    public async getState(key: string): Promise<any> {
        const ledgerKey = this.ctx.stub.createCompositeKey(this.name, State.splitKey(key));
        const data = await this.ctx.stub.getState(ledgerKey);

        if (data.length === 0) {
            throw new Error('Cannot get state. No state exists for key');
        }

        const state = State.deserialize(data, this.supportedClasses);
        return state;
    }

    public async getStateHistory(key: string): Promise<IHistoricState[]> {
        const ledgerKey = this.ctx.stub.createCompositeKey(this.name, State.splitKey(key));
        const keyHistory = await this.ctx.stub.getHistoryForKey(ledgerKey);

        const history: IHistoricState[] = [];

        let value = (await keyHistory.next()).value;

        while (value) {
            const state = State.deserialize((value.getValue() as any).toBuffer(), this.supportedClasses);

            const historicState: IHistoricState = {
                timestamp: new Date((value.getTimestamp() as any).seconds.low * 1000),
                txId: value.getTxId(),
                value: state,
            };

            history.push(historicState);

            const next = await keyHistory.next();
            value = next.value;
        }

        return history;
    }

    public async getAllStates(): Promise<Map<string, any>> {
        const data = await this.ctx.stub.getStateByPartialCompositeKey(this.name, []);

        const states = new Map();

        let value = (await data.next()).value;

        while (value) {

            const state = State.deserialize((value.getValue() as any).toBuffer(), this.supportedClasses);

            states.set(splitCompositeKey(value.getKey()).attributes[0], state);

            const next = await data.next();
            value = next.value;
        }

        return states;
    }

    public async getNumberStates(): Promise<number> {
        const data = await this.ctx.stub.getStateByPartialCompositeKey(this.name, []);

        let counter = 0;

        while (true) {
            const next = await data.next();

            if (next.value) {
                counter++;
            }

            if (next.done) {
                break;
            }
        }

        return counter;
    }

    public async updateState(state: any) {
        if (!(state instanceof State)) {
            throw new Error(`Cannot use ${state.constructor.name} as type State`);
        }

        const key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
        const data = state.serialize();

        const buff = await this.ctx.stub.getState(key);

        if (buff.length === 0) {
            throw new Error('Cannot update state. No state exists for key');
        }

        await this.ctx.stub.putState(key, data);
    }

    public use(...stateClasses: any[]) {
        for (const stateClass of stateClasses) {
            if (!((stateClass as any).prototype instanceof State)) {
                throw new Error(`Cannot use ${(stateClass as any).prototype.constructor.name} as type State`);
            }

            this.supportedClasses.set(stateClass.getClass(), stateClass);
        }
    }

}

const MIN_UNICODE_RUNE_VALUE = '\u0000';
const COMPOSITEKEY_NS = '\x00';

function splitCompositeKey(compositeKey) {
    const result = {objectType: null, attributes: []};
    if (compositeKey && compositeKey.length > 1 && compositeKey.charAt(0) === COMPOSITEKEY_NS) {
        const splitKey = compositeKey.substring(1).split(MIN_UNICODE_RUNE_VALUE);
        result.objectType = splitKey[0];
        splitKey.pop();
        if (splitKey.length > 1) {
            splitKey.shift();
            result.attributes = splitKey;
        }
    }
    return result;
}
