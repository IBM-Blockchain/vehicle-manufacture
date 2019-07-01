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
import { NavigationEnd, Router } from '@angular/router';
import { PolicyService } from '../policy.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  selected: any;
  latestPolicy: any;

  constructor(private router: Router, private policyService: PolicyService) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd ) {
        if (event.url.indexOf('policy') > -1) {
          this.selected = 'customers';
        } else {
          this.selected = 'overview';
        }
      }
    });

    this.policyService.getLatestPolicy()
      .subscribe((policy) => {
        this.latestPolicy = policy;
      });
  }

  select(route) {
    this.selected = route;
  }

}
