import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EdgeEditComponent } from './edge-edit.component';

describe('EdgeEditComponent', () => {
  let component: EdgeEditComponent;
  let fixture: ComponentFixture<EdgeEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EdgeEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EdgeEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
