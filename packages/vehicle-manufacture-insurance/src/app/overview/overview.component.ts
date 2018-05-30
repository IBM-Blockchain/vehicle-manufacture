import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {

  num_policies = '-';
  num_alerts = '-';
  private alerts = [];
  date:number;

  private policy_request = {
    vehicleDetails: {
      name: 'Nova',
      image: 'arium_nova.svg',
      zoom: 'cover',
      trim: 'standard',
      colour: 'inferno red',
      interior: 'noble brown',
      extras: ['tinted windows','extended warranty'],
      manufacturingDate: '2018-05-21T08:47:14.976Z'
    },
    policyDetails: {
      requestee: 'resource:org.acme.vehicle.lifecycle.PrivateOwner#Paul',
      policyType: 'FULLY_COMPREHENSIVE'
    }
  };

  private hide_popup = true;

  constructor(private http: HttpClient) {

    this.date = Date.now();

    const openWebSocket = () => {
      let websocketURL = 'ws://' + location.hostname + ':' + location.port;

      if (location.protocol === 'https:') {
        websocketURL = 'wss://' + location.host;
      }

      console.log('connecting websocket', websocketURL);
      const websocket = new WebSocket(websocketURL);

      websocket.onopen = function () {
        console.log('insurance websocket open!');
      };

      websocket.onmessage = event => {
        if (JSON.parse(event.data).$class === 'insurance_request') {
          const data = JSON.parse(event.data);

          const location_data = data.location;

          localStorage.setItem('lat', location_data.latitude);
          localStorage.setItem('long', location_data.longitude);

          this.policy_request.vehicleDetails = data.vehicleDetails;
          this.policy_request.vehicleDetails.manufacturingDate = data.manufacturingDate;
          this.policy_request.policyDetails = {
            requestee: data.requestee,
            policyType: data.policyType
          };

          this.hide_popup = false;

        }
      };

      websocket.onclose = () => {
        console.log('websocket closed');
        openWebSocket();
      };
    };
    openWebSocket();
  }

  ngOnInit() {
    this.http.get('/api/policy').subscribe((data:Array<object>) => {
      this.num_policies = data.length.toString();
    });

    this.http.get('/api/usageRecord').subscribe((data:Array<object>) => {
      this.num_alerts = data.length.toString();
      this.alerts = data;
    });
  }
}
