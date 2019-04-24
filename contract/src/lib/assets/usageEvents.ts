/*
SPDX-License-Identifier: Apache-2.0
*/
import { Object, Property } from 'fabric-contract-api';
import { Asset } from './asset';

export enum EventType {
    ACTIVATED = 1,
    CRASHED,
    OVERHEATED,
    OIL_FREEZING,
    ENGINE_FAILURE,
}

@Object()
export class UsageEvent extends Asset {
    public static getClass() {
        return Asset.generateClass(UsageEvent.name);
    }

    @Property()
    private eventType: EventType;

    @Property()
    private acceleration: number;

    @Property()
    private airTemperature: number;

    @Property()
    private engineTemperature: number;

    @Property()
    private lightLevel: number;

    @Property()
    private pitch: number;

    @Property()
    private roll: number;

    @Property()
    private timestamp: number;

    @Property()
    private vin: string;

    constructor(
        id: string,
        eventType: EventType,
        acceleration: number,
        airTemperature: number,
        engineTemperature: number,
        lightLevel: number,
        pitch: number,
        roll: number,
        timestamp: number,
        vin: string,
    ) {
        super(id, UsageEvent.name);

        this.eventType = eventType;
        this.acceleration = acceleration;
        this.airTemperature = airTemperature;
        this.engineTemperature = engineTemperature;
        this.lightLevel = lightLevel;
        this.pitch = pitch;
        this.roll = roll;
        this.timestamp = timestamp;
        this.vin = vin;
    }
}
