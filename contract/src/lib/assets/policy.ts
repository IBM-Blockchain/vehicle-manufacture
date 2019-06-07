/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
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
    public readonly insurerId: string;

    @Property()
    public readonly holderId: string;

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
