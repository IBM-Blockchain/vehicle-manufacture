import { BaseRouter, Config } from 'common';
import * as EventSource from 'eventsource';
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

        const policyCreated = new EventSource(insurerUrl + '/policies/events/created');

        policyCreated.onopen = (evt) => {
            console.log('OPEN', evt);
        };

        policyCreated.onerror = (evt) => {
            console.log('ERROR', evt);
        };

        policyCreated.onmessage = (evt) => {
            this.publishEvent({
                event_name: 'POLICY_CREATED',
                payload: Buffer.from(evt.data),
            });
        };
    }
}
