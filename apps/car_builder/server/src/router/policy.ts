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
import { BaseRouter, Config } from 'common';
import { post } from 'request-promise-native';

export class PolicyRouter extends BaseRouter {
    public static basePath = 'policies';

    constructor() {
        super();
    }

    public async prepareRoutes() {
        const insurerUrl = await Config.getAppApiUrl('insurer');

        this.router.post('/', async (req, res) => {
            const options = {
                body: req.body,
                headers: {
                    Authorization: 'Basic ' + Buffer.from('carbuilder:carbuilderpw').toString('base64'),
                },
                json: true,
            };

            try {
                const data = await post(insurerUrl + '/policies/requests', options);
                res.send(data);
            } catch (err) {
                res.status(500);
                res.send(err.message);
            }
        });

        this.router.get('/events/created', (req, res) => {
            this.initEventSourceListener(req, res, this.connections, 'POLICY_CREATED');
        });

        this.setupEventListener(insurerUrl + '/policies/events/created', (evt) => {
            this.publishEvent({
                event_name: 'POLICY_CREATED',
                payload: Buffer.from(evt.data),
            });
        });
    }
}
