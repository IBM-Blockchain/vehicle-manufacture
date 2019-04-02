import { Argv } from 'yargs';
export declare const command = "enroll [options]";
export declare const desc = "enroll users for letter of credit";
export declare const builder: (yargs: Argv<{}>) => Argv<{}>;
export declare const handler: (argv: any) => Promise<void>;
