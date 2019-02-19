import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupsSelectPage } from './groups-select.page';

describe('GroupsSelectPage', () => {
  let component: GroupsSelectPage;
  let fixture: ComponentFixture<GroupsSelectPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupsSelectPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupsSelectPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
