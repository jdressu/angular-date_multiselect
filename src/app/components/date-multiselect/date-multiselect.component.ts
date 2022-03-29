import { Component, ElementRef, Inject, Input, OnDestroy, Optional, Self, ViewChild, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { Subject } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatCalendar, MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { MatFormField, MatFormFieldControl, MAT_FORM_FIELD } from '@angular/material/form-field';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { FocusMonitor } from '@angular/cdk/a11y';
import { MatChipInputEvent } from '@angular/material/chips';

import { Item } from 'src/app/classes/item';
import { Internal } from 'src/app/classes/internal';

type DatepickerMultiselectToggleSelectionFunction = (date: Date | null) => void;

@Component({
  selector: 'app-date-multiselect',
  templateUrl: './date-multiselect.component.html',
  styleUrls: ['./date-multiselect.component.scss'],
  providers: [
    DatePipe,
    {
      provide: MatFormFieldControl,
      useExisting: DateMultiselectComponent,
    },
  ],
  host: {
    '[class.example-floating]': 'shouldLabelFloat',
    '[id]': 'id',
  },
  encapsulation: ViewEncapsulation.None,
})
export class DateMultiselectComponent implements ControlValueAccessor, MatFormFieldControl<Array<Date>>, OnDestroy {

  static nextId = 0;

  @ViewChild('camInput') camInput!: ElementRef<HTMLInputElement>;
  @ViewChild('calendar') calendar!: MatCalendar<Date>;

  @Input('aria-describedby') userAriaDescribedBy!: string;

  isOpen = false;
  offsetY = 8;

  event: any;

  selectable = true;
  removable = true;

  separatorKeysCodes: number[] = [ENTER, COMMA];

  inputDataControl = new FormControl();

  selectedData: Item[] = [];

  stateChanges = new Subject<void>();

  controlType = 'date';

  focused = false;

  touched = false;

  id = `${this.controlType}-${DateMultiselectComponent.nextId++}`;

  get empty() {
    return !(this.selectedData?.length > 0);
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  private internal = new Internal();

  @Input()
  get placeholder(): string {
    return this.internal.placeholder;
  }

  set placeholder(value: string) {
    this.internal.placeholder = value;
    this.stateChanges.next();
  }

  @Input()
  get required(): boolean {
    return this.internal.required;
  }

  set required(value: boolean) {
    this.internal.required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  @Input()
  get disabled(): boolean {
    return this.internal.disabled;
  }

  set disabled(value: boolean) {
    this.internal.disabled = coerceBooleanProperty(value);
    if (this.internal.disabled) {
      this.inputDataControl.disable();
    } else {
      this.inputDataControl.enable();
    }
    this.stateChanges.next();
  }

  @Input()
  get value(): Array<Date> | null {
    if (this.selectedData?.length > 0) {
      return this.selectedData.map((s) => s.value);
    }
    return null;
  }

  set value(_selectedData: Array<Date> | null) {
    const selectedValues = _selectedData || [];
    this.selectValues(selectedValues);
    this.stateChanges.next();
  }

  get errorState(): boolean {
    return (this.ngControl.invalid && this.touched) ?? false;
  }

  get hasSelectedData(): boolean {
    return this.selectedData?.length > 0;
  }

  constructor(
    private datePipe: DatePipe,
    private focusMonitor: FocusMonitor,
    private elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl
  ) {
    this.internal.required = false;
    this.internal.disabled = false;

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this.focusMonitor.stopMonitoring(this.elementRef);
  }

  isSelected: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view === 'month') {
      return this.selectedData.find((x) => this.isSameDate(x.value, cellDate))
        ? 'mat-calendar-date-is-selected'
        : '';
    }
    return '';
  };

  cellDateToItem(date: Date): Item {
    const ts = new Item();
    ts.value = date;
    ts.viewValue = this.datePipe.transform(date.toString(), 'dd \'de\' MMM\'. de\' yyyy') ?? 'ERROR';
    return ts;
  }

  isSameDate(x: Date, y: Date): boolean {
    return (
      x.getDate() === y.getDate() &&
      x.getMonth() === y.getMonth() &&
      x.getFullYear() === y.getFullYear()
    );
  }

  pick: DatepickerMultiselectToggleSelectionFunction = (cellDate) => {
    if (cellDate) { this.toggleSelection(this.cellDateToItem(cellDate)); }
  };

  toggleSelection(data: Item) {
    if (this.disabled) {
      return;
    }

    const index = this.selectedData.findIndex((x) => {
      const sameDate = this.isSameDate(x.value, data.value);
      console.log(x.value, data.value, sameDate);
      return sameDate;
    });
    if (index < 0) {
      this.selectedData.push(data);
    } else {
      this.selectedData.splice(index, 1);
    }

    this.onChange(this.value);

    if (this.calendar) {
      this.calendar.updateTodaysDate();
    }
  }

  apply() {
    this.isOpen = false;
  }

  add(event: MatChipInputEvent): void {
    const value = event.value;
    console.log('add', value);

    this.clearFilter();
  }

  remove(data: Item): void {
    this.toggleSelection(data);
    this.clearFilter();
  }

  selectValues(selectValues: Array<Date>) {
    // console.log(selectValues);
    for (let i = 0; i < selectValues.length; i++) {
      const valueToAdd = selectValues[i];
      // console.log(valueToAdd);
      this.pick(valueToAdd);
    }
  }

  clearSelection(event: Event) {
    event.stopPropagation();
    while (this.selectedData?.length > 0) {
      this.toggleSelection(this.selectedData[0]);
    }
    this.clearFilter();
  }

  clearFilter() {
    this.camInput.nativeElement.value = '';
    this.inputDataControl.setValue(null);
    this.onContainerClick();
  }

  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(_value: Array<Date> | null): void {
    this.value = _value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onFocusIn(event: FocusEvent) {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(event: FocusEvent) {
    if (
      !this.elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  setDescribedByIds(ids: string[]) {
    const controlElement = this.elementRef.nativeElement.querySelector(
      '.date-multiselect-container'
    );
    if (controlElement) {
      controlElement.setAttribute('aria-describedby', ids.join(' '));
    }
  }

  onContainerClick(event?: MouseEvent) {
    this.isOpen = true;
    console.log('onContainerClick');
    setTimeout(() => {
      this.focusMonitor.focusVia(this.camInput, 'program');
    });
  }

}
