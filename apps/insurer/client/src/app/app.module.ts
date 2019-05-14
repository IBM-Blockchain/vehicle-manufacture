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
  providers: [WindowRef],
  bootstrap: [AppComponent]
})
export class AppModule { }
