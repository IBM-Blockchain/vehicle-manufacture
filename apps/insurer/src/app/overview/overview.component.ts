import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, NgZone, OnInit } from '@angular/core';
import { PolicyRequest } from '../popup/popup.component';

const EventTypes = [ 'ACTIVATED', 'CRASHED', 'OVERHEATED', 'OIL_FREEZING', 'ENGINE_FAILURE'];

interface UsageEvent {
  id: string;
  timestamp: number;
  eventType: string;
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {


  public placeholder = '-';

  public num_policies = 0;

  private alerts: UsageEvent[] = [];
  date:number;
  url: string = '';

  private request_stack: PolicyRequest[] = [];

  public policiesLoaded = false;
  public usageLoaded = false;

  private httpOptions: any;

  constructor(private http: HttpClient, private zone: NgZone) {

    this.url = 'http://localhost:3002/org.acme.vehicle_network.vehicles';
    this.date = Date.now();

    let headers = new HttpHeaders()
    headers = headers.append('Authorization', 'Basic ' + btoa('system:systempw'));

    this.httpOptions = {
      headers
    };
  }

  ngOnInit() {
    this.http.get(`${this.url}/policies`, this.httpOptions).subscribe((data: any) => {
      this.num_policies = data.length;
      this.policiesLoaded = true;
    });

    this.http.get(`${this.url}/vehicles/usage`, this.httpOptions).subscribe((events: any) => {
      this.alerts = events.map((event) => {
        return {
          id: event.id,
          timestamp: event.timestamp,
          eventType: EventTypes[event.eventType]
        };
      }).sort((a, b) => b.timestamp - a.timestamp);
      this.usageLoaded = true;
    });

    this.setupListener(`${this.url}/vehicles/usage/events/added`, (event: any) => {
      this.alerts.unshift({
        id: event.id,
        timestamp: event.timestamp,
        eventType: EventTypes[event.eventType]
      });
    });

    this.setupListener(`${this.url}/policies/events/created`, (event: any) => {
      this.num_policies++;
    });

    this.setupListener(`${this.url}/policies/events/requested`, (request: PolicyRequest) => {
      console.log('GIVE THEM TO ME', request);
      this.request_stack.push(request);
    });
  }

  setupListener(url: string, onMessage: (msg: any) => void) {
    const usageEventSource = new (window as any).EventSource(url);
    usageEventSource.onopen = (evt) => {
      console.log('OPEN', evt);
    };

    usageEventSource.onerror = (evt) => {
        console.log('ERROR', evt);
        this.setupListener(url, onMessage);
    };

    usageEventSource.onclose = (evt) => {
      console.error('Usage event listener closed');
    };

    usageEventSource.onmessage = (evt) => {
      const event = JSON.parse(evt.data);
      this.zone.run(() => onMessage(event));
    };
  }

  provideInsurance({approve, requestId}: {approve: boolean, requestId: string}) {

    if (approve) {
      this.createPolicy(requestId);
    } else {
      this.popRequest(requestId);
    }
  }

  async createPolicy(requestId: string) {
    console.log('MAKING REQUEST');
    const request = this.request_stack.find((stackedRequest) => {
      return stackedRequest.requestId === requestId;
    });

    if (!request) {
      console.error('No request found for ID', requestId);
      return;
    }

    try {
      const policy = await this.http.post(`${this.url}/policies`, request, this.httpOptions).toPromise() as any;
      window.location.href = '/policy/' + policy.id;
    } catch (err) {
      console.error('ERROR CREATING POLICY', err);
    }

    this.request_stack.pop();
  }

  async popRequest(requestId: string) {
    this.request_stack.pop();

    await this.http.delete(
      `${this.url}/policies/requests/${requestId}`, Object.assign({responseType: 'text'}, this.httpOptions)
    ).toPromise();
  }
}
