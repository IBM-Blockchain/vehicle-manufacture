/*
SPDX-License-Identifier: Apache-2.0
*/

import { ClientIdentity } from 'fabric-shim';
import { Insurer } from '../participants/insurer';
import { Manufacturer } from '../participants/manufacturer';
import { Participant } from '../participants/participant';
import { Person } from '../participants/person';
import { Regulator } from '../participants/regulator';
import { VehicleManufactureNetContext } from './context';

const ROLE_FIELD = 'vehicle_manufacture.role';
const ID_FIELD = 'vehicle_manufacture.username';
const COMPANY_FIELD = 'vehicle_manufacture.company';

export class VehicleManufactureNetClientIdentity extends ClientIdentity {
    private ctx: VehicleManufactureNetContext;

    constructor(ctx: VehicleManufactureNetContext) {
        super(ctx.stub);

        this.ctx = ctx;
    }

    public async loadParticipant(): Promise<Participant> {
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

    public newParticipantInstance(): Participant {
        const id = this.getAttributeValue(ID_FIELD);
        const company = this.getAttributeValue(COMPANY_FIELD);

        switch (this.getAttributeValue(ROLE_FIELD)) {
            case 'manufacturer': return new Manufacturer(this.getMSPID(), company);
            case 'insurer': return new Insurer(this.getMSPID(), company);
            case 'regulator': return new Regulator(this.getMSPID(), company);
            case 'person': return new Person(id);
            default:
                throw new Error('Unknown participant type ' + this.getAttributeValue(ROLE_FIELD));
        }
    }
}
