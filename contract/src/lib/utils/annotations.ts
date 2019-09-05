/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import 'reflect-metadata';
import { ReflectParams } from 'reflect-params';

export function NotRequired(target: any, propertyKey: string, descriptor: number) {
    if (typeof propertyKey === 'undefined') {
        propertyKey = 'constructor';
        target = target.prototype;
    }

    const existingParams = Reflect.getMetadata('contract:function', target, propertyKey) ||
        ReflectParams(target[propertyKey]);

    existingParams[descriptor] = (existingParams[descriptor] as string).endsWith('?') ?
        existingParams[descriptor] : existingParams[descriptor] + '?';

    Reflect.defineMetadata('contract:function', existingParams, target, propertyKey);
}
