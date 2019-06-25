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

import { PopupComponent } from './popup.component';
import 'rxjs/add/observable/of';
import { Observable } from 'rxjs';
import { VehicleService } from '../vehicle.service';

describe ('PopupComponent', () => {
  let component: PopupComponent;
  let fixture: ComponentFixture<PopupComponent>;
  let mockVehicleService;

  beforeEach(async(() => {
    mockVehicleService = jasmine.createSpyObj(['get'])
    mockVehicleService.get.and.returnValue(Observable.of({vehicleDetails: {}}));
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      declarations: [ PopupComponent ],
      providers: [
        { provide: VehicleService, useValue: mockVehicleService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupComponent);
    component = fixture.componentInstance;
    component.request = {holderId: 'liam@Arium'} as any;
    fixture.detectChanges();
  });

  it ('should create', () => {
    expect(component).toBeTruthy();
  });
});
