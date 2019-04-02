/*
SPDX-License-Identifier: Apache-2.0
*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("./state");
class StateList {
    constructor(ctx, listName) {
        this.ctx = ctx;
        this.name = listName;
        this.supportedClasses = new Map();
    }
    getCtx() {
        return this.ctx;
    }
    async addState(state) {
        const key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
        const data = state.serialize();
        const buff = await this.ctx.stub.getState(key);
        if (buff.length > 0) {
            throw new Error('Cannot create new state. State already exists for key');
        }
        await this.ctx.stub.putState(key, data);
    }
    async getState(key) {
        const ledgerKey = this.ctx.stub.createCompositeKey(this.name, state_1.State.splitKey(key));
        const data = await this.ctx.stub.getState(ledgerKey);
        if (data.length === 0) {
            throw new Error('Cannot get state. No state exists for key');
        }
        const state = state_1.State.deserialize(data, this.supportedClasses);
        return state;
    }
    async getStateHistory(key) {
        const ledgerKey = this.ctx.stub.createCompositeKey(this.name, state_1.State.splitKey(key));
        const keyHistory = await this.ctx.stub.getHistoryForKey(ledgerKey);
        const history = [];
        let value = (await keyHistory.next()).value;
        while (value) {
            const state = state_1.State.deserialize(value.getValue().toBuffer(), this.supportedClasses);
            const historicState = {
                timestamp: new Date(value.getTimestamp().seconds.low * 1000),
                txId: value.getTxId(),
                value: state,
            };
            history.push(historicState);
            const next = await keyHistory.next();
            value = next.value;
        }
        return history;
    }
    async getAllStates() {
        const data = await this.ctx.stub.getStateByPartialCompositeKey(this.name, []);
        const states = new Map();
        let value = (await data.next()).value;
        while (value) {
            const state = state_1.State.deserialize(value.getValue().toBuffer(), this.supportedClasses);
            states.set(splitCompositeKey(value.getKey()).attributes[0], state);
            const next = await data.next();
            value = next.value;
        }
        return states;
    }
    async getNumberStates() {
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
    async updateState(state) {
        if (!(state instanceof state_1.State)) {
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
    use(...stateClasses) {
        for (const stateClass of stateClasses) {
            if (!(stateClass.prototype instanceof state_1.State)) {
                throw new Error(`Cannot use ${stateClass.prototype.constructor.name} as type State`);
            }
            this.supportedClasses.set(stateClass.getClass(), stateClass);
        }
    }
}
exports.StateList = StateList;
const MIN_UNICODE_RUNE_VALUE = '\u0000';
const COMPOSITEKEY_NS = '\x00';
function splitCompositeKey(compositeKey) {
    const result = { objectType: null, attributes: [] };
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
//# sourceMappingURL=statelist.js.map