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
import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { Http } from '@angular/http';
import { NavController, NavParams } from 'ionic-angular';
import { ConfigProvider, IConfig } from '../../providers/config/config';
import { StatusPage } from '../status/status';

interface IOption {
  description?: string,
  name: string,
  price?: number
}

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
export class BuilderPage {
  car: any;
  states: any;
  selected: string;

  private options: {[s: string]: IOption[]} = {
    trim: [{
      description: 'A simple but elegant finishing trim for your Arium.',
      name: 'standard',
      price: 0
    }, {
      description: 'Sleek and aerodynamic tweaks to stand above the crowd.',
      name: 'executive',
      price: 450
    }],
    colour: [{
      name: 'sunburst orange'
    }, {
      name: 'inferno red'
    }, {
      name: 'royal purple'
    }, {
      name: 'alpine green'
    }, {
      name: 'statement blue'
    }, {
      name: 'vibrant grape'
    }],
    interior: [{
      name: 'red rum'
    }, {
      name: 'papyrus'
    }, {
      name: 'rotor grey'
    }, {
      name: 'noble brown'
    }],
    extras: [{
      description: 'Total piece of mind for the perfect Arium motoring experience.',
      name: 'extended warranty',
      price: 150
    }, {
      description: 'Stylish privacy and protection from the sun\'s rays.',
      name: 'tinted windows',
      price: 450
    }]
  };
  
  private config: IConfig;
  private ready = false;

  @ViewChild('trim', {read: ElementRef}) trim: ElementRef;


  constructor(private navController: NavController, private navParams: NavParams, private http: Http, private configProvider: ConfigProvider) {
    this.car = navParams.get('car');
    this.states = {};

    this.configProvider.ready.subscribe((ready) => {
      if (ready) {
        this.ready = true;
        this.config = this.configProvider.getConfig();
      }
    });
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
      makeId: 'Arium',
      modelType: this.car.name,
      colour: this.states.colour
    };

     var options = Object.assign({
       trim: 'standard',
       interior: 'red rum',
       extras: []
     }, this.states);
     delete options.colour;

    var order = {
      vehicleDetails: vehicleDetails,
      options: options,
      ordererId: this.config.user + '@VDA', // PAUL HAS LOGGED INTO THE APP USING HIS VDA "GOVERNMENT" ID, PRETEND THE APP HAS GOT THIS FROM THE LOGIN AND NOT HARDCODED
    };

    var full_car = {};
    Object.keys(this.car).forEach((key) => full_car[key] = this.car[key]);
    Object.keys(this.states).forEach((key) => full_car[key] = this.states[key]);

    let parent = this;

    var data = JSON.stringify(order);

    // TODO: Migrate to use core/http
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4 && this.status === 200) {
        parent.navController.push(StatusPage, {
          car: full_car,
          order: JSON.parse(this.response)
        });

      } else if (this.readyState === 4) {
        document.getElementById('purchase').getElementsByTagName('span')[0].innerHTML = 'An error occurred';
        console.log('RESPONSE TEXT', this.responseText);
      }
    });
    xhr.open("POST", `${this.config['restServer']}/orders`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", 'Basic ' + btoa(this.config.user + ':' + this.config.user + 'pw'));
    xhr.send(data);
    document.getElementById('purchase').getElementsByTagName('span')[0].innerHTML = 'Sending request...';
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

  @HostListener('click', ['$event.target'])
  randomBuild(event) {
    if (event.id === 'app-title') {
      Object.keys(this.options).forEach((key) => {
        const option = this.options[key];
        if (key !== 'extras') {
          this.states[key] = option[Math.floor(Math.random() * option.length)].name;
        }
      });
    }
  }
}
