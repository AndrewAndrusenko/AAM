import { Component,  EventEmitter,  Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { caTypes, instrumentDetails } from 'src/app/models/intefaces';
import { Subscription, filter, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { indexDBService } from 'src/app/services/indexDB.service';

@Component({
  selector: 'instrument-corp-action-form',
  templateUrl: './instrument-corp-action-form.html',
  styleUrls: ['./instrument-corp-action-form.scss'],
})
export class AppInstrumentCorpActionFormComponent {
  public CorpActionsForm: FormGroup;
  @Input() action: string;
  @Input() moexBoards = []
  @Input() instrument:any;
  instrumentDetails:instrumentDetails[] = [];
  @Output() public modal_principal_parent = new EventEmitter();
  public title: string;
  @Input() data: any;
  private subscriptionName: Subscription
  caTypes: caTypes[];
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private MarketDataService: AppMarketDataService,
    private indexDBServiceS: indexDBService,
  ) 
  {   
    this.CorpActionsForm = this.fb.group ({
      id: {value:null, disabled: false}, 
      secid: [null, { validators:  Validators.required, updateOn: 'blur' }], 
      issuevolume: {value:null, disabled: false}, 
      secname: {value:null, disabled: false}, 
      notinal: {value:null, disabled: false}, 
      notinalcurrency: {value:null, disabled: false}, 
      unredemeedvalue: {value:null, disabled: false}, 
      couponrate: {value:null, disabled: false}, 
      couponamount: {value:null, disabled: false}, 
      actiontype: [null, { validators:  Validators.required, updateOn: 'blur' }], 
      couponamountrur: {value:null, disabled: false}, 
      date: [null, { validators:  Validators.required, updateOn: 'blur' }], 
      action: {value:null, disabled: false}
      // boardid:  [null, { validators:  Validators.required, updateOn: 'blur' }], 
         })
  }
  ngAfterContentInit(): void {
    this.title = this.action;
    switch (this.action) {
      case 'Create': 
        this.secid.patchValue(this.instrument.secid);
      break;
      case 'Create_Example':
        this.CorpActionsForm.patchValue(this.data);
        this.title = 'Create';
      break;
      default:
        this.CorpActionsForm.patchValue(this.data);
      break; 
    } 
    this.indexDBServiceS.getIndexDBInstrumentStaticTables('getCorpActionTypes').then(data => {
      console.log('data',data['data']);
      this.caTypes=data['data'].filter(el=>el.sectypename===this.instrument.group)})
  }
  ngOnChanges(changes: SimpleChanges) {
    this.MarketDataService.getMoexInstruments(undefined,undefined, {secid:[changes['isinParam'].currentValue,changes['isinParam'].currentValue]}).subscribe (instrumentData => {
      this.CorpActionsForm.patchValue(instrumentData[0]);
      this.MarketDataService.getInstrumentDataCorpActions(instrumentData[0].isin).subscribe(instrumentCorpActions => {
        this.MarketDataService.sendCorpActionData(instrumentCorpActions)
      })
    });  
    this.MarketDataService.getInstrumentDataDetails(changes['isinParam'].currentValue).subscribe(instrumentDetails => this.CorpActionsForm.patchValue(instrumentDetails[0]));
  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + ' instrument details'}, action,undefined,false)
      this.MarketDataService.sendReloadInstrumentDetails(result)
      this.modal_principal_parent.emit(true)
    }
  }
  updateInstrumentData(action:string){
    console.log('form data', this.CorpActionsForm.value,this.actiontype.value);
    this.CorpActionsForm.updateValueAndValidity();
    if (this.CorpActionsForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.MarketDataService.updateInstrumentDetails(this.CorpActionsForm.value,'Create').subscribe(result => this.snacksBox(result))
      break;
      case 'Edit':
        this.MarketDataService.updateInstrumentDetails (this.CorpActionsForm.value,'Edit').subscribe(result => this.snacksBox(result))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: '+ this.actiontype.value + ' for '+ this.secid.value).pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(data => this.MarketDataService.updateInstrumentDetails(this.CorpActionsForm.value,'Delete'))
        ).subscribe(result => this.snacksBox(result,'Deleted'))
      break;
    }
  }
  get  actiontype() {return this.CorpActionsForm.get('actiontype')}
  get  id() {return this.CorpActionsForm.get('id')}
  get  notinalcurrency () {return this.CorpActionsForm.get('notinalcurrency') } 
  get  unredemeedvalue () {return this.CorpActionsForm.get('unredemeedvalue') } 
  get  couponrate () {return this.CorpActionsForm.get('couponrate') } 
  get  couponamount () {return this.CorpActionsForm.get('couponamount') } 
  get  date () {return this.CorpActionsForm.get('date') }
  get  secid () {return this.CorpActionsForm.get('secid') }
}