import { IRequest, Utils } from 'common';

export const getAuth = (req: IRequest): string => {
    const caller = Utils.getAuth(req);

    // PRETEND THIS IS DOING SOMETHING SECURE
    switch (caller) {
        case 'carbuilder': return 'readonly';
        default: return caller;
    }
};

export const authHandlerFactory = (getAuth: (req: IRequest) => string = Utils.getAuth) => {
    return (req: IRequest, res, next) => {
        if (!req.url.includes('events') && !(req.url.includes('telemetry') && req.method === 'GET')) {
            // hack - cannot add auth via EventSource could mess around with cookies for handling auth instead
            try {
                req.user = getAuth(req);
            } catch (err) {
                return next(err);
            }
        }
        next();
    };
};
