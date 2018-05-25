import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent implements OnInit {

  @Input() request: object;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    let websocketURL = 'ws://' + location.hostname + ':' + location.port;

    if (location.protocol === 'https:') {
      websocketURL = 'wss://' + location.host;
    }

    const openWebSocket = () => {
      console.log('connecting websocket', websocketURL);
      const websocket = new WebSocket(websocketURL);

      websocket.onopen = function () {
        console.log('insurance websocket open!');
      };

      websocket.onmessage = event => {
        const data = JSON.parse(event.data);
        if (data.$class === 'org.acme.vehicle_network.CreatePolicyEvent') {
          window.location.href = "/policy/"+data.policyId;
        }
      }

      websocket.onclose = () => {
        console.log('websocket closed');
        openWebSocket();
      };
    };
    openWebSocket();
  }

  cancel() {
    document.getElementById("notification-window").classList.add("hidden")
  }

  approve() {
    var pID = this.generateID();
    var policy = {
      policyId: pID,
      vehicle: this.request['vehicleDetails'].resource,
      holder: this.request['policyDetails'].requestee,
      insurer: 'resource:org.acme.vehicle_network.Insurer#Prince',
      policyType: this.request['policyDetails'].policyType
    };

    document.getElementById("approve").classList.add('hidden');
    document.getElementById("approve-waiting").classList.remove('hidden');

    this.http.post('api/policy', policy).subscribe((success) => {
    }, (err) => {
        console.log('CreatePolicy error', err);
        document.getElementById("approve").classList.remove('hidden');
        document.getElementById("approve-waiting").classList.add('hidden');
    });

  }

  generateID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
  }

  show() {

  }

}
