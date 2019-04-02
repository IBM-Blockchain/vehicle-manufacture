"use strict";
/*
SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../constants");
const statelist_1 = require("../ledger-api/statelist");
class ParticipantList extends statelist_1.StateList {
    constructor(ctx, listName, validTypes) {
        super(ctx, constants_1.NetworkName + '.participantslist.' + listName);
        this.use(...validTypes);
    }
    async add(participant) {
        return this.addState(participant);
    }
    async get(participantId) {
        return this.getState(participantId);
    }
    async update(participant) {
        return this.updateState(participant);
    }
}
exports.ParticipantList = ParticipantList;
//# sourceMappingURL=participantlist.js.map