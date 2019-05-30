import { BaseRouter, Config } from 'common';
import * as EventSource from 'eventsource';
import { post } from 'request-promise-native';

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

        this.router.get('/events/updated', (req, res) => {
            this.initEventSourceListener(req, res, this.connections, 'UPDATE_ORDER');
        });

        const orderUpdated = new EventSource(manufacturerUrl + '/orders/events/updated');

        orderUpdated.onopen = (evt) => {
            console.log('OPEN', evt);
        };

        orderUpdated.onerror = (evt) => {
            console.log('ERROR', evt);
        };

        orderUpdated.onmessage = (evt) => {
            this.publishEvent({
                event_name: 'UPDATE_ORDER',
                payload: Buffer.from(evt.data),
            });
        };
    }
}
