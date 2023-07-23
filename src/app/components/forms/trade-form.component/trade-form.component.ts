import { AfterContentInit, Component,  EventEmitter,  Input, Output, SimpleChanges, ViewChild} from '@angular/core';
import { AsyncValidatorFn, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Instruments, instrumentCorpActions, instrumentDetails, trades } from 'src/app/models/intefaces.model';
import { MatTabGroup as MatTabGroup } from '@angular/material/tabs';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { menuColorGl } from 'src/app/models/constants.model';
import { AppMarketDataService } from 'src/app/services/market-data.service';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators.service';
import { indexDBService } from 'src/app/services/indexDB.service';
import { AuthService } from 'src/app/services/auth.service';
import { Observable, distinctUntilChanged, filter, map, observable, startWith, switchMap } from 'rxjs';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { AppTradeService } from 'src/app/services/trades-service.service';

@Component({
  selector: 'app-trade-modify-form',
  templateUrl: './trade-form.component.html',
  styleUrls: ['./trade-form.component.scss'],
})
export class AppTradeModifyFormComponent implements AfterContentInit  {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  public panelOpenState = true;
  public tradeModifyForm: FormGroup;
  // // public instrumentDetailsForm: FormGroup;
  @Input() action: string = 'View';
  @Input() secidParam:string;
  @Output() public modal_principal_parent = new EventEmitter();
  public title: string;
  public actionType : string;
  public data: any;
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  panelOpenStateFirst = false;
  panelOpenStateSecond = false;
  menuColorGl=menuColorGl
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
    private TradeService: AppTradeService,
    private indexDBServiceS:indexDBService,
    private AtuoCompService:AtuoCompleteService,
  ) 
  {    
    this.changePlaceholders('stock_bonds');
    this.tradeModifyForm = this.fb.group ({
      idtrade:{value:null, disabled: false},qty:{value:null, disabled: false},price:{value:null, disabled: false},accured_interest:{value:null, disabled: false},f1ee_trade:{value:null, disabled: false},fee_settlement:{value:null, disabled: false},fee_exchange:{value:null, disabled: false},tdate:{value:null, disabled: false},vdate:{value:null, disabled: false},tidorder:{value:null, disabled: false},allocatedqty:{value:null, disabled: false},idportfolio:{value:null, disabled: false},id_price_currency:{value:null, disabled: false},id_settlement_currency:{value:null, disabled: false},id_buyer_instructions:{value:null, disabled: false},id_seller_instructions:{value:null, disabled: false},cpty:{value:null, disabled: false},tidinstrument:{value:null, disabled: false},id_broker:{value:null, disabled: false},trtype:{value:null, disabled: false}, action:{value:null, disabled: false},price_type:{value:null, disabled: false}

/*       id : {value:null, disabled: false},
      groupid : {value:null, disabled: false},
      tidinstrument: [null, { validators:  Validators.required, asyncValidators: null, updateOn: 'blur' }], 
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
      regnumeric:  {value:null, disabled: false}, */
    })
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.AtuoCompService.getCurrencyList();
  }
  ngAfterContentInit (): void {
    this.id_price_currency.setValidators(this.AtuoCompService.currencyValirator())
    this.filteredCurrenciesList = this.id_price_currency.valueChanges.pipe (
      startWith (''),
      distinctUntilChanged(),
      map(value => this.AtuoCompService.filterList(value || '','currency'))
    )
      this.tradeModifyForm.patchValue(this.data);
      this.addAsyncValidators(this.action); 
    this.action == 'View'|| this.disabledControlElements?  this.tradeModifyForm.disable() : null;
  }
  async addAsyncValidators(action:string) {
   /*  if (['Create','Create_Example'].includes(this.action)) {
      this.isin.setErrors({isinIsTaken:true});
      this.tidinstrument.setErrors({secidIsTaken:true})
      this.SecidUniqueAsyncValidator = customAsyncValidators.MD_SecidUniqueAsyncValidator (this.MarketDataService, '', this.tidinstrument.errors);
      this.ISINuniqueAsyncValidator = customAsyncValidators.MD_ISINuniqueAsyncValidator (this.MarketDataService, '', this.isin.errors);
    } else {
      this.SecidUniqueAsyncValidator = customAsyncValidators.MD_SecidUniqueAsyncValidator (this.MarketDataService, this.tidinstrument.value);
      this.ISINuniqueAsyncValidator = customAsyncValidators.MD_ISINuniqueAsyncValidator (this.MarketDataService, this.isin.value);
    }
    this.isin.setAsyncValidators([this.ISINuniqueAsyncValidator]);
    this.tidinstrument.setAsyncValidators([this.SecidUniqueAsyncValidator]);
    this.action === 'Create_Example'? this.action='Create':null; */
  }
  revomeAsyncValidators (action?:string) {
    this.tidinstrument.removeAsyncValidators([this.SecidUniqueAsyncValidator]);
    this.id_price_currency.removeAsyncValidators([this.ISINuniqueAsyncValidator]); 
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
        fields.forEach(key => this.tradeModifyForm.get(key).addValidators(Validators.required));
      break;
      default:
        fields.forEach(key => this.tradeModifyForm.get(key).removeValidators(Validators.required));
      break;
    }
    fields.forEach(key => this.tradeModifyForm.get(key).updateValueAndValidity());
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
        // fields.forEach(key => this.tradeModifyForm.get(key).removeValidators(Validators.required));
      break;
    }
  }
  filtersecurityType (filter:string) {
/*     this.changePlaceholders(filter);
    this.addBasicValidators(filter);
    this.securityTypes? this.securityTypesFiltered = this.securityTypes.filter (elem => elem.security_group_name===filter) : null; */
  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.dialogCloseAll();
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + ' instrument'}, action)
      this.TradeService.sendTradeDataToUpdateTableSource(this.addJoinedFieldsToResult(result), action)
    }
  }
  addJoinedFieldsToResult (result:trades[]):trades[] {
/*     result[0].board_title = this.moexBoards.find(el=>el.boardid===result[0].primary_boardid).board_title;
    result[0].security_type_title = this.securityTypes.find(el=>el.security_type_name===result[0].type).security_type_title */
    return result;
  }
  updateInstrumentData(action:string){
    if (this.tradeModifyForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.TradeService.updateInstrument(this.tradeModifyForm.value).subscribe(result =>this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.TradeService.updateInstrument (this.tradeModifyForm.value).subscribe(result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Instrument ' + this.tidinstrument.value).pipe(
          filter (isConfirmed => isConfirmed.isConfirmed),
          switchMap(data => this.TradeService.updateInstrument (this.idtrade.value))
        ).subscribe (result =>this.snacksBox(result,'Deleted'));
      break;
    }
  }
  get  idtrade() {return this.tradeModifyForm.get('idtrade')}​
  get  trtype() {return this.tradeModifyForm.get('trtype')}​
  get  qty() {return this.tradeModifyForm.get('qty')}​
  get  price() {return this.tradeModifyForm.get('price')}​
  get  accured_interest ()   {return this.tradeModifyForm.get('accured_interest') } 
  get  f1ee_trade ()   {return this.tradeModifyForm.get('f1ee_trade') } 
  get  fee_settlement ()   {return this.tradeModifyForm.get('fee_settlement') } 
  get  fee_exchange ()   {return this.tradeModifyForm.get('fee_exchange') } 
  get  tdate ()   {return this.tradeModifyForm.get('tdate') } 
  get  vdate ()   {return this.tradeModifyForm.get('vdate') }
  get  tidorder ()   {return this.tradeModifyForm.get('tidorder') }
  get  id_price_currency ()   {return this.tradeModifyForm.get('id_price_currency') }
  get  id_settlement_currency ()   {return this.tradeModifyForm.get('id_settlement_currency') }
  get  id_buyer_instructions ()   {return this.tradeModifyForm.get('id_buyer_instructions') }
  get  id_seller_instructions ()   {return this.tradeModifyForm.get('id_seller_instructions') }
  get  cpty ()   {return this.tradeModifyForm.get('cpty') }
  get  tidinstrument ()   {return this.tradeModifyForm.get('tidinstrument') }
  get  id_broker ()   {return this.tradeModifyForm.get('id_broker') }
  get  price_type ()   {return this.tradeModifyForm.get('price_type') }
}