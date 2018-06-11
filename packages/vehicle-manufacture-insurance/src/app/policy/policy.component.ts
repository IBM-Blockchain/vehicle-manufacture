import { Component, OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { WindowRef } from '../window-ref/window-ref.service';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.css']
})
export class PolicyComponent implements OnInit {

  private L: any;

  private policy: object;
  private ready = false;

  private liveData = {
    acc: '-.--',
    airTemp: '-.--',
    engineTemp: '-.--',
    light: '-.--'
  };

  constructor(private winRef: WindowRef, private http: HttpClient) {}

  ngOnInit() {
    this.L = this.winRef.nativeWindow.L;
    this.get_policy_details();
    this.handle_map();

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
        let data = JSON.parse(event.data);

        if (data.connected) {
          document.getElementById('connection-test').innerHTML = "Device Connected &#10004;"
          document.getElementById('connection-test').classList.add('connected');

          websocket.send(JSON.stringify({vin: this.policy['vehicle'].vin}));
        } else if (data.acceleration && data.outside_temperature && data.object_temperature && data.light_level) {
          this.liveData = {
            acc: parseFloat(data.acceleration).toFixed(2),
            airTemp: parseFloat(data.outside_temperature).toFixed(2),
            engineTemp: parseFloat(data.object_temperature).toFixed(2),
            light: parseFloat(data.light_level).toFixed(2)
          };
        } else if (data.$class === 'org.acme.vehicle_network.AddUsageEventEvent') {
          this.policy['vehicle'].usageRecord.map((el) => {
            el.new = false;
            return el;
          });
          data.usageEvent.new = true;
          this.policy['vehicle'].usageRecord.unshift(data.usageEvent);
        }
      };

      websocket.onclose = () => {
        console.log('websocket closed');
        openWebSocket();
      };
    };
    openWebSocket();

  }

  get_policy_details() {
    const pathname = window.location.pathname.split('/');
    const policy_id = pathname[pathname.length - 1];

    this.http.get(`/api/policy/${policy_id}`).subscribe((data) => {
      console.log(data);
      this.policy = data;
      this.policy['vehicle'].usageRecord.sort((a,b) => {
        console.log(a.timestamp, b.timestamp);
        if (a.timestamp < b.timestamp) {
          return 1;
        }
        if (a.timestamp > b.timestamp) {
          return -1;
        }
        return 0;
      });
      this.policy['vehicle'].usageRecord.map((el) => {
        el.new = false;
        return el;
      });
      this.ready = true;
    }, (err) => {
      console.log('Failed to get policy', err);
    });
  }

  handle_map() {
    const lat = localStorage.getItem('lat');
    const long = localStorage.getItem('long');

    let location = {};

    if (lat === 'null' || long === 'null') {
      console.log('NO LOCATION SENT');
      // LOCATION WAS NOT SUPPLIED TRY TO USE LOCATION OF INSURER TO POSITION MAP AS LIKELY DEMO RUNNING IN SAME PLACE 
      navigator.geolocation.getCurrentPosition((position) => {
        location = position;
      }, (error) => {
        // COULDN'T GET LOCATION OF WHERE BROWSER IS RUNNING USE A DEFAULT
        location = {
          coords: {
            accuracy: 20,
            latitude: 41.1149552,
            longitude: -73.719111
          },
          timestamp: 1505126421109
        };
      });
    } else {
      console.log('LOCATION SENT');
      // USER SUPPLIED LOCATION
      location = {
        coords: {
          accuracy: 20,
          latitude: lat,
          longitude: long
        },
        timestamp: 1505126421109
      };
    }
    this.draw_map(location);
  }

  draw_map(location) {
    const map_location = [
      location.coords.latitude,
      location.coords.longitude
    ];

    const mymap = this.L.map('mapid').setView(map_location, 15);

    this.L.tileLayer('https://api.mapbox.com/styles/v1/annaet/cj7gaoimg3cnu2rqffansnqfl/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW5uYWV0IiwiYSI6ImNpcXdkeTFhdzAwMnBodG5qZnhsa3pwNzgifQ.sLCy6WaD4pURO1ulOFoVCg', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      zoom: 1
    }).addTo(mymap);

    const carIcon = this.L.icon({
      iconUrl: '../../assets/images/car.png',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [-3, -76]
    });

    const marker = this.L.marker(map_location, {icon: carIcon}).addTo(mymap);
  }
}
