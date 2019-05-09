import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertSidebarComponent } from './alert-sidebar.component';

describe('AlertSidebarComponent', () => {
  let component: AlertSidebarComponent;
  let fixture: ComponentFixture<AlertSidebarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AlertSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlertSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
