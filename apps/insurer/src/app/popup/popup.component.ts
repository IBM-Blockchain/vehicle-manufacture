import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface PolicyRequest {
  requestId: string;
  vin: string;
  holderId: string;
  policyType: number;
  endDate: number;
}

interface User {
  forename: string;
  surname: string;
  memberSince: number;
  address: string[];
}

interface VehicleDetails {
  makeId: string;
  modelType: string;
  colour: string;
  manufacturingDate: number;
  extras: string[];
  trim: string;
  image: string;
}

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent implements OnInit {

  @Input() request: PolicyRequest;
  @Output() actioned: EventEmitter<{approve: boolean, requestId: string}> = new EventEmitter<{approve: boolean, requestId: string}>();

  private url: string;

  public requestee: User;
  public vehicleDetails: VehicleDetails;

  constructor(private http: HttpClient) {
    this.url = 'http://localhost:3002/org.acme.vehicle_network.vehicles'
  }

  ngOnInit() {

    let headers = new HttpHeaders();
    headers = headers.append('Authorization', 'Basic ' + btoa('system:systempw'));
    const options = {
      headers
    };

    this.requestee = {
      forename: this.request.holderId.split('@')[0],
      surname: 'Harris',
      memberSince: 1415923200000,
      address: ['40 Garick Pass', 'Newbury', 'United Kingdom']
    }

    this.http.get(`${this.url}/vehicles/${this.request.vin}`, options).subscribe((data: any) => {
      this.vehicleDetails = data.vehicleDetails;
      this.vehicleDetails.image = `${this.vehicleDetails.makeId}_${this.vehicleDetails.modelType}.svg`.toLowerCase();
    });
  }

  cancel() {
    this.actioned.emit({approve: false, requestId: this.request.requestId});
  }

  approve() {
    this.actioned.emit({approve: true, requestId: this.request.requestId});
  }
}
