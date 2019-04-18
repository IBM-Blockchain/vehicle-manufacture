import * as uuid from 'uuid/v5';
import { NetworkNameUUID } from '../../constants';

export function generateId(txId: string, ...additionalData: string[]) {
    return uuid(txId + ':' + additionalData.join(':'), NetworkNameUUID);
}
