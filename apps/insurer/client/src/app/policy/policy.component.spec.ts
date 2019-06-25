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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PolicyComponent } from './policy.component';
import { AlertSidebarComponent } from './../alert-sidebar/alert-sidebar.component';
import { WindowRef } from '../window-ref/window-ref.service';
import { Observable } from 'rxjs';
import { PolicyService } from '../policy.service';
import { VehicleService } from '../vehicle.service';

describe ('PolicyComponent', () => {
  let component: PolicyComponent;
  let fixture: ComponentFixture<PolicyComponent>;
  let mockPolicyService;
  let mockVehicleService;

  beforeEach(async(() => {
    mockPolicyService = jasmine.createSpyObj(['get', 'getUsageEvents', 'setup']);
    mockPolicyService.get.and.returnValue(Observable.of({holderId: 'liam@Arium'}));
    mockPolicyService.getUsageEvents.and.returnValue(Observable.of([]));
    mockPolicyService.setup.and.returnValue(Observable.of(null));
    mockVehicleService = jasmine.createSpyObj(['get']);
    mockVehicleService.get.and.returnValue(Observable.of({}));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        WindowRef,
        { provide: PolicyService, useValue: mockPolicyService },
        { provide: VehicleService, useValue: mockVehicleService },
      ],
      declarations: [ PolicyComponent, AlertSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PolicyComponent);
    component = fixture.componentInstance;
    component['L'] = {map: () => {
      return {addTo: () => {}};
    }, titleLayer: () => {
      return {addTo: () => {}};
    }, marker: () => {
      return {addTo: () => {}};
    }};
    component.setupListener = () => {};
    fixture.detectChanges();
  });

  it ('should create', () => {
    expect(component).toBeTruthy();
  });
});
