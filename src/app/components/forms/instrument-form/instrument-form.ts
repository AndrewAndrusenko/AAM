import { AfterContentInit, Component,  EventEmitter,  Input, Output, SimpleChanges, ViewChild} from '@angular/core';
import { AsyncValidatorFn, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Instruments, instrumentCorpActions, instrumentDetails } from 'src/app/models/intefaces';
import { MatTabGroup as MatTabGroup } from '@angular/material/tabs';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { menuColorGl } from 'src/app/models/constants';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { indexDBService } from 'src/app/services/indexDB.service';
import { AuthService } from 'src/app/services/auth.service';
import { Observable, distinctUntilChanged, filter, map, observable, startWith, switchMap } from 'rxjs';
import { AtuoCompleteService } from 'src/app/services/auto-complete-service';

@Component({
  selector: 'app-inv-instrument-modify-form',
  templateUrl: './instrument-form.html',
  styleUrls: ['./instrument-form.scss'],
})
export class AppInvInstrumentModifyFormComponent implements AfterContentInit  {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  public panelOpenState = true;
  public instrumentModifyForm: FormGroup;
  // // public instrumentDetailsForm: FormGroup;
  @Input() action: string = 'View';
  @Input() moexBoards = []
  @Input() secidParam:string;
  @Output() public modal_principal_parent = new EventEmitter();
  instrumentDetails:instrumentDetails[] = [];
  instrumentCorpActions:instrumentCorpActions[] = [];
  public title: string;
  public actionType : string;
  public data: any;
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  formDisabledFields: string[] = [];
  panelOpenStateFirst = false;
  panelOpenStateSecond = false;
  menuColorGl=menuColorGl
  securityTypes: any[];
  securityTypesFiltered: any[];
  securityGroups: any;
  SecidUniqueAsyncValidator :AsyncValidatorFn;
  ISINuniqueAsyncValidator :AsyncValidatorFn;
  placeholders = new Map();
  bondsPlaceholders = [
    ['maturitydate','Maturity date'],
    ['faceunit','Notinal currency'],
    ['facevalue','Notinal value'],
  ]
  futuresPlaceholders = [
    ['maturitydate','Experation date'],
    ['faceunit','Contract currency'],
    ['facevalue','Contract value'],
  ]
  filteredCurrenciesList: Observable<string[]>;
  constructor (
    private fb:FormBuilder, 
    private AuthServiceS:AuthService,  
    private CommonDialogsService:HadlingCommonDialogsService,
    private MarketDataService: AppMarketDataService,
    private indexDBServiceS:indexDBService,
    private AtuoCompService:AtuoCompleteService,
  ) 
  {    
    this.changePlaceholders('stock_bonds');
    this.instrumentModifyForm = this.fb.group ({
      id : {value:null, disabled: false},
      groupid : {value:null, disabled: false},
      secid: [null, { validators:  Validators.required, asyncValidators: null, updateOn: 'blur' }], 
      security_type_title:  {value:null, disabled: false},
      security_group_name:  {value:null, disabled: false}, 
      security_type_name:  {value:null, disabled: false}, 
      primary_boardid:  {value:null, disabled: false},
      board_title:  {value:null, disabled: false}, 
      title:  {value:null, disabled: false},
      category:  {value:null, disabled: false}, 
      name:   [null, { validators:  Validators.required, updateOn: 'blur' }], 
      isin: ['', {  asyncValidators: null, updateOn: 'blur' }], 
      emitent_title:  {value:null, disabled: false}, 
      emitent_inn:  {value:null, disabled: false}, 
      type:  [null, { validators:  Validators.required, updateOn: 'blur' }],
      group:  [null, { validators:  Validators.required, updateOn: 'blur' }], 
      marketprice_boardid:  {value:null, disabled: false},
      group_title:  {value:null, disabled: false},
      faceunit:  {value:null, disabled: false},
      facevalue:  [null,{validators: Validators.pattern('[0-9]*([0-9.]{0,3})?$'),updateOn: 'blur'}],
      maturitydate:  {value:null, disabled: false},
      regnumeric:  {value:null, disabled: false},
    })
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToInstrumentData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.AtuoCompService.getCurrencyList();
    this.indexDBServiceS.getIndexDBStaticTables('getMoexSecurityGroups').then ((data)=>this.securityGroups = data['data']);
    this.indexDBServiceS.getIndexDBStaticTables('getMoexSecurityTypes').then ((data)=>{
      this.securityTypes = data['data'];
      this.filtersecurityType(this.group.value);
    });
  }
  ngAfterContentInit (): void {
    this.faceunit.setValidators(this.AtuoCompService.currencyValirator())
    this.filteredCurrenciesList = this.faceunit.valueChanges.pipe (
      startWith (''),
      distinctUntilChanged(),
      map(value => this.AtuoCompService.filterList(value || '','currency'))
    )
    this.moexBoards.length? null : this.indexDBServiceS.getIndexDBStaticTables('getBoardsDataFromInstruments').then (data=>this.moexBoards = data['data']);
    if (this.data)  {
      this.instrumentModifyForm.patchValue(this.data);
      this.addAsyncValidators(this.action); 
    };
    this.action == 'View'|| this.disabledControlElements?  this.instrumentModifyForm.disable() : null;
  }
  async addAsyncValidators(action:string) {
    if (['Create','Create_Example'].includes(this.action)) {
      this.isin.setErrors({isinIsTaken:true});
      this.secid.setErrors({secidIsTaken:true})
      this.SecidUniqueAsyncValidator = customAsyncValidators.MD_SecidUniqueAsyncValidator (this.MarketDataService, '', this.secid.errors);
      this.ISINuniqueAsyncValidator = customAsyncValidators.MD_ISINuniqueAsyncValidator (this.MarketDataService, '', this.isin.errors);
    } else {
      this.SecidUniqueAsyncValidator = customAsyncValidators.MD_SecidUniqueAsyncValidator (this.MarketDataService, this.secid.value);
      this.ISINuniqueAsyncValidator = customAsyncValidators.MD_ISINuniqueAsyncValidator (this.MarketDataService, this.isin.value);
    }
    this.isin.setAsyncValidators([this.ISINuniqueAsyncValidator]);
    this.secid.setAsyncValidators([this.SecidUniqueAsyncValidator]);
    this.action === 'Create_Example'? this.action='Create':null;
  }
  revomeAsyncValidators (action?:string) {
    this.secid.removeAsyncValidators([this.SecidUniqueAsyncValidator]);
    this.isin.removeAsyncValidators([this.ISINuniqueAsyncValidator]); 
  }
  addBasicValidators(secType:string) {
    let fields = ['maturitydate','faceunit','facevalue'];
    switch (secType) {
      case 'stock_bonds':
      case 'stock_eurobond':
      case 'stock_deposit':
      case 'futures_options':
      case 'currency_futures':
      case 'futures_forts':
        fields.forEach(key => this.instrumentModifyForm.get(key).addValidators(Validators.required));
      break;
      default:
        fields.forEach(key => this.instrumentModifyForm.get(key).removeValidators(Validators.required));
      break;
    }
    fields.forEach(key => this.instrumentModifyForm.get(key).updateValueAndValidity());
  }
  changePlaceholders(secType:string) {
    switch (secType) {
      case 'stock_bonds':
      case 'stock_eurobond':
      case 'stock_deposit':
        this.bondsPlaceholders.forEach(el => this.placeholders.set(el[0],el[1]))
      break;
      case 'futures_options':
      case 'currency_futures':
      case 'futures_forts':
        this.futuresPlaceholders.forEach(el => this.placeholders.set(el[0],el[1]))
      break;
      default:
        // fields.forEach(key => this.instrumentModifyForm.get(key).removeValidators(Validators.required));
      break;
    }
  }
  ngOnChanges(changes: SimpleChanges) {

    this.revomeAsyncValidators();
    this.MarketDataService.getMoexInstruments(undefined,undefined, {secid:[changes['secidParam'].currentValue,changes['secidParam'].currentValue]}).subscribe (instrumentData => {
      this.instrumentModifyForm.patchValue(instrumentData[0]);
      this.addAsyncValidators('Edit');
      this.filtersecurityType(this.group.value)
    });  
  }
  filtersecurityType (filter:string) {
    this.changePlaceholders(filter);
    this.addBasicValidators(filter);
    this.securityTypes? this.securityTypesFiltered = this.securityTypes.filter (elem => elem.security_group_name===filter) : null;
  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.dialogCloseAll();
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + ' instrument'}, action)
      this.MarketDataService.sendInstrumentDataToUpdateTableSource(result,'Deleted')
      this.MarketDataService.sendInstrumentDataToUpdateTableSource(this.addJoinedFieldsToResult(result), action)
    }
  }
  addJoinedFieldsToResult (result:Instruments[]):Instruments[] {
    result[0].board_title = this.moexBoards.find(el=>el.boardid===result[0].primary_boardid).board_title;
    result[0].security_type_title = this.securityTypes.find(el=>el.security_type_name===result[0].type).security_type_title
    return result;
  }
  updateInstrumentData(action:string){
    if (this.instrumentModifyForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.MarketDataService.createInstrument(this.instrumentModifyForm.value).subscribe(result =>this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.MarketDataService.updateInstrument (this.instrumentModifyForm.value).subscribe(result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Instrument ' + this.secid.value).pipe(
          filter (isConfirmed => isConfirmed.isConfirmed),
          switchMap(data => this.MarketDataService.deleteInstrument (this.id.value))
        ).subscribe (result =>this.snacksBox(result,'Deleted'));
      break;
    }
  }
  get  secid() {return this.instrumentModifyForm.get('secid')}​
  get  id() {return this.instrumentModifyForm.get('id')}​
  get  security_type_title() {return this.instrumentModifyForm.get('security_type_title')}​
  get  shortname ()   {return this.instrumentModifyForm.get('shortname') } 
  get  isin ()   {return this.instrumentModifyForm.get('isin') } 
  get  primary_boardid ()   {return this.instrumentModifyForm.get('primary_boardid') } 
  get  board_title ()   {return this.instrumentModifyForm.get('board_title') } 
  get  name ()   {return this.instrumentModifyForm.get('name') } 
  get  emitent_inn ()   {return this.instrumentModifyForm.get('emitent_inn') }
  get  security_group_name ()   {return this.instrumentModifyForm.get('security_group_name') }
  get  security_type_name ()   {return this.instrumentModifyForm.get('security_type_name') }
  get  type ()   {return this.instrumentModifyForm.get('type') }
  get  group ()   {return this.instrumentModifyForm.get('group') }
  get  faceunit ()   {return this.instrumentModifyForm.get('faceunit') }
  get  facevalue ()   {return this.instrumentModifyForm.get('facevalue') }
  get  maturitydate ()   {return this.instrumentModifyForm.get('maturitydate') }
  get  regnumeric ()   {return this.instrumentModifyForm.get('regnumeric') }
  get  groupid ()   {return this.instrumentModifyForm.get('groupid') }
}
