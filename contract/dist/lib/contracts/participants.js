"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_contract_api_1 = require("fabric-contract-api");
const context_1 = require("../utils/context");
class ParticipantsContract extends fabric_contract_api_1.Contract {
    constructor() {
        super('org.locnet.participants');
    }
    createContext() {
        return new context_1.VehicleManufactureNetContext();
    }
    async registerParticipant(ctx) {
        const ci = ctx.getClientIdentity();
        const participant = ci.newParticipantInstance();
        await ctx.getParticipantList().add(participant);
    }
}
exports.ParticipantsContract = ParticipantsContract;
//# sourceMappingURL=participants.js.map