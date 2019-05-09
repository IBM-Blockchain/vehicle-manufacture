export interface IServerConfig {
    walletPath: string;
    connectionProfilePath: string;
    port: number;
    org: string;
}

export interface IFabricConfig {
    walletPath: string;
    connectionProfilePath: string;
    channelName: string;
    contractName: string;
    org: string;
}