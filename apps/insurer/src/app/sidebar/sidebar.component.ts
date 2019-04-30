import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  selected: any;

  constructor(private router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd ) {
        if (event.url.indexOf('policy') > -1) {
          this.selected = 'customers';
        } else {
          this.selected = 'overview';
        }
      }
    });
  }

  select(route) {
    this.selected = route;
  }

}
