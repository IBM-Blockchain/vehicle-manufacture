/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';
import { Context } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { IState, State } from './state';

const logger = newLogger('STATELIST');

export interface IHistoricState {
    value: any;
    timestamp: Date;
    txId: string;
}

export class StateList<T extends State> {

    private ctx: Context;
    private name: string;
    private supportedClasses: Map<string, IState<T>>;

    constructor(ctx: Context, listName: string) {
        this.ctx = ctx;
        this.name = listName;
        this.supportedClasses = new Map();
    }

    public getCtx(): Context {
        return this.ctx;
    }

    public async add(state: T) {
        const key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
        const data = state.serialize();

        const buff = await this.ctx.stub.getState(key);

        if (buff.length > 0) {
            throw new Error('Cannot create new state. State already exists for key');
        }

        await this.ctx.stub.putState(key, data);
    }

    public async get(key: string): Promise<T> {
        const ledgerKey = this.ctx.stub.createCompositeKey(this.name, State.splitKey(key));
        const data = await this.ctx.stub.getState(ledgerKey);

        if (data.length === 0) {
            throw new Error(`Cannot get state. No state exists for key ${key} ${this.name}`);
        }
        const state = State.deserialize(data, this.supportedClasses) as T;

        return state;
    }

    public async getHistory(key: string): Promise<IHistoricState[]> {
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

    public async getAll(): Promise<T[]> {
        const data = await this.ctx.stub.getStateByPartialCompositeKey(this.name, []);

        const states: any[] = [];

        let value = (await data.next()).value;

        while (value) {

            const state = State.deserialize((value.getValue() as any).toBuffer(), this.supportedClasses);

            states.push(state);

            const next = await data.next();
            value = next.value;
        }

        return states;
    }

    public async count(): Promise<number> {
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

    public async update(state: any) {
        if (!(state instanceof State)) {
            throw new Error(`Cannot use ${state.constructor.name} as type State`);
        }

        const key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
        const data = state.serialize();

        const buff = await this.ctx.stub.getState(key);

        if (buff.length === 0) {
            throw new Error(`Cannot update state. No state exists for key ${key}`);
        }

        await this.ctx.stub.putState(key, data);
    }

    public async exists(key: string) {
        try {
            await this.get(key);
            return true;
        } catch (err) {
            return false;
        }
    }

    public getName(): string {
        return this.name;
    }

    public use(...stateClasses: Array<IState<T>>) {
        for (const stateClass of stateClasses) {
            if (!((stateClass as any).prototype instanceof State)) {
                throw new Error(`Cannot use ${(stateClass as any).prototype.constructor.name} as type State`);
            }
            this.supportedClasses.set(stateClass.getClass(), stateClass);
        }
    }

}
