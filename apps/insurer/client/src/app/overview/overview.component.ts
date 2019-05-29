import { Component, NgZone, OnInit } from '@angular/core';
import { PolicyService } from '../policy.service';
import { PolicyRequest } from '../popup/popup.component';
import { VehicleService } from '../vehicle.service';

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

  public policiesLoaded = false;
  public usageLoaded = false;

  get request_stack() {
    return this.policyService.requestStack;
  }

  constructor(private vehicleService: VehicleService,
              private policyService: PolicyService,
              private zone: NgZone) {

    this.url = '/api';
    this.date = Date.now();
  }

  ngOnInit() {
    this.policyService.getAll()
      .subscribe((data: any) => {
        this.num_policies = data.length;
        this.policiesLoaded = true;
      });

    this.vehicleService.getUsage()
      .subscribe((events) => {
        this.alerts = events;
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
      this.policyService.requestStack.push(request);
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
    return this.policyService.provideInsurance({approve, requestId})
      .subscribe(() => {

      });
  }
}
