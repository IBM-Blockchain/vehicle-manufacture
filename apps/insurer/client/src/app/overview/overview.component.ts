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
import { Component, NgZone, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { PolicyService } from '../policy.service';
import { PolicyRequest } from '../popup/popup.component';
import { EventListener } from '../utils';
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
export class OverviewComponent implements OnInit, OnDestroy {

  public placeholder = '-';

  public num_policies = 0;

  private num_retries: Map<string, number>;

  private alerts: UsageEvent[] = [];
  date:number;
  url: string = '';

  public policiesLoaded = false;
  public usageLoaded = false;

  private listeners: Map<string, EventListener> = new Map();

  get request_stack() {
    return this.policyService.requestStack || [];
  }

  constructor(private vehicleService: VehicleService,
              private policyService: PolicyService,
              private ref: ChangeDetectorRef) {

    this.url = '/api';
    this.date = Date.now();
    this.num_retries = new Map<string, number>();
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
        console.log(this.alerts);
        this.usageLoaded = true;
      });

    const usageEventListener = new EventListener(`${this.url}/vehicles/usage/events/added`, this.handleUsageEvent.bind(this));
    usageEventListener.setup();
    this.listeners.set('usageEvents', usageEventListener);

    const policyCreateListener = new EventListener(`${this.url}/policies/events/created`, this.handlePolicyCreateEvent.bind(this));
    policyCreateListener.setup();
    this.listeners.set('policyCreate', policyCreateListener);

    const policyRequestListener = new EventListener(`${this.url}/policies/events/requested`, this.handlePolicyRequestEvent.bind(this));
    policyRequestListener.setup();
    this.listeners.set('policyRequest', policyRequestListener);
  }

  ngOnDestroy() {
    this.listeners.forEach((listener) => {
      if (listener) {
        listener.forceClose();
      }
    });
  }

  provideInsurance({approve, requestId}: {approve: boolean, requestId: string}) {
    return this.policyService.provideInsurance({approve, requestId})
      .subscribe(() => {

      });
  }

  handleUsageEvent(event: any) {
    this.alerts.unshift({
      id: event.id,
      timestamp: event.timestamp,
      eventType: EventTypes[event.eventType]
    });
  }

  handlePolicyCreateEvent() {
      this.num_policies++;
  }

  handlePolicyRequestEvent(request: PolicyRequest) {
    this.policyService.requestStack.push(request);
    this.ref.detectChanges();
  }
}
