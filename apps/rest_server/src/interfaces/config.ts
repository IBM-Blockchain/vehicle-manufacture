export interface ServerConfig {
    walletPath: string;
    connectionProfilePath: string;
    port: number;
    org: string;
}

export interface FabricConfig {
    walletPath: string;
    connectionProfilePath: string;
    channelName: string;
    contractName: string;
    org: string;
}