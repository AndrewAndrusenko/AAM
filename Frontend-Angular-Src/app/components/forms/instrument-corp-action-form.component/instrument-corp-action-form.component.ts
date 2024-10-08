import { Component,  EventEmitter,  Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { corporateActionsTypes, instrumentCorpActions, instrumentDetails, instrumentShort } from 'Frontend-Angular-Src/app/models/instruments.interfaces';
import { Observable, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { indexDBService } from 'Frontend-Angular-Src/app/services/indexDB.service';
import { AtuoCompleteService } from 'Frontend-Angular-Src/app/services/auto-complete.service';
import { InstrumentDataService } from 'Frontend-Angular-Src/app/services/instrument-data.service';
import { currencyCode } from 'Frontend-Angular-Src/app/models/interfaces.model';
@Component({
  selector: 'instrument-corp-action-form',
  templateUrl: './instrument-corp-action-form.component.html',
  styleUrls: ['./instrument-corp-action-form.component.scss'],
})
export class AppInstrumentCorpActionFormComponent {
  public CorpActionsForm: FormGroup;
  @Input() action: string;
  @Input() moexBoards = []
  @Input() instrument:instrumentShort;
  @Input() data: instrumentCorpActions;
  @Output() public modal_principal_parent = new EventEmitter();
  instrumentDetails:instrumentDetails[] = [];
  public title: string;
  caTypes: corporateActionsTypes[];
  filteredCurrenciesList: Observable<currencyCode[]>;
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
    private indexDBServiceS: indexDBService,
    private InstrumentDataS:InstrumentDataService,
    private AtuoCompService:AtuoCompleteService,
  ) 
  { 
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
  ngOnInit(): void {
    this.AtuoCompService.fullCurrenciesList.length? null: this.AtuoCompService.subCurrencyList.next(true);
  }
  ngAfterContentInit(): void {
    this.currency.setValidators(this.AtuoCompService.currencyValirator())
    this.filteredCurrenciesList = this.currency.valueChanges.pipe (
      startWith (''),
      distinctUntilChanged(),
      map(value => this.AtuoCompService.filterList(value || '','currency') as currencyCode[])
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
    this.indexDBServiceS.getIndexDBStaticTables('getCorpActionTypes')
    .subscribe(data =>{
      this.instrument? this.caTypes=(data.data as corporateActionsTypes[]).filter(el=>el.sectype.includes(Number(this.instrument.groupid))):null;
      if (!this.instrument&&this.actiontype) {
        let grp = (data.data as corporateActionsTypes[]).find(el=>el.id===this.actiontype.value).sectype
        this.caTypes=(data.data as corporateActionsTypes[]).filter(el=>el.sectype.includes(Number(...grp)))
      }
    })
  }
  snacksBox(result:{name:string,detail:string}|instrumentCorpActions[], action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: (result as instrumentCorpActions[]).length + ' instrument details'}, action,undefined,false)
      this.InstrumentDataS.sendReloadDataCorpActions(result as instrumentCorpActions[])
      this.modal_principal_parent.emit(true)
    }
  }
  updateInstrumentData(action:string){
    this.CorpActionsForm.updateValueAndValidity();
    if (this.CorpActionsForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.InstrumentDataS.updateInstrumentDataCorpActions(this.CorpActionsForm.value,'Create').subscribe(result => this.snacksBox(result))
      break;
      case 'Edit':
        this.InstrumentDataS.updateInstrumentDataCorpActions (this.CorpActionsForm.value,'Edit').subscribe(result => this.snacksBox(result))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: '+ this.actiontype.value + ' for '+ this.secid.value).pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(data => this.InstrumentDataS.updateInstrumentDataCorpActions(this.CorpActionsForm.value,'Delete'))
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