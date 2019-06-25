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
import { async, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './../app/sidebar/sidebar.component';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { PolicyService } from './policy.service';
import 'rxjs/add/observable/of';
import { Observable } from 'rxjs';

describe ('AppComponent', () => {
  let mockPolicyService;

  beforeEach(async(() => {
    mockPolicyService = jasmine.createSpyObj(['getLatestPolicy']);
    mockPolicyService.getLatestPolicy.and.returnValue(Observable.of({}));
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [
        AppComponent,
        SidebarComponent
      ],
      providers: [
        { provide: PolicyService, useValue: mockPolicyService }
      ]
    }).compileComponents();
  }));
  it ('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it (`should have as title 'app'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('app');
  }));
});
