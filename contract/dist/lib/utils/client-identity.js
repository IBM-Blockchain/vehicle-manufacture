"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_shim_1 = require("fabric-shim");
const insurer_1 = require("../participants/insurer");
const manufacturer_1 = require("../participants/manufacturer");
const person_1 = require("../participants/person");
const regulator_1 = require("../participants/regulator");
const ROLE_FIELD = 'vehicle_manufacture.role';
const ID_FIELD = 'vehicle_manufacture.username';
const COMPANY_FIELD = 'vehicle_manufacture.company';
class VehicleManufactureNetClientIdentity extends fabric_shim_1.ClientIdentity {
    constructor(ctx) {
        super(ctx.stub);
        this.ctx = ctx;
    }
    async loadParticipant() {
        const id = this.getAttributeValue(ID_FIELD);
        switch (this.getAttributeValue(ROLE_FIELD)) {
            case 'manufacturer':
            case 'insurer':
            case 'regulator':
            case 'person':
                return this.ctx.getParticipantList().get(id);
            default:
                throw new Error('Unknown participant type ' + this.getAttributeValue(ROLE_FIELD));
        }
    }
    newParticipantInstance() {
        const id = this.getAttributeValue(ID_FIELD);
        const company = this.getAttributeValue(COMPANY_FIELD);
        switch (this.getAttributeValue(ROLE_FIELD)) {
            case 'manufacturer': return new manufacturer_1.Manufacturer(this.getMSPID(), company);
            case 'insurer': return new insurer_1.Insurer(this.getMSPID(), company);
            case 'regulator': return new regulator_1.Regulator(this.getMSPID(), company);
            case 'person': return new person_1.Person(id);
            default:
                throw new Error('Unknown participant type ' + this.getAttributeValue(ROLE_FIELD));
        }
    }
}
exports.VehicleManufactureNetClientIdentity = VehicleManufactureNetClientIdentity;
//# sourceMappingURL=client-identity.js.map