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
    public readonly vin: string;

    @Property()
    public readonly startDate: number;

    @Property()
    public readonly endDate: number;

    @Property()
    private insurerId: string;

    @Property()
    private holderId: string;

    @Property()
    private policyType: PolicyType;

    constructor(
        id: string,
        vin: string, insurerId: string, holderId: string, policyType: PolicyType,
        startDate: number, endDate: number,
    ) {
        super(id, Policy.name);

        this.vin = vin;
        this.insurerId = insurerId;
        this.holderId = holderId;
        this.policyType = policyType;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}
