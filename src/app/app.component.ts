import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'angular-date_multiselect';
  
  daysSelected = new FormControl(null, Validators.required);

  constructor() {    
    this.daysSelected.setValue([new Date()]);
  }

}
