import { Context } from 'fabric-contract-api';
import { ParticipantList } from '../participants/participantlist';
import { VehicleManufactureNetClientIdentity } from './client-identity';
export declare class VehicleManufactureNetContext extends Context {
    private ci;
    private participantList;
    constructor();
    getClientIdentity(): VehicleManufactureNetClientIdentity;
    getParticipantList(): ParticipantList;
}
