import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {

  vehicle_details: any;
  num_policies = 0;
  num_alerts = 0;
  date:number;

  constructor(private http: HttpClient) {

    this.date = Date.now()

    this.num_policies = 0;
    this.num_alerts = 0; 

    let websocketURL = 'ws://localhost:1880/ws/requestpolicy';
    
    console.log('connecting websocket', websocketURL);
    let websocket = new WebSocket(websocketURL);

    websocket.onopen = function () {
      console.log('insurance websocket open!');
    };

    websocket.onmessage = event => {
      if(JSON.parse(event.data).request_granted)
      {
          // IGNORE AS ITS MESSAGE SENT WHEN POLICY IS MADE SO DON'T NEED POPUP
      }
      else
      {
        this.vehicle_details = JSON.parse(event.data).vehicleDetails;
        var location_data = JSON.parse(event.data).location;
        var vehicle_date = JSON.parse(event.data).manufacturing_date;
  
        (<HTMLInputElement>document.getElementById("vin")).value = this.vehicle_details.vin;
  
        localStorage.setItem("lat", location_data.latitude);
        localStorage.setItem("long", location_data.longitude); 
  
        var date = new Date(vehicle_date);
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  
        document.getElementById("reg-on").innerHTML = date.getDate()+" "+months[date.getMonth()]+" "+date.getFullYear();
        document.getElementById("vehicle-type").innerHTML = this.vehicle_details.name;
        document.getElementById("colour").innerHTML = this.vehicle_details.colour;
        var extras = "";
        for(var i = 0; i < this.vehicle_details.extras.length; i++)
        {
          extras += this.vehicle_details.extras[i] + "<br />";
        }
        document.getElementById('trim').innerHTML = this.vehicle_details.trim;
        document.getElementById("extras").innerHTML = extras;
        (<HTMLImageElement>document.getElementById("car-pic")).src = "assets/images/"+this.vehicle_details.image;
        document.getElementById("notification-window").classList.remove('hidden');
      }
    }

  }

  ngOnInit() {

    this.get_number_cust_and_cars()

  }

  get_number_cust_and_cars()
  {
    var parent = this;
    var XMLReq = new XMLHttpRequest();
    XMLReq.open("GET", "http://localhost:3000/api/queries/Q1?insurer=resource%3Aorg.insurance.Insurer%23prince");
    XMLReq.onreadystatechange = function() {
      if (XMLReq.readyState == XMLHttpRequest.DONE)
      {
        var num_pols = JSON.parse(XMLReq.responseText);
        parent.num_policies = num_pols.length;
        parent.get_alerts(num_pols);
      }
    };
    XMLReq.send(null);
  }

  get_alerts(car_data:any) // VERY SLOW, CHANGE WHEN THERE ARE JOINS AVAILIBLE IN QUERIES FOR A QUERY OF UPDATE RECORDS THAT LINK TO CARS INSURED BY PRINCE
  {
    var parent = this;
    var promises = [];
    for(var i = 0; i < car_data.length; i++)
    {
      promises.push(new Promise(function(resolve, reject){
        var vin_data = car_data[i].vehicleDetails.split('#')
        var vin = vin_data[vin_data.length-1]
  
        var XMLReq = new XMLHttpRequest();
        XMLReq.open("GET", "http://localhost:3000/api/queries/Q2?vehicleDetails=resource%3Aorg.vda.Vehicle%23"+vin);
        XMLReq.onreadystatechange = function() {
          if (XMLReq.readyState == XMLHttpRequest.DONE)
          {
            var usageRecords = JSON.parse(XMLReq.responseText);
            var alerts = []
            for(var j = 0; j < usageRecords.length; j++)
            {
              parent.num_alerts += usageRecords[j].usageEvents.length;
              var usageEvents = usageRecords[j].usageEvents; 
              alerts = alerts.concat(usageEvents) // MAKE AN ARRAY OF THE USAGE EVENTS FOR THIS VEHICLE, THEY MAY BE IN MULTIPLE USAGE RECORDS (HOPEFULLY NOT)
            }
            resolve(alerts)
          }
        }
        XMLReq.onerror = function() {
          reject(true)
        }
        XMLReq.send(null);
      }))
    }

    Promise.all(promises).then(values => { // WHEN ALL THE HTTP REQUESTS ARE DONE FOR GETTING USAGE EVENTS 
      var alerts = [].concat.apply([], values); // VALUES IS AN ARRAY OF ARRAYS WITH EACH SUB ARRAY AN ARRAY OF THE USAGE EVENT OBJECTS, NEED TO MERGE INTO SINGLE ARRAY FOR SORTING BELOW
      alerts.sort(function(a,b)
      {
        if(a.timestamp < b.timestamp)
        {
          return 1;
        }
        else if(a.timestamp > b.timestamp)
        {
          return -1;
        }
        return 0;
      });
      var loop_num = 5;
      if(alerts.length < 5)
      {
        loop_num = alerts.length;
      }
      for(var i = 0; i < loop_num; i++)
      {
        var event = alerts[i];
        document.getElementById('alerts-table').innerHTML +=  `<tr>
                                                                <td style="padding: 12px 0 12px 0;">`+event.eventID+`</td>
                                                                <td style="padding: 12px 0 12px 0;">`+new Date(event.timestamp).toLocaleString()+`</td>
                                                                <td style="padding: 12px 0 12px 0;">`+event.eventType+`</td>
                                                               </tr>` // hardcode style as ng content kept flicking between c2 and 4
      }
    })

  }

}
