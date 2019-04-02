"use strict";
/*
SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../constants");
const state_1 = require("../ledger-api/state");
class Participant extends state_1.State {
    constructor(id, participantType) {
        super(constants_1.NetworkName + '.' + participantType, [id]);
        this.id = id;
    }
    getId() {
        return this.id;
    }
}
exports.Participant = Participant;
//# sourceMappingURL=participant.js.map