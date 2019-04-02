import { Participant } from './participant';
export declare class Company extends Participant {
    private name;
    constructor(id: string, name: string, companyType: string);
    getName(): string;
}
