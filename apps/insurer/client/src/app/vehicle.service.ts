import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { Config } from './config';


const EventTypes = [ 'ACTIVATED', 'CRASHED', 'OVERHEATED', 'OIL_FREEZING', 'ENGINE_FAILURE'];

interface VehicleDetails {
  makeId: string;
  modelType: string;
  colour: string;
  manufactured: number;
  manufacturingDate: number;
  extras: string[];
  trim: string;
  image: string;
}

@Injectable()
export class VehicleService {
  constructor(private config: Config, private http: HttpClient) {}

  get(vin: string): Observable<VehicleDetails> {
    return this.http.get(`${this.config.manufacturer_url}/vehicles/${vin}`, VehicleService.headerOptions()) as Observable<VehicleDetails>
  }

  getUsage(): Observable<any[]> {
    return this.http.get(`${this.config.manufacturer_url}/vehicles/usage`, VehicleService.headerOptions())
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
