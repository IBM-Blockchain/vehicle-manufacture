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
