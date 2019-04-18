import { Object, Property } from 'fabric-contract-api';
import { Asset } from './asset';

export enum PolicyType {
    THIRD_PARTY = 0,
    FIRE_AND_THEFT,
    FULLY_COMPREHENSIVE,
}

@Object()
export class Policy extends Asset {
    public static getClass() {
        return Asset.generateClass(Policy.name);
    }

    @Property()
    private vehicleId: string;

    @Property()
    private insurerId: string;

    @Property()
    private holderId: string;

    @Property()
    private policyType: PolicyType;

    constructor(
        id: string,
        vehicleId: string, insurerId: string, holderId: string, policyType: PolicyType,
    ) {
        super(id, Policy.name);

        this.vehicleId = vehicleId;
        this.insurerId = insurerId;
        this.holderId = holderId;
        this.policyType = policyType;
    }
}
