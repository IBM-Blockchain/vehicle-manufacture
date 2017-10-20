import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-alert-sidebar',
  templateUrl: './alert-sidebar.component.html',
  styleUrls: ['./alert-sidebar.component.css']
})
export class AlertSidebarComponent implements OnInit {

  alert: any;
  last_event_id: string;
  
  constructor() {

    this.last_event_id = "BLANK";

    let webSocketURL = 'ws://localhost:1880/ws/addusageevent';

    console.log('connecting websocket', webSocketURL);
    let websocket = new WebSocket(webSocketURL);

    websocket.onopen = function () {
      console.log('insurecar websocket open!');
    };

    websocket.onmessage = event => {

      if(document.getElementById('connection-test').classList.contains('connected'))
      {
        this.alert = JSON.parse(event.data);
        
        if(this.last_event_id == this.alert.usageEvent.eventID) // EVENT SOMETIMES FIRES MORE THAN ONCE, THIS PREVENTS SAME MESSAGE APPEARING OVER AND OVER
        {
          return;
        }

        this.last_event_id = this.alert.usageEvent.eventID;

        document.getElementById('alert-block-holder').innerHTML = `<div class="alert-block added-element" _ngcontent-c3="" >
                                                                    <div class="alert-header" _ngcontent-c3="">
                                                                        <img _ngcontent-c3="" src="assets/images/loudspeaker.png" width="22px" height="14px" alt="loudspeaker icon" />Alert!
                                                                    </div>
                                                                    <div class="alert-time" _ngcontent-c3="">
                                                                        <div class="small-title" _ngcontent-c3="" >
                                                                        `+this.alert.usageEvent.eventType.split('_').join(' ')+`
                                                                        </div>
                                                                        `+new Date(this.alert.usageEvent.timestamp).toLocaleString()+`
                                                                    </div>
                                                                    <div class="event-details" _ngcontent-c3="" >
                                                                        <div class="tiny-header" _ngcontent-c3="" >Event ID</div>
                                                                        `+this.alert.usageEvent.eventID/*JUST RANDOM FOR MINUTE USE ID FROM MESSAGE*/+`
                                                                    </div>
                                                                    <button class="button" _ngcontent-c3="" onclick="document.getElementById('`+this.alert.usageEvent.eventID+`').classList.add('highlight'); document.getElementById('`+this.alert.usageEvent.eventID+`').scrollIntoView(); setTimeout(function() { document.getElementById('`+this.alert.usageEvent.eventID+`').classList.remove('highlight') }, 2000)" >
                                                                      See more
                                                                    </button>
                                                                  </div>` + document.getElementById('alert-block-holder').innerHTML;
      }
    }
  }

  ngOnInit() {
  }

  clear_stream()
  {
    document.getElementById('alert-block-holder').innerHTML = "";
  }


}