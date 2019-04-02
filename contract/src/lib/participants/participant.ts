/*
SPDX-License-Identifier: Apache-2.0
*/

import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';

export class Participant extends State {
    private id: string;

    constructor(id: string, participantType: string) {
        super(NetworkName + '.participants.'  + participantType, [participantType, id]);

        this.id = id;
    }

    public getId(): string {
        return this.id;
    }
}
