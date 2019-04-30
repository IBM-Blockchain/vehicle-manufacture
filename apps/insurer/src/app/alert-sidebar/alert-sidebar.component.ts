import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-alert-sidebar',
  templateUrl: './alert-sidebar.component.html',
  styleUrls: ['./alert-sidebar.component.css']
})
export class AlertSidebarComponent implements OnInit {

  @Input() usageRecord: Array<object> = [];

  constructor() {
  }

  ngOnInit() {
  }

  clear_stream() {
    document.getElementById('alert-block-holder').innerHTML = "";
  }

  scrollTo(eventID) {
    document.getElementById(eventID).classList.add('highlight');
    document.getElementById(eventID).scrollIntoView();
    setTimeout(() => {
      document.getElementById(eventID).classList.remove('highlight');
    }, 2000);
  }
}