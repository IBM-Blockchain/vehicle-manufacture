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
import * as fs from 'fs-extra';
import * as path from 'path';

type App = 'carBuilder' | 'insurer' | 'manufacturer' | 'regulator';

export interface IAppConfig {
    apiPath: string;
    domain: string;
    port: number;
    secureConnection: boolean;
}

export type INetworkConfig = {
    [a in App]: IAppConfig;
};

export class Config {
    public static async readConfig(): Promise<INetworkConfig> {
        const returnObject: INetworkConfig = await fs.readJSON(path.resolve(__dirname, '../config/network.json'));

        const apps = ['CAR_BUILDER', 'INSURER', 'MANUFACTURER', 'REGULATOR'];

        apps.forEach((app) => {
            const DOMAIN_ENV_VAR = this.getEnvVarName(app, this.ENV_SUFFIXES.DOMAIN);
            const PORT_ENV_VAR = this.getEnvVarName(app, this.ENV_SUFFIXES.PORT);
            const API_PATH_ENV_VAR = this.getEnvVarName(app, this.ENV_SUFFIXES.API_PATH);
            const SECURE_CONNECTION_ENV_VAR = this.getEnvVarName(app, this.ENV_SUFFIXES.SECURE_CONNECTION);

            const camelApp = toCamelCase(app);

            if (DOMAIN_ENV_VAR in process.env) {
                returnObject[camelApp].domain = process.env[DOMAIN_ENV_VAR];
            }

            if (DOMAIN_ENV_VAR in process.env) {
                returnObject[camelApp].domain = process.env[DOMAIN_ENV_VAR];
            }

            if (PORT_ENV_VAR in process.env) {
                returnObject[camelApp].port = process.env[PORT_ENV_VAR];
            }

            if (API_PATH_ENV_VAR in process.env) {
                returnObject[camelApp].port = process.env[API_PATH_ENV_VAR];
            }

            if (SECURE_CONNECTION_ENV_VAR in process.env) {
                returnObject[camelApp].secureConnection = process.env[SECURE_CONNECTION_ENV_VAR] === 'true' ?
                                                            true : false;
            }

            returnObject[camelApp].apiPath = returnObject[camelApp].apiPath.startsWith('/') ?
                                                returnObject[camelApp].apiPath : '/' + returnObject[camelApp].apiPath;
        });

        return returnObject;
    }

    public static async getAppUrl(app: App): Promise<string> {
        const appConfig = (await this.readConfig())[app];

        const protocol = appConfig.secureConnection ? 'https://' : 'http://';

        return protocol + appConfig.domain + ':' + appConfig.port;
    }

    public static async getAppApiUrl(app: App): Promise<string> {
        const appConfig = (await this.readConfig())[app];
        const appUrl = await this.getAppUrl(app);

        return appUrl + appConfig.apiPath;
    }

    private static ENV_SUFFIXES = {
        API_PATH: 'API_PATH',
        DOMAIN: 'DOMAIN',
        PORT: 'PORT',
        SECURE_CONNECTION: 'SECURE_CONNECTION',
    };

    private static getEnvVarName(app: string, suffix: string) {
        return (app + '_' + suffix).toUpperCase();
    }
}

function toCamelCase(str: string): string {
    return str.toLowerCase().split('_')
        .map((el, idx) => idx === 0 ? el : el.charAt(0).toUpperCase() + el.substring(1))
    .join('');
}
