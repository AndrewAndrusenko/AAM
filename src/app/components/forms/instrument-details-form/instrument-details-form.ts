import {  Component,  EventEmitter,  Input, OnInit, Output, SimpleChanges, ViewChild,  } from '@angular/core';
import {  FormBuilder, FormGroup } from '@angular/forms';
import {  instrumentDetails } from 'src/app/models/intefaces';
import { Subscription } from 'rxjs';
import { MatTabGroup as MatTabGroup } from '@angular/material/tabs';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { indexDBService } from 'src/app/services/indexDB.service';

@Component({
  selector: 'app-instrument-details-form',
  templateUrl: './instrument-details-form.html',
  styleUrls: ['./instrument-details-form.scss'],
})
export class AppInvInstrumentDetailsFormComponent implements OnInit {

  public instrumentDetailsForm: FormGroup;
  @Input() action: string;
  @Input() moexBoards = []
  @Input() secidParam:string;
  instrumentDetails:instrumentDetails[] = [];
  @Output() public modal_principal_parent = new EventEmitter();
  public title: string;
  @Input() data: any;
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  private subscriptionName: Subscription
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private MarketDataService: AppMarketDataService,
    private indexDBServiceS: indexDBService,
  ) 
  {   
    this.instrumentDetailsForm = this.fb.group ({
      status: {value:null, disabled: false},
      boardid: {value:null, disabled: false},
      boardname: {value:null, disabled: false},
      listlevel: {value:0, disabled: false},
      issuesize: {value:0, disabled: false},
      issuevolume: {value:null, disabled: true},
      facevalue: {value:null, disabled: false},
      matdate: {value:null, disabled: false},
      regnumber: {value:null, disabled: false},
      currencyid: {value:null, disabled: false},
      lotsize: {value:null, disabled: false},
      minstep: {value:null, disabled: false},
      decimals: {value:null, disabled: false},
      marketcode: {value:null, disabled: false}
    })
    this.indexDBServiceS.getIndexDBInstrumentStaticTables('getBoardsDataFromInstruments').then (data=>this.moexBoards=data['data'])
    
  }
  ngOnInit(): void {
   this.title = this.action;
    switch (this.action) {
      case 'Create': 
      break;
      case 'Create_Example':
        this.instrumentDetailsForm.patchValue(this.data)
        this.title = 'Create';
        break;
        default:
        this.instrumentDetailsForm.patchValue(this.data)
      break; 
    } 
  } 
  ngOnChanges(changes: SimpleChanges) {
    this.MarketDataService.getMoexInstruments(undefined,undefined, {secid:[changes['secidParam'].currentValue,changes['secidParam'].currentValue]}).subscribe (instrumentData => {
      this.instrumentDetailsForm.patchValue(instrumentData[0]);
      this.MarketDataService.getInstrumentDataCorpActions(instrumentData[0].isin).subscribe(instrumentCorpActions => {
        this.MarketDataService.sendCorpActionData(instrumentCorpActions)
      })
    });  
    this.MarketDataService.getInstrumentDataDetails(changes['secidParam'].currentValue).subscribe(instrumentDetails => this.instrumentDetailsForm.patchValue(instrumentDetails[0]));
  }

  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + ' instrument details'}, action)
    }
  }
  updateInstrumentData(action:string){
    this.instrumentDetailsForm.updateValueAndValidity();
    if (this.instrumentDetailsForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.MarketDataService.createInstrument(this.instrumentDetailsForm.value).subscribe(result => {
          this.MarketDataService.sendInstrumentDataToUpdateTableSource(result,'Created')
          this.snacksBox(result.length,'Created');
        })
      break;
      case 'Edit':
        this.MarketDataService.updateInstrument (this.instrumentDetailsForm.value).subscribe(result => {
          this.MarketDataService.sendInstrumentDataToUpdateTableSource(result,'Updated')
          this.snacksBox(result.length,'Updated')
        })
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Instrument ' + this.secid.value).subscribe(isConfirmed => {
          if (isConfirmed.isConfirmed) {
            this.instrumentDetailsForm.controls['id'].enable()
            this.MarketDataService.deleteInstrument (this.instrumentDetailsForm.value['id']).subscribe (result =>{
              this.MarketDataService.sendInstrumentDataToUpdateTableSource(result,'Deleted')
              this.snacksBox(result.length,'Deleted')
              this.CommonDialogsService.dialogCloseAll();
            })
          }
        })
      break;
    }
  }

  get  status() {return this.instrumentDetailsForm.get('status')}​
  get  boardid() {return this.instrumentDetailsForm.get('boardid')}​
  get  boardname ()   {return this.instrumentDetailsForm.get('boardname') } 
  get  listlevel ()   {return this.instrumentDetailsForm.get('listlevel') } 
  get  matdate ()   {return this.instrumentDetailsForm.get('matdate') } 
  get  regnumber ()   {return this.instrumentDetailsForm.get('regnumber') } 
  get  currencyid ()   {return this.instrumentDetailsForm.get('currencyid') } 
  get  minstep ()   {return this.instrumentDetailsForm.get('minstep') }
  get  decimals ()   {return this.instrumentDetailsForm.get('decimals') }
  get  issuesize ()   {return this.instrumentDetailsForm.get('issuesize') } 
  get  facevalue ()   {return this.instrumentDetailsForm.get('facevalue') } 
  get  lotsize ()   {return this.instrumentDetailsForm.get('lotsize') } 
  get  issuevolume ()   {return this.instrumentDetailsForm.get('issuevolume') } 
  get  secid ()   {return this.instrumentDetailsForm.get('secid') } 
  get  remarks ()   {return this.instrumentDetailsForm.get('remarks') } 
  get  marketcode ()   {return this.instrumentDetailsForm.get('marketcode') } 
  get  isin ()   {return this.instrumentDetailsForm.get('isin') } 
}
