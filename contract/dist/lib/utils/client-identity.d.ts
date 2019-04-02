import { ClientIdentity } from 'fabric-shim';
import { Participant } from '../participants/participant';
import { VehicleManufactureNetContext } from './context';
export declare class VehicleManufactureNetClientIdentity extends ClientIdentity {
    private ctx;
    constructor(ctx: VehicleManufactureNetContext);
    loadParticipant(): Promise<Participant>;
    newParticipantInstance(): Participant;
}
