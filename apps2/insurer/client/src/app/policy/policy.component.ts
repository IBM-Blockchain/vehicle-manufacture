import { Component, OnInit, OnDestroy } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { WindowRef } from '../window-ref/window-ref.service';

interface Policy {
  id: string;
  holderId: string;
  insurerId: string;
  policyType: number;
  startDate: number;
  endDate: number;
  vin: string;
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
  manufactured: number;
  extras: string[];
  trim: string;
  image: string;
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

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.css']
})
export class PolicyComponent implements OnInit, OnDestroy {

  private L: any;

  private policy: Policy;
  private user: User;
  private vehicle: VehicleDetails;
  private usageEvents: UsageEvent[];

  private ready = false;

  private url = 'http://localhost:4200/api';
  private httpOptions: any;

  private liveData = {
    acc: '-.--',
    airTemp: '-.--',
    engineTemp: '-.--',
    light: '-.--'
  };

  private listeners: Map<string, any> = new Map();

  public readonly eventTypes = [ 'CRASHED', 'OVERHEATED', 'OIL FREEZING', 'ENGINE_FAILURE'];

  constructor(private winRef: WindowRef, private http: HttpClient) {
    let headers = new HttpHeaders();
    headers = headers.append('Authorization', 'Basic ' + btoa('policies:policies'));

    this.httpOptions = {
      headers
    };
  }

  async ngOnInit() {
    this.L = this.winRef.nativeWindow.L;
    await this.getPolicyDetails();
    this.handleMap();

    const usageEventListener = this.setupListener(`${this.url}/vehicles/usage/events/added`, (event: any) => {
      this.usageEvents.push(event);
    });
    this.listeners.set('usageEvents', usageEventListener);

    this.http.post(`${this.url}/policies/${this.policy.id}/setup`, {vin: this.policy.vin}, this.httpOptions).subscribe((data: any) => {
      console.log('Successfully sent VIN');
    });

    // const openWebSocket = () => {
    //   let websocketURL = 'ws://' + location.hostname + ':' + location.port;

    //   if (location.protocol === 'https:') {
    //     websocketURL = 'wss://' + location.host;
    //   }

    //   console.log('connecting websocket', websocketURL);
    //   const websocket = new WebSocket(websocketURL);

    //   websocket.onopen = function () {
    //     console.log('insurance websocket open!');
    //   };

    //   websocket.onmessage = event => {
    //     let data = JSON.parse(event.data);

    //     if (data.connected) {
    //       document.getElementById('connection-test').innerHTML = "Device Connected &#10004;"
    //       document.getElementById('connection-test').classList.add('connected');

    //       websocket.send(JSON.stringify({vin: this.policy['vehicle'].vin}));
    //     } else if (data.acceleration && data.outside_temperature && data.object_temperature && data.light_level) {
    //       this.liveData = {
    //         acc: parseFloat(data.acceleration).toFixed(2),
    //         airTemp: parseFloat(data.outside_temperature).toFixed(2),
    //         engineTemp: parseFloat(data.object_temperature).toFixed(2),
    //         light: parseFloat(data.light_level).toFixed(2)
    //       };
    //     } else if (data.$class === 'org.acme.vehicle_network.AddUsageEventEvent') {
    //       this.policy['vehicle'].usageRecord.map((el) => {
    //         el.new = false;
    //         return el;
    //       });
    //       data.usageEvent.new = true;
    //       this.policy['vehicle'].usageRecord.unshift(data.usageEvent);
    //     }
    //   };

    //   websocket.onclose = () => {
    //     console.log('websocket closed');
    //     openWebSocket();
    //   };
    // };
    // openWebSocket();

  }

  ngOnDestroy() {
    this.listeners.forEach((listener: any) => {
      listener.close();
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
      onMessage(event);
    };

    return usageEventSource;
  }

  async getPolicyDetails() {
    const pathname = window.location.pathname.split('/');
    const policyId = pathname[pathname.length - 1];

    this.policy = (await this.http.get(
      `${this.url}/policies/${policyId}`, this.httpOptions
    ).toPromise()) as any as Policy;

    this.user = {
      forename: this.policy.holderId.split('@')[0],
      surname: 'Harris',
      memberSince: 1415923200000,
      address: ['40 Garick Pass', 'Newbury', 'United Kingdom']
    };

    this.vehicle = (await this.http.get(`${this.url}/vehicles/${this.policy.vin}`, this.httpOptions).toPromise()) as any;

    this.usageEvents = (await this.http.get(`${this.url}/policies/${this.policy.id}/usage`, this.httpOptions).toPromise()) as any;

    this.ready = true;
  }

  handleMap() {
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
    this.drawMap(location);
  }

  drawMap(location) {
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
