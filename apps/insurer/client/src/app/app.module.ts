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
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { PolicyComponent } from './policy/policy.component';

import { WindowRef } from './window-ref/window-ref.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AlertSidebarComponent } from './alert-sidebar/alert-sidebar.component';
import { OverviewComponent } from './overview/overview.component';
import { PopupComponent } from './popup/popup.component';
import { VehicleService } from './vehicle.service';
import { Config } from './config';
import { PolicyService } from './policy.service';

const routes: Routes = [
  { path: 'overview',  component: OverviewComponent },
  { path: 'policy/:id', component: PolicyComponent },
  { path: 'app', component: AppComponent },
  { path: '', redirectTo: '/overview', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    PolicyComponent,
    SidebarComponent,
    AlertSidebarComponent,
    OverviewComponent,
    PopupComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    WindowRef,
    VehicleService,
    PolicyService,
    Config
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
