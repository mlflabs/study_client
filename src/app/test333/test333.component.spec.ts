import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Test333Component } from './test333.component';

describe('Test333Component', () => {
  let component: Test333Component;
  let fixture: ComponentFixture<Test333Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Test333Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Test333Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
