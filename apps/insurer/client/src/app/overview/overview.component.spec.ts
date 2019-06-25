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

import { OverviewComponent } from './overview.component';
import { Input, Output, Component } from '@angular/core';
import { VehicleService } from '../vehicle.service';
import { PolicyService } from '../policy.service';
import 'rxjs/add/observable/of';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-popup',
  template: ''
})
class MockPopupComponent {
  @Input() request;
  @Output() actioned;
}

describe ('OverviewComponent', () => {
  let component: OverviewComponent;
  let fixture: ComponentFixture<OverviewComponent>;
  let mockVehicleService;
  let mockPolicyService;

  beforeEach(async(() => {
    mockVehicleService = jasmine.createSpyObj(['get', 'getUsage'])
    mockVehicleService.getUsage.and.returnValue(Observable.of([]));

    mockPolicyService = jasmine.createSpyObj(['getAll'])
    mockPolicyService.getAll.and.returnValue(Observable.of([]));
    TestBed.configureTestingModule({
      declarations: [ OverviewComponent, MockPopupComponent ],
      providers: [
        { provide: VehicleService, useValue: mockVehicleService },
        { provide: PolicyService, useValue: mockPolicyService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewComponent);
    component = fixture.componentInstance;
    component.setupListener = () => {};
    fixture.detectChanges();
  });

  it ('should create', () => {
    expect(component).toBeTruthy();
  });
});
