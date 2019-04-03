/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';

@Object()
export class Participant extends State {
    public static generateClass(assetType: string): string {
        return NetworkName + '.participants.'  + assetType;
    }

    @Property()
    private id: string;

    constructor(id: string, participantType: string) {
        super(Participant.generateClass(participantType), [id]);

        this.id = id;
    }

    public getId(): string {
        return this.id;
    }
}
