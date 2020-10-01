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
import { Config, BaseRouter } from 'common';
import { post, get } from 'request-promise-native';

export class OrderRouter extends BaseRouter {
    public static basePath = 'orders';

    constructor() {
        super();
    }

    public async prepareRoutes() {
        const manufacturerUrl = await Config.getAppApiUrl('manufacturer');

        this.router.post('/', async (req, res) => {
            const options = {
                body: req.body,
                headers: {
                    Authorization: 'Basic ' + Buffer.from('carbuilder:carbuilderpw').toString('base64'),
                },
                json: true,
            };

            try {
                const data = await post(manufacturerUrl + '/orders', options);
                res.send(data);
            } catch (err) {
                res.status(500);
                res.send(err.message);
            }
        });

        this.router.get('/:orderId/history', async (req, res) => {
            const options = {
                headers: {
                    Authorization: 'Basic ' + Buffer.from('carbuilder:carbuilderpw').toString('base64'),
                },
                json: true,
            };

            try {
                const data = await get(manufacturerUrl + '/orders/' + req.params.orderId + '/history', options);
                res.send(data);
            } catch (err) {
                res.status(500);
                res.send(err.message);
            }
        });

        this.router.get('/events/updated', (req, res) => {
            this.initEventSourceListener(req, res, this.connections, 'UPDATE_ORDER');
        });

        this.setupEventListener(manufacturerUrl + '/orders/events/updated', (evt) => {
            this.publishEvent({
                event_name: 'UPDATE_ORDER',
                payload: Buffer.from(evt.data),
            });
        });
    }
}
