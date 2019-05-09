import { IComponentMetadata } from './metadata';

export interface ISwagger {
    openapi?: string;
    components?: IComponentMetadata;
    paths?: {[path: string]: string};
}