import { Keyboard } from '@ionic-native/keyboard';
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Http, Response } from '@angular/http';
import { DesignerPage } from '../designer/designer';

/**
 * Generated class for the LoginPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  designerPage: DesignerPage;
  config: any;
  ready: Promise<any>;
  addr: string;

  constructor(public navController: NavController, public navParams: NavParams, private http: Http, private keyboard: Keyboard) {
    
    if(!localStorage.getItem('addr')){

      this.ready = this.loadConfig()
      .then((config) => {
        this.config = config;
        var addr;
        if (this.config.useLocalWS){
          addr = location.host;
        } else {
          addr = this.config.nodeRedBaseURL;
        }
        localStorage.setItem('addr', addr);
        this.addr = addr;
      })
    }
  }

  loadConfig(): Promise<any> {
    // Load the config data.
    return this.http.get('/assets/config.json')
    .map((res: Response) => res.json())
    .toPromise();
  }

  login() {
    this.navController.push(DesignerPage, {addr: this.addr});
  }

  settings() {
    (<HTMLInputElement>document.getElementById('ip-addr')).value = localStorage.getItem('addr');
    document.getElementById("ip-addr").blur();
    document.getElementById("login").style.display = "none";
    document.getElementById("settings").style.display = "block";
  }

  update_settings() {
    localStorage.setItem('addr', (<HTMLInputElement>document.getElementById('ip-addr')).value);
    document.getElementById("login").style.display = "flex";
    document.getElementById("settings").style.display = "none";
    this.keyboard.close();
  }

}
