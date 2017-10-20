import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { StatusPage } from '../status/status';

/**
 * Generated class for the BuilderPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-builder',
  templateUrl: 'builder.html'
})
export class BuilderPage implements OnInit {
  car: any;
  states: any;
  selected: string;
  ready: boolean;
  websocket: WebSocket;

  constructor(private navController: NavController, private navParams: NavParams) {
    this.car = navParams.get('car');
    this.states = {};
    this.ready = false;
  }

  ngOnInit()
  {
    var webSocketURL;
    var node_addr = localStorage.getItem('addr');  
    webSocketURL = 'ws://' + node_addr + '/ws/placeorder';
    console.log('connecting websocket', webSocketURL);
    this.websocket = new WebSocket(webSocketURL);

    var parent = this;

    this.websocket.onopen = function () {
      console.log('websocket open!');
      parent.ready = true;
    };
  }

  open(option) {
    if (this.selected === option) {
      this.selected = null;
    } else {
      this.selected = option;
    }
  }

  select(option, state) {
    if (option === 'extras') {
      if (!this.states.extras) {
        this.states.extras = [state];
      } else if (this.states.extras.indexOf(state) > -1) {
        var index = this.states.extras.indexOf(state);
        this.states.extras.splice(index, 1);
      } else {
        this.states.extras.push(state);
      }
    } else {
      if (this.states[option] === state) {
        delete this.states[option];
      } else {
        this.states[option] = state;
      }
    }
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

  purchase() {
    
    var vehicleDetails = {
      make: 'Arium',
      modelType: this.car.name,
      colour: this.states.colour,
      VIN: ''
    };

    var full_car = {};
    Object.keys(this.car).forEach((key) => full_car[key] = this.car[key]);
    Object.keys(this.states).forEach((key) => full_car[key] = this.states[key]);

    var order = {
      $class: 'org.acme.vehicle.lifecycle.manufacturer.PlaceOrder',
      vehicleDetails: vehicleDetails,
      manufacturer: 'resource:org.acme.vehicle.lifecycle.manufacturer.Manufacturer#Arium',
      orderer: 'resource:org.acme.vehicle.lifecycle.PrivateOwner#dan',
      orderId: this.generateID()
    };

    if(this.ready) {

      this.websocket.send(JSON.stringify(order));

      this.navController.push(StatusPage, {
        car: full_car
      });
    }
  }

  containsExtra(state) {
    if (this.states.extras) {
      return this.states.extras.indexOf(state) > -1;
    } else {
      return false;
    }
  }

  countExtras(num) {
    return this.states.extras && this.states.extras.length === num;
  }

  getExtras() {
    if (!this.states.extras || this.states.extras.length === 0) {
      return '';
    } else if (this.states.extras.length === 1) {
      return this.states.extras[0];
    } else {
      return '2 selected';
    }
  }

}
