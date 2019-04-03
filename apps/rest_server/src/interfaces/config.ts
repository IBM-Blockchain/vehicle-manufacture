export interface ServerConfig {
    walletPath: string;
    connectionProfilePath: string;
    port: number;
}

export interface FabricConfig {
    walletPath: string;
    connectionProfilePath: string;
    channelName: string;
    contractName: string;
}