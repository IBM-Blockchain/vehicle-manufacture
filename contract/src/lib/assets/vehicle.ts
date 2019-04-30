/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { Manufacturer } from '../organizations/manufacturer';
import { Person } from '../participants/person';
import { NotRequired } from '../utils/annotations';
import { Asset } from './asset';
import './usageEvents';
import { UsageEvent } from './usageEvents';
import { IVehicleDetails } from './vehicleDetails';
const logger = newLogger('VEHICLE');

export enum VehicleStatus {
    ACTIVE = 0,
    OFF_THE_ROAD,
    SCRAPPED,
}

@Object()
export class Vehicle extends Asset {
    public static getClass() {
        return Asset.generateClass(Vehicle.name);
    }

    public static validateVin(vin: string, manufacturer: Manufacturer, validationYear: number): boolean {
        const yearChars = [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y',
            1, 2, 3, 4, 5, 6, 7, 8, 9,
        ];

        const yearChar = yearChars[(validationYear - 1980) % yearChars.length];
        return vin.length === 17 &&
            vin.charAt(0) === manufacturer.originCode &&
            vin.charAt(1) === manufacturer.manufacturerCode &&
            vin.charAt(9) === yearChar;
    }

    @Property()
    private vehicleDetails: IVehicleDetails;

    private _vehicleStatus: VehicleStatus;

    private _ownerId: string;

    private _telematicId: string;

    @Property()
    private manufactured: number;

    constructor(
        id: string,
        telematicId: string,
        vehicleDetails: IVehicleDetails,
        vehicleStatus: VehicleStatus,
        manufactured: number,
        @NotRequired ownerId?: string,
    ) {
        super(id, Vehicle.name);

        this.vehicleDetails = vehicleDetails;
        this._vehicleStatus = vehicleStatus;
        this.manufactured = manufactured;
        this._telematicId = telematicId;

        if (ownerId) {
            this._ownerId = ownerId;
        }
    }

    @Property()
    get ownerId(): string {
        return this._ownerId;
    }

    set ownerId(ownerId: string) {
        this._ownerId = ownerId;
    }

    @Property()
    get vehicleStatus(): VehicleStatus {
        return this._vehicleStatus;
    }

    set vehicleStatus(status: VehicleStatus) {
        this._vehicleStatus = status;
    }

    @Property()
    get telematicId(): string {
        return this._telematicId;
    }

    public belongsTo(person: Person) {
        return person.id === this.ownerId;
    }

    public madeByOrg(person: Person) {
        return person.orgId === this.vehicleDetails.makeId;
    }
}
