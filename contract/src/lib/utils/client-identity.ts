/*
SPDX-License-Identifier: Apache-2.0
*/

import { ClientIdentity, newLogger } from 'fabric-shim';
import { Insurer } from '../participants/insurer';
import { Manufacturer } from '../participants/manufacturer';
import { Participant } from '../participants/participant';
import { Person } from '../participants/person';
import { Regulator } from '../participants/regulator';
import { VehicleManufactureNetContext } from './context';
const logger = newLogger('CLIENTIDENTITY');

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
        logger.info(`LOADED PARTICIPANT ID ${id}`);
        try {
            switch (this.getAttributeValue(ROLE_FIELD)) {
                case 'manufacturer':
                case 'insurer':
                case 'regulator':
                    return await this.ctx.getParticipantList().get(id.split('@')[1]);
                case 'person':
                    return await this.ctx.getParticipantList().get(id);
                default:
                    throw new Error('Unknown participant type ' + this.getAttributeValue(ROLE_FIELD));
            }
        } catch (err) {
            throw new Error('Unable to load participant for client ' + id);
        }
    }

    public newParticipantInstance(...additionalInfo: any[]): Participant {
        const id = this.getAttributeValue(ID_FIELD);
        const org = id.split('@')[1];
        logger.info(`CI id ${id}`);
        const company = this.getAttributeValue(COMPANY_FIELD);

        switch (this.getAttributeValue(ROLE_FIELD)) {
            case 'manufacturer': return this.newManufacturer(id, org, ...additionalInfo);
            case 'insurer': return new Insurer(org, company);
            case 'regulator': return new Regulator(org, company);
            case 'person': return new Person(id);
            default:
                throw new Error('Unknown participant type ' + this.getAttributeValue(ROLE_FIELD));
        }
    }

    private newManufacturer(
        id: string, name: string,
        originCode?: string, manufacturerCode?: string,
    ) {
        if (!originCode || !manufacturerCode) { // handle fact I want o spread in above function
            throw new Error('Missing parameter');
        }

        return new Manufacturer(id, name, originCode, manufacturerCode);
    }
}
