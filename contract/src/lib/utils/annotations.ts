import { newLogger } from 'fabric-shim';
import * as getParams from 'get-params';
import 'reflect-metadata';

const logger = newLogger('ANNOTATIONS');

export function NotRequired(target: any, propertyKey: string, descriptor: number) {
    if (typeof propertyKey === 'undefined') {
        propertyKey = 'constructor';
        target = target.prototype;
    }

    const existingParams = Reflect.getMetadata('contract:function', target, propertyKey) ||
        getParams(target[propertyKey]);

    existingParams[descriptor] = (existingParams[descriptor] as string).endsWith('?') ?
        existingParams[descriptor] : existingParams[descriptor] + '?';

    Reflect.defineMetadata('contract:function', existingParams, target, propertyKey);
}
