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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { Config } from './config';


const EventTypes = [ 'ACTIVATED', 'CRASHED', 'OVERHEATED', 'OIL_FREEZING', 'ENGINE_FAILURE'];

interface Vehicle {
  manufactured: number;
  vehicleDetails: {
    makeId: string;
    modelType: string;
    colour: string;
  }
}

@Injectable()
export class VehicleService {
  constructor(private config: Config, private http: HttpClient) {}

  get(vin: string): Observable<Vehicle> {
    return this.http.get(`${this.config.insurer_url}/vehicles/${vin}`, VehicleService.headerOptions()) as Observable<Vehicle>
  }

  getUsage(): Observable<any[]> {
    return this.http.get(`${this.config.insurer_url}/vehicles/usage`, VehicleService.headerOptions())
      .map((events: any[]) => {
        return events.map((event) => {
          return {
            id: event.id,
            timestamp: event.timestamp,
            eventType: EventTypes[event.eventType]
          };
        }).sort((a, b) => b.timestamp - a.timestamp);
      })
  }

  static headerOptions() {
    let headers = new HttpHeaders();
    headers = headers.append('Authorization', 'Basic ' + btoa('policies:policies'));
    return {headers};
  }
}
