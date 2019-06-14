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
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-alert-sidebar',
  templateUrl: './alert-sidebar.component.html',
  styleUrls: ['./alert-sidebar.component.css']
})
export class AlertSidebarComponent implements OnInit {

  @Input() usageRecord: Array<any> = [];
  @Input() eventTypes: Array<string> = [];

  public ignoreBefore: Date;

  constructor() {
  }

  ngOnInit() {
  }

  clear_stream() {
    this.ignoreBefore = new Date();
  }

  getEvents() {
    if (this.ignoreBefore) {
      return this.usageRecord.filter((event) => {
        return event.timestamp > this.ignoreBefore.getTime();
      });
    }

    return this.usageRecord;
  }

  scrollTo(eventID) {
    document.getElementById(eventID).classList.add('highlight');
    document.getElementById(eventID).scrollIntoView();
    setTimeout(() => {
      document.getElementById(eventID).classList.remove('highlight');
    }, 2000);
  }
}