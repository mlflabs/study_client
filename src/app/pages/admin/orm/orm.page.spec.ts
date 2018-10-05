import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrmPage } from './orm.page';

describe('OrmPage', () => {
  let component: OrmPage;
  let fixture: ComponentFixture<OrmPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrmPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrmPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
