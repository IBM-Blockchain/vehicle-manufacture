/*
SPDX-License-Identifier: Apache-2.0
*/
import { Property } from 'fabric-contract-api';

enum EventType {
    ACTIVATED = 1,
    CRASHED,
    OVERHEATED,
    OIL_FREEZING,
    ENGINE_FAILURE,
}

@Object()
export class IUsageEvent {
    @Property()
    public eventID: string;

    @Property()
    public eventType: EventType;

    @Property()
    public acceleration: number;

    @Property()
    public airTemperature: number;

    @Property()
    public engineTemperature: number;

    @Property()
    public lightLevel: number;

    @Property()
    public pitch: number;

    @Property()
    public roll: number;

    @Property()
    public timestamp: Date;
}
