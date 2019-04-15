/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { Participant } from '../participants/participant';
import { NotRequired } from '../utils/annotations';
import { Asset } from './asset';
import './usageEvents';
import { IUsageEvent } from './usageEvents';
import { IVehicleDetails } from './vehicleDetails';
const logger = newLogger('VEHICLE');

export enum VehicleStatus {
    ACTIVE = 0,
    OFF_THE_ROAD,
    SCRAPPED,
}

const assetType = 'Vehicle';

@Object()
export class Vehicle extends Asset {
    public static getClass() {
        return Asset.generateClass(assetType);
    }

    public static getSubClasses() {
        return [];
    }
    @Property()
    private vin: string;

    @Property()
    private vehicleDetails: IVehicleDetails;

    @Property()
    private vehicleStatus: VehicleStatus;

    @Property('usageRecord', 'IUsageEvent[]')
    private usageRecord: IUsageEvent[];

    @Property()
    private _ownerId: string;

    constructor(
        vin: string, vehicleDetails: IVehicleDetails, vehicleStatus: VehicleStatus, usageRecord: IUsageEvent[],
        @NotRequired ownerId?: string,
    ) {
        super(vin, assetType);

        this.vin = vin;
        this.vehicleDetails = vehicleDetails;
        this.vehicleStatus = vehicleStatus;
        this.usageRecord = usageRecord;

        if (ownerId) {
            this._ownerId = ownerId;
        }
    }

    get ownerId(): string {
        return this._ownerId;
    }

    set ownerId(ownerId: string) {
        this._ownerId = ownerId;
    }

    public belongsTo(participant: Participant) {
        return participant.id === this.ownerId;
    }

    public madeByOrg(participant: Participant) {
        return participant.orgName === this.vehicleDetails.makeId;
    }
}
