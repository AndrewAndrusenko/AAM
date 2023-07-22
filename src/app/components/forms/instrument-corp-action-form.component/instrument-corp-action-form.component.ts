import { Component,  EventEmitter,  Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { caTypes, instrumentDetails } from 'src/app/models/intefaces.model';
import { Observable, Subscription, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { indexDBService } from 'src/app/services/indexDB.service';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';

@Component({
  selector: 'instrument-corp-action-form',
  templateUrl: './instrument-corp-action-form.component.html',
  styleUrls: ['./instrument-corp-action-form.component.scss'],
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
  filteredCurrenciesList: Observable<string[]>;
  templateStructureAT = {
   1 : {
    placeholders: {couponamount:'Coupon Amount',couponrate: "Coupon Rate" },
    requiredFileds: ['couponrate']
   },
   2 : {
    placeholders: {couponamount:'Coupon Amount',couponrate: "Coupon Rate" },
    requiredFileds: ['couponrate']
  },
  3 : {
    placeholders: {couponamount:'Amortization Amount',couponrate: "Amortization Rate" },
    requiredFileds: ['couponrate']
   },
   4 : {
    placeholders: {couponamount:'Coupon Amount',couponrate: "Coupon Rate" },
    requiredFileds: []
   },
   5 : {
    placeholders: {couponamount:'Dividend Amount' },
    requiredFileds: []
   },
   6 : {
    placeholders: {couponamount:'Offerta Amount',couponrate: "Offerta Rate" },
    requiredFileds: []
   },
   7 : {
    placeholders: {couponamount:'Offerta Amount',couponrate: "Offerta Rate" },
    requiredFileds: []
   },
  } 
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private MarketDataService: AppMarketDataService,
    private indexDBServiceS: indexDBService,
    private AtuoCompService:AtuoCompleteService,
  ) 
  {   
    this.AtuoCompService.getCurrencyList();
    this.CorpActionsForm = this.fb.group ({
      id: {value:null, disabled: false}, 
      secid: [null, { validators:  Validators.required, updateOn: 'blur' }], 
      currency: [null, { validators:  [Validators.required]}], 
      unredemeedvalue: [null, { validators:  [Validators.pattern('[0-9]*([0-9.]{0,3})?$')], updateOn: 'blur' }], 
      couponrate: {value:null, disabled: false}, 
      couponamount: [null, { validators:  [Validators.required,Validators.pattern('[0-9]*([0-9.]{0,3})?$')], updateOn: 'blur' }], 
      actiontype: [1, { validators:  Validators.required, updateOn: 'blur' }], 
      couponamountrur: {value:null, disabled: false}, 
      date: [null, { validators:  Validators.required, updateOn: 'blur' }], 
      action: {value:null, disabled: false}
    })
  }
  ngAfterContentInit(): void {
    this.currency.setValidators(this.AtuoCompService.currencyValirator())
    this.filteredCurrenciesList = this.currency.valueChanges.pipe (
      startWith (''),
      distinctUntilChanged(),
      map(value => this.AtuoCompService.filterList(value || '','currency'))
    )
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
    this.indexDBServiceS.getIndexDBStaticTables('getCorpActionTypes').then(data =>this.caTypes=data['data'].filter(el=>el.sectype.includes(Number(this.instrument.groupid))))
  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + ' instrument details'}, action,undefined,false)
      this.MarketDataService.sendReloadDataCorpActions(result)
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
        this.MarketDataService.updateInstrumentDataCorpActions(this.CorpActionsForm.value,'Create').subscribe(result => this.snacksBox(result))
      break;
      case 'Edit':
        this.MarketDataService.updateInstrumentDataCorpActions (this.CorpActionsForm.value,'Edit').subscribe(result => this.snacksBox(result))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: '+ this.actiontype.value + ' for '+ this.secid.value).pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(data => this.MarketDataService.updateInstrumentDataCorpActions(this.CorpActionsForm.value,'Delete'))
        ).subscribe(result => this.snacksBox(result,'Deleted'))
      break;
    }
  }
  get  actiontype() {return this.CorpActionsForm.get('actiontype')}
  get  id() {return this.CorpActionsForm.get('id')}
  get   currency () {return this.CorpActionsForm.get('currency') } 
  get  unredemeedvalue () {return this.CorpActionsForm.get('unredemeedvalue') } 
  get  couponrate () {return this.CorpActionsForm.get('couponrate') } 
  get  couponamount () {return this.CorpActionsForm.get('couponamount') } 
  get  date () {return this.CorpActionsForm.get('date') }
  get  secid () {return this.CorpActionsForm.get('secid') }
}