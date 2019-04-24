export interface IEvent {
    event_name: string,
    payload?: Buffer,
    chaincodeId: string,
    txId: string
}