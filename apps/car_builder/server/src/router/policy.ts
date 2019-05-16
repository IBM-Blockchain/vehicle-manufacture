import { BaseRouter } from 'common';
import { post } from 'request-promise-native';
import * as EventSource from 'eventsource';

export class PolicyRouter extends BaseRouter {
    public static basePath = 'policies';

    constructor() {
        super()
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
                const data = await post('http://prince_app:4200/api/policies/requests', options);
                res.send(data);
            } catch (err) {
                res.status(500);
                res.send(err.message);
            }
        });

        this.router.get('/events/created', (req, res) => {
            this.initEventSourceListener(req, res, this.connections, 'POLICY_CREATED');
        });

        const orderUpdated = new EventSource('http://prince_app:4200/api/policies/events/created');

        orderUpdated.onopen = (evt) => {
            console.log('OPEN', evt);
        }

        orderUpdated.onerror = (evt) => {
            console.log('ERROR', evt);
        }

        orderUpdated.onmessage = (evt) => {
            this.publishEvent({
                event_name: 'POLICY_CREATED',
                payload: Buffer.from(evt.data),
            });
        }
    }
}