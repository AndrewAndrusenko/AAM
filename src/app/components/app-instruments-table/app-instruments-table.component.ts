import { Component, OnInit, OnDestroy  } from '@angular/core';
import { response } from 'express';
import { InstrumentData } from 'src/app/models/accounts-table-model';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';
import {Subject} from 'rxjs';

@Component({
  selector: 'app-app-instruments-table',
  templateUrl: './app-instruments-table.component.html',
  styleUrls: ['./app-instruments-table.component.css']
})
export class AppInstrumentsTableComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject<any>();
  instrumentData:InstrumentData []; 
  constructor (private appTabService:AppTabServiceService) {}
  ngOnInit(): void {
  this.getInstruments();    
  }
  getInstruments() {
    this.appTabService.getInstrumentData().subscribe ( (response) =>  {
      this.instrumentData = response; 
      this.dtTrigger.next(response);
    })
  }
  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
}{

}
