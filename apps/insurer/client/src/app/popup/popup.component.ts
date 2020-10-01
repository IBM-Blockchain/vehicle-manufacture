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
import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { VehicleService } from '../vehicle.service';

export interface PolicyRequest {
  requestId: string;
  vin: string;
  holderId: string;
  policyType: number;
  endDate: number;
  location: {
    latitude: string;
    longitude: string; // shh the IoT sensor doesn't send location so car builder fakes it ;)
  }
}

interface User {
  forename: string;
  surname: string;
  memberSince: number;
  address: string[];
}

interface VehicleDetails {
  makeId: string;
  manufactured: number;
  modelType: string;
  colour: string;
}

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent implements OnInit {

  @Input() request: PolicyRequest;
  @Output() actioned: EventEmitter<{approve: boolean, requestId: string}> = new EventEmitter<{approve: boolean, requestId: string}>();

  public requestee: User;
  public vehicleDetails: VehicleDetails;

  constructor(private vehicleService: VehicleService, private ref: ChangeDetectorRef) {}

  ngOnInit() {

    let headers = new HttpHeaders();
    headers = headers.append('Authorization', 'Basic ' + btoa('policies:policiespw'));

    this.requestee = {
      forename: this.request.holderId.split('@')[0],
      surname: 'Harris',
      memberSince: 1415923200000,
      address: ['40 Garick Pass', 'Newbury', 'United Kingdom']
    };

    this.vehicleService.get(this.request.vin)
      .subscribe((vehicle) => {
        this.vehicleDetails = vehicle.vehicleDetails as any;
        this.vehicleDetails.manufactured = vehicle.manufactured;

        this.ref.detectChanges();
      });
  }

  cancel() {
    this.actioned.emit({approve: false, requestId: this.request.requestId});
  }

  approve() {
    const location_data = this.request.location;

    localStorage.setItem('lat', location_data.latitude);
    localStorage.setItem('long', location_data.longitude);
    this.actioned.emit({approve: true, requestId: this.request.requestId});
  }
}
