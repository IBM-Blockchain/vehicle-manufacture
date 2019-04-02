import { Argv } from 'yargs';
export declare const command = "import [options]";
export declare const desc = "import admins for letter of credit";
export declare const builder: (yargs: Argv<{}>) => Argv<{}>;
export declare const handler: (argv: any) => Promise<void>;
