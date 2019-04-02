import { IKeyValueAttribute } from 'fabric-ca-client';
export interface LocUser {
    name: string;
    attrs: Array<IKeyValueAttribute>;
}
export declare class Enroll {
    static enrollUsers(walletPath: string, connectionProfilePath: string, users: Array<LocUser>, adminName: string, org: string): Promise<void>;
    private static getWallet;
    private static connectAsAdmin;
    private static enrollUser;
}
