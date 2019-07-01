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

'use strict';
import { Context } from 'fabric-contract-api';
import { HistoricState, IState, State } from './state';

export class StateList<T extends State> {

    public readonly name: string;
    public readonly supportedClasses: Map<string, IState<T>>;
    private ctx: Context;

    constructor(ctx: Context, listName: string) {
        this.ctx = ctx;
        this.name = listName;
        this.supportedClasses = new Map();
    }

    public async add(state: T): Promise<void> {
        const stateKey = state.getKey();

        if (await this.exists(stateKey)) {
            throw new Error(`Cannot add state. State already exists for key ${stateKey}`);
        }

        const data = state.serialize();

        const key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());

        await this.ctx.stub.putState(key, data);
    }

    public async get(key: string): Promise<T> {
        const ledgerKey = this.ctx.stub.createCompositeKey(this.name, State.splitKey(key));
        const data = await this.ctx.stub.getState(ledgerKey);

        if (data.length === 0) {
            throw new Error(`Cannot get state. No state exists for key ${key}`);
        }
        const state = State.deserialize(data, this.supportedClasses) as T;

        return state;
    }

    public async getHistory(key: string): Promise<Array<HistoricState<T>>> {
        const ledgerKey = this.ctx.stub.createCompositeKey(this.name, State.splitKey(key));
        const keyHistory = await this.ctx.stub.getHistoryForKey(ledgerKey);

        const history: Array<HistoricState<T>> = [];

        let value = (await keyHistory.next()).value;

        while (value) {
            const state = State.deserialize((value.getValue() as any).toBuffer(), this.supportedClasses);

            const historicState: HistoricState<T> = new HistoricState(
                (value.getTimestamp().getSeconds() as any).toInt(), value.getTxId(), state as T,
            );

            history.push(historicState);

            const next = await keyHistory.next();
            value = next.value;
        }

        return history;
    }

    public async getAll(): Promise<T[]> {
        return this.query({});
    }

    public async count(): Promise<number> {
        const data = await this.ctx.stub.getStateByPartialCompositeKey(this.name, []);
        let counter = 0;

        let value = (await data.next()).value;

        while (value) {
            const next = await data.next();
            value = next.value;

            counter++;
        }

        return counter;
    }

    public async update(state: T, force: boolean = false): Promise<void> {
        const stateKey = state.getKey();

        if (!(await this.exists(stateKey)) && !force) {
            throw new Error(`Cannot update state. No state exists for key ${stateKey}`);
        }

        const key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());

        const data = state.serialize();

        await this.ctx.stub.putState(key, data);
    }

    public delete(key: string): Promise<void> {
        const ledgerKey = this.ctx.stub.createCompositeKey(this.name, State.splitKey(key));
        return this.ctx.stub.deleteState(ledgerKey);
    }

    public async exists(key: string): Promise<boolean> {
        try {
            await this.get(key);
            return true;
        } catch (err) {
            return false;
        }
    }

    public async query(query: any): Promise<T[]> {
        if (!query.selector) {
            query.selector = {};
        }
        query.selector._id = {
            $regex: `.*${this.name}.*`,
        };

        const iterator = await this.ctx.stub.getQueryResult(JSON.stringify(query));

        let value = (await iterator.next()).value;

        const states: T[] = [];

        while (value) {
            const state = State.deserialize((value.getValue() as any).toBuffer(), this.supportedClasses) as T;

            states.push(state);

            const next = await iterator.next();
            value = next.value;
        }
        return states;
    }

    public use(...stateClasses: Array<IState<T>>) {
        for (const stateClass of stateClasses) {
            if (!((stateClass as any).prototype instanceof State)) {
                throw new Error(`Cannot use ${(stateClass as any).name} as type State`);
            }
            this.supportedClasses.set(stateClass.getClass(), stateClass);
        }
    }
}
