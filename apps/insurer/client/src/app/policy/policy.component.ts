import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

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
  public user: User;
  public vehicle: VehicleDetails;
  private usageEvents: UsageEvent[];

  public ready = false;

  private url = 'http://localhost:4200/api';
  private httpOptions: any;

  public liveData = {
    acceleration: '-.--',
    outsideTemperature: '-.--',
    objectTemperature: '-.--',
    lightLevel: '-.--'
  };

  public deviceConnected = false;
  private deviceTimeout = null;

  private listeners: Map<string, any> = new Map();

  public readonly eventTypes = [ 'ACTIVATED', 'CRASHED', 'OVERHEATED', 'OIL FREEZING', 'ENGINE_FAILURE'];

  constructor(private winRef: WindowRef, private http: HttpClient, private ref: ChangeDetectorRef) {
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
      event.new = true;
      this.usageEvents.unshift(event);
    });
    this.listeners.set('usageEvents', usageEventListener);

    this.http.post(`${this.url}/policies/${this.policy.id}/setup`, {vin: this.policy.vin}, this.httpOptions).subscribe((data: any) => {
      console.log('Successfully sent VIN');
    });

    this.setupListener(`${this.url}/vehicles/${this.policy.vin}/telemetry`, (data) => {
      if (!data.hasOwnProperty('connected')) {
        this.deviceConnected = true;
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            data[key] = parseFloat(String(data[key])).toFixed(2);
          }
        }
        this.liveData = data;
        this.ref.detectChanges();
      } else {
        this.deviceConnected = data.connected;
      }
      this.connectionTimeout();
    });

  }

  ngOnDestroy() {
    this.listeners.forEach((listener: any) => {
      listener.close();
    });
  }

  connectionTimeout() {
    this.cancelTimeout();
    this.deviceTimeout = setTimeout(() => {
      console.log('timeout');
      this.deviceConnected = false;
      this.ref.detectChanges();
    }, 2000);
  }

  cancelTimeout() {
    clearTimeout(this.deviceTimeout);
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

    this.usageEvents = ((await this.http.get(`${this.url}/policies/${this.policy.id}/usage`, this.httpOptions).toPromise()) as any).sort((a, b) => {
      return b.timestamp - a.timestamp;
    });

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
