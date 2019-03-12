import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectImageModalPage } from './select-image-modal.page';

describe('SelectImageModalPage', () => {
  let component: SelectImageModalPage;
  let fixture: ComponentFixture<SelectImageModalPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectImageModalPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectImageModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
