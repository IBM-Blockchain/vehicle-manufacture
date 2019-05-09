import { IRequest, Utils } from 'common';

export const getAuth = (req: IRequest): string => {
    const caller = Utils.getAuth(req);

    // PRETEND THIS IS DOING SOMETHING SECURE
    switch (caller) {
        case 'carbuilder': return 'readonly';
        default: return caller;
    }
};
