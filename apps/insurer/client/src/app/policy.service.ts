import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Config } from './config';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { PolicyRequest } from './popup/popup.component';

interface Policy {
  id: string;
  holderId: string;
  insurerId: string;
  policyType: number;
  startDate: number;
  endDate: number;
  vin: string;
}

interface UsageEvent {
  eventType: number;
  acceleration: number;
  airTemperature: number;
  engineTemperature: number;
  lightLevel: number;
  pitch: number;
  roll: number;
  timestamp: number;
  vin: string;
}

@Injectable()
export class PolicyService {
  requestStack: PolicyRequest[] = [];

  static headerOptions() {
    let headers = new HttpHeaders();
    headers = headers.append('Authorization', 'Basic ' + btoa('policies:policies'));
    return {headers};
  }

  constructor(private config: Config, private http: HttpClient) {}

  getAll() {
    return this.http.get(`${this.config.manufacturer_url}/policies`, PolicyService.headerOptions());
  }

  get(policyId: string | number) {
    return this.http.get(`${this.config.manufacturer_url}/policies/${policyId}`, PolicyService.headerOptions());
  }

  getUsageEvents(policy: Policy): Observable<UsageEvent[]> {
    return this.http.get(`${this.config.manufacturer_url}/policies/${policy.id}/usage`, PolicyService.headerOptions()) as Observable<UsageEvent[]>;
  }

  provideInsurance({approve, requestId}: {approve: boolean, requestId: string}) {
    if (approve) {
      return this.createPolicy(requestId);
    } else {
      return this.popRequest(requestId);
    }
  }

  createPolicy(requestId: string) {
    const request = this.requestStack.find((stackedRequest) => {
      return stackedRequest.requestId === requestId;
    });

    if (!request) {
      console.error('No request found for ID', requestId);
      return;
    }

    return this.http.post(`${this.config.manufacturer_url}/policies`, request, PolicyService.headerOptions())
      .map((policy: any) => {
        this.requestStack.pop();
        window.location.href = '/policy/' + policy.id;
        return policy;
      });
  }

  popRequest(requestId: string) {
    this.requestStack.pop();
    return this.http.delete(
      `${this.config.manufacturer_url}/policies/requests/${requestId}`, Object.assign({responseType: 'text'}, PolicyService.headerOptions())
      );
  }

  setup(policy: Policy) {
    return this.http.post(`${this.config.manufacturer_url}/policies/${policy.id}/setup`, {vin: policy.vin}, PolicyService.headerOptions());
  }
}
