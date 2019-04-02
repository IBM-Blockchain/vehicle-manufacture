import { Contract } from 'fabric-contract-api';
import { VehicleManufactureNetContext } from '../utils/context';
export declare class ParticipantsContract extends Contract {
    constructor();
    createContext(): VehicleManufactureNetContext;
    registerParticipant(ctx: VehicleManufactureNetContext): Promise<void>;
}
