import { BaseRouter } from 'common';
import { post } from 'request-promise-native';
import * as EventSource from 'eventsource';

export class OrderRouter extends BaseRouter {
    public static basePath = 'orders';

    constructor() {
        super();
    }

    public async prepareRoutes() {
        this.router.post('/', async (req, res) => {
            const options = {
                body: req.body,
                json: true,
                headers: {
                    'Authorization': 'Basic ' + Buffer.from('carbuilder:carbuilderpw').toString('base64')
                }
            };

            try {
                const data = await post('http://localhost:6001/api/orders', options);
                res.send(data);
            } catch (err) {
                res.status(500);
                res.send(err.message);
            }
        });

        this.router.get('/events/updated', (req, res) => {
            this.initEventSourceListener(req, res, this.connections, 'UPDATE_ORDER');
        });

        const orderUpdated = new EventSource('http://localhost:6001/api/orders/events/updated');

        orderUpdated.onopen = (evt) => {
            console.log('OPEN', evt);
        }

        orderUpdated.onerror = (evt) => {
            console.log('ERROR', evt);
        }

        orderUpdated.onmessage = (evt) => {
            this.publishEvent({
                event_name: 'UPDATE_ORDER',
                payload: Buffer.from(evt.data),
            });
        }
    }
}