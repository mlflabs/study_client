import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayImagePage } from './display-image.page';

describe('DisplayImagePage', () => {
  let component: DisplayImagePage;
  let fixture: ComponentFixture<DisplayImagePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayImagePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayImagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
