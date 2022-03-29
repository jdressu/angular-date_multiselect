import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateMultiselectComponent } from './date-multiselect.component';

describe('DateMultiselectComponent', () => {
  let component: DateMultiselectComponent;
  let fixture: ComponentFixture<DateMultiselectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DateMultiselectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DateMultiselectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
