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
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Http } from '@angular/http';
import { Geolocation } from '@ionic-native/geolocation';
import { ConfigProvider } from '../../providers/config/config';

/**
 * Generated class for the StatusPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-status',
  templateUrl: 'status.html',
})
export class StatusPage {
  car: Object;
  vehicle: any;
  orderId: String;
  ready: Boolean = false;
  stage: Array<String>;
  relativeDate: any;
  config: any;
  insurerWebSocket: WebSocket;

  constructor(public navCtrl: NavController, public navParams: NavParams, private http: Http, private geolocation: Geolocation, private configProvider: ConfigProvider) {
    this.ready = false;
    this.car = navParams.get('car');
    this.stage = [Date.now() + ''];
    this.orderId = navParams.get('orderId');

    this.relativeDate = function(input, start) {
      if (input) {
        input = Date.parse(input);
        var diff = input - start;
        diff = diff / 1000
        diff = Math.round(diff);

        var result = '+' + diff +  ' secs'

        return result;
      }
    };

    let statuses = ['PLACED', 'SCHEDULED_FOR_MANUFACTURE', 'VIN_ASSIGNED', 'OWNER_ASSIGNED', 'DELIVERED'];

    var websocket;

    var openWebSocket = () => {
      var webSocketURL = this.config.restServer.webSocketURL;

      console.log('connecting websocket', webSocketURL);
      websocket = new WebSocket(webSocketURL);

      websocket.onopen = function () {
        console.log('websocket open!');
      };

      websocket.onclose = function() {
        console.log('closed');
        openWebSocket();
      }

      websocket.onmessage = (event) => {
        var status = JSON.parse(event.data);
        if (status.$class === 'org.acme.vehicle_network.UpdateOrderStatusEvent') {
          let i = statuses.indexOf(status.orderStatus);
          this.stage[i] = this.relativeDate(status.timestamp, this.stage[0]);
          
          if (status.orderStatus === 'VIN_ASSIGNED') {
            console.log(status);
            this.vehicle = status.vehicle;
          }

        } else if (status.$class === 'org.acme.vehicle_network.CreatePolicyEvent') {
          document.getElementById('insureBtn').getElementsByTagName('span')[0].innerHTML = "Policy Created &#10004; <br /> ("+status.policyId.split('-')[0]+")";
        }
      };
    }

    var openInsurerWebSocket = () => {
      var webSocketURL = this.config.insurer.webSocketURL;

      console.log('connecting websocket', webSocketURL);
      this.insurerWebSocket = new WebSocket(webSocketURL);

      this.insurerWebSocket.onopen = function () {
        console.log('websocket open!');
      };

      this.insurerWebSocket.onclose = function() {
        console.log('closed');
        openWebSocket();
      }
    }

    this.configProvider.ready.subscribe((ready) => {
      if (ready) {
        this.config = this.configProvider.getConfig();
        openWebSocket();
        openInsurerWebSocket();
        this.ready = true;
      }
    });
  }

  insure() {
    document.getElementById('insureBtn').getElementsByTagName('span')[0].innerHTML = "Processing ..."
    
    this.geolocation.getCurrentPosition().then((location) => {
      success(location)
    }).catch((err) => {
      error(err);
    })

    this.stage[5] = "Insured";

    var parent = this;
    function success(position)
    {
      document.getElementById('insureBtn').getElementsByTagName('span')[0].innerHTML = "Request Sent &#10004;"
      var full_car = {};
      Object.keys(parent.car).forEach((key) => full_car[key] = parent.car[key]);
      full_car['resource'] = parent.vehicle;

      console.log(full_car);
  
      var order = {
        $class: 'insurance_request',
        vehicleDetails: full_car,
        requestee: "resource:org.acme.vehicle_network.Person#Paul",
        policyType: "FULLY_COMPREHENSIVE",
        manufacturingDate: new Date(),
        location:
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
      };
  
      if(parent.ready) {
        parent.insurerWebSocket.send(JSON.stringify(order));
      };
    }

    function error(error) {
      console.log(error)
      parent.stage.splice(5,1)
      document.getElementById('insureBtn').getElementsByTagName('span')[0].innerHTML = "Insure me <img src='assets/arrow_right.svg' />"
      switch(error.code) {
        case error.PERMISSION_DENIED:
          console.log("Location information is unavailable, your browser may be blocking them. Using a default location")
          parent.stage[5] = "Insured";
          success({"coords": {"latitude": null, "longitude": null}})
          break;
        case error.POSITION_UNAVAILABLE:
          console.log("Location information is unavailable, your browser may be blocking them. Using a default location")
          parent.stage[5] = "Insured";
          success({"coords": {"latitude": null, "longitude": null}})
          break;
        case error.TIMEOUT:
          alert("The request to get user location timed out.")
          break;
        case error.UNKNOWN_ERROR:
          alert("An unknown error occurred.")
          break;
        default: 
          console.log("Location information is unknown. Using default")
          parent.stage[5] = "Insured";
          success({"coords": {"latitude": null, "longitude": null}})
          break;
      }
    }
  }
}
