/*
SPDX-License-Identifier: Apache-2.0
*/

import { Context } from 'fabric-contract-api';
import { Insurer } from '../participants/insurer';
import { Manufacturer } from '../participants/manufacturer';
import { ParticipantList } from '../participants/participantlist';
import { Person } from '../participants/person';
import { Regulator } from '../participants/regulator';
import { VehicleManufactureNetClientIdentity } from './client-identity';

export class VehicleManufactureNetContext extends Context {

    private ci: VehicleManufactureNetClientIdentity;
    private participantList: ParticipantList;

    constructor() {
        super();

        this.participantList = new ParticipantList(this, 'main', [Manufacturer, Regulator, Insurer, Person]);
        this.clientIdentity = new VehicleManufactureNetClientIdentity(this);
    }

    public getClientIdentity(): VehicleManufactureNetClientIdentity {
        return this.ci;
    }

    public getParticipantList(): ParticipantList {
        return this.participantList;
    }
}
