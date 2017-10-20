import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent implements OnInit {

  websocket: WebSocket;
  websocket_request_policy: WebSocket;
  policy_create_attempt_counter = 0;

  constructor() {

    let websocketURL = 'ws://localhost:1880/ws/createpolicy';
    
    console.log('connecting websocket', websocketURL);
    this.websocket = new WebSocket(websocketURL);

    this.websocket.onopen = function () {
      console.log('insurance websocket open!');
    };

    this.websocket.onmessage = event => {
      
    }

    let websocketRequestInsuranceURL = 'ws://localhost:1880/ws/requestpolicy';
    
    console.log('connecting websocket', websocketRequestInsuranceURL);
    this.websocket_request_policy = new WebSocket(websocketRequestInsuranceURL);

    this.websocket_request_policy.onopen = function () {
      console.log('request policy websocket open!');
    };

    this.websocket_request_policy.onmessage = event => {

    }

  }

  ngOnInit() {
    
  }

  cancel() {
    document.getElementById("notification-window").classList.add("hidden")
  }

  approve() {
    var pID = this.generateID();
    var policy = {
      $class: "org.insurance.CreatePolicy",
      policyId: pID,
      vehicleDetails: "resource:org.vda.Vehicle#"+(<HTMLInputElement>document.getElementById("vin")).value,
      holder: "resource:org.acme.vehicle.lifecycle.PrivateOwner#dan",
      insurer: "resource:org.insurance.Insurer#prince",
      policyType: "Fully Comprehensive"
    };
    
    this.websocket.send(JSON.stringify(policy));
    document.getElementById("approve").classList.add('hidden');
    document.getElementById("approve-waiting").classList.remove('hidden');

    setTimeout(this.check_policy_made(pID), 1000);

  }

  check_policy_made(policy_id)
  {
    console.log("CALLED")
    var parent = this;
    var XMLReq = new XMLHttpRequest();
    XMLReq.open("GET", "http://localhost:3000/api/Policy/"+policy_id+"?access_token=bsIvE18JpnGBmUnqaWHeogNcqHisKgdk6aFDx56iHANaWhf90OzbCmjAtrEZ3gJf");
    XMLReq.onreadystatechange = function() {
      if (XMLReq.status == 404 && XMLReq.readyState == XMLHttpRequest.DONE)
      {
        console.log('FAILED')
        // policy not create we will try again unless no longer allowed, give it 30 secs
        parent.policy_create_attempt_counter++;
        if(parent.policy_create_attempt_counter > 30)
        {
          //failed too many times probs won't work again, let user click appriove again
          document.getElementById("approve").classList.remove('hidden');
          document.getElementById("approve-waiting").classList.add('hidden');
          parent.policy_create_attempt_counter = 0;
        }
        else
        {
          setTimeout(parent.check_policy_made(policy_id), 1000);
        }
      }
      else if(XMLReq.status == 200 && XMLReq.readyState == XMLHttpRequest.DONE)
      {
        var data = {
          request_granted: true,
          vin: (<HTMLInputElement>document.getElementById("vin")).value,
          policy_id: policy_id
        };
        
        parent.websocket_request_policy.send(JSON.stringify(data));
        setTimeout(function() {
          window.location.href = "/policy/"+policy_id;
          // DELAY REDIRECT JUST TO ENSURE IT IS SENT
        }, 500)
        
      }
    };
    XMLReq.send(null);
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

}
