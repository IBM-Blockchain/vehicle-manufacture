"use strict";
/*
SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_contract_api_1 = require("fabric-contract-api");
const insurer_1 = require("../participants/insurer");
const manufacturer_1 = require("../participants/manufacturer");
const participantlist_1 = require("../participants/participantlist");
const regulator_1 = require("../participants/regulator");
const client_identity_1 = require("./client-identity");
class VehicleManufactureNetContext extends fabric_contract_api_1.Context {
    constructor() {
        super();
        this.participantList = new participantlist_1.ParticipantList(this, 'main', [manufacturer_1.Manufacturer, regulator_1.Regulator, insurer_1.Insurer]);
        this.clientIdentity = new client_identity_1.VehicleManufactureNetClientIdentity(this);
    }
    getClientIdentity() {
        return this.ci;
    }
    getParticipantList() {
        return this.participantList;
    }
}
exports.VehicleManufactureNetContext = VehicleManufactureNetContext;
//# sourceMappingURL=context.js.map