import { ComponentMetadata } from './metadata_interfaces';

export interface Swagger {
    openapi?: string;
    components?: ComponentMetadata;
    paths?: {[path: string]: string};
}