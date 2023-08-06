import { AfterContentInit, Component,  EventEmitter,  Input, Output} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientData, Instruments, instrumentCorpActions, instrumentDetails, trades } from 'src/app/models/intefaces.model';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { menuColorGl } from 'src/app/models/constants.model';
import { AuthService } from 'src/app/services/auth.service';
import { Observable, distinctUntilChanged, filter, map, observable, startWith, switchMap } from 'rxjs';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { AppTradeService } from 'src/app/services/trades-service.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppClientsTableComponent } from '../../tables/clients-table.component/clients-table.component';
import { AppInstrumentTableComponent } from '../../tables/instrument-table.component/instrument-table.component';
import { indexDBService } from 'src/app/services/indexDB.service';
import { CurrenciesDataService } from 'src/app/services/currencies-data.service';
@Component({
  selector: 'app-trade-modify-form',
  templateUrl: './trade-form.component.html',
  styleUrls: ['./trade-form.component.scss'],
})
export class AppTradeModifyFormComponent implements AfterContentInit  {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  public tradeModifyForm: FormGroup;
  @Input() action: string = 'View';
  @Output() public modal_principal_parent = new EventEmitter();
  public title: string;
  public actionType : string;
  public data: any;
  panelOpenStateFirst = false;
  panelOpenStateSecond = false;
  menuColorGl=menuColorGl
  filteredCurrenciesList: Observable<string[]>;
  filteredSetCurrenciesList: Observable<string[]>;
  filterednstrumentsLists : Observable<string[]>;
  filteredCounterPartiesList : Observable<string[]>;
  dialogClientsTabletRef: MatDialogRef<AppClientsTableComponent>;
  dialogInstrumentTabletRef: MatDialogRef<AppInstrumentTableComponent>;
  securityTypes: any[];
  formerrors: any;
  constructor (
    private fb:FormBuilder, 
    private AuthServiceS:AuthService,  
    private CommonDialogsService:HadlingCommonDialogsService,
    private TradeService: AppTradeService,
    private AutoCompService:AtuoCompleteService,
    private indexDBServiceS:indexDBService,
    private CurrenciesDataSvc:CurrenciesDataService,
    private dialog: MatDialog, 
  ) 
  {    
    this.tradeModifyForm = this.fb.group ({
      idtrade:{value:null, disabled: false},
      trtype:[null, { validators:  Validators.required, updateOn: 'blur' }], action:{value:null, disabled: false},
      tdate:[new Date(), { validators:  Validators.required, updateOn: 'blur' }],
      vdate:[new Date(), { validators:  Validators.required, updateOn: 'blur' }],
      tidinstrument:[null, { validators:  Validators.required }],
      qty:[null, { validators:  [Validators.required,Validators.pattern('[0-9]*([0-9.]{0,8})?$')], updateOn: 'blur' }], 
      price:[null, { validators: [ Validators.required, Validators.pattern('[0-9]*([0-9.]{0,8})?$')], updateOn: 'blur' }],
      price_type:[1, { validators:  Validators.required, updateOn: 'blur' }],
      accured_interest:[null, { validators: Validators.pattern('[0-9]*([0-9.]{0,3})?$'), updateOn: 'blur' }],
      f1ee_trade:[null, { validators: Validators.pattern('[0-9]*([0-9.]{0,3})?$'), updateOn: 'blur' }],
      fee_settlement:[null, { validators: Validators.pattern('[0-9]*([0-9.]{0,3})?$'), updateOn: 'blur' }],
      fee_exchange:[null, { validators: Validators.pattern('[0-9]*([0-9.]{0,3})?$'), updateOn: 'blur' }],
      id_cpty:[null, { validators:  Validators.required, updateOn: 'blur' }],
      id_price_currency:['810'],
      id_settlement_currency:['810'],
      tidorder:{value:null, disabled: false},allocatedqty:{value:null, disabled: false},idportfolio:{value:null, disabled: false},
      id_buyer_instructions:{value:null, disabled: false},id_seller_instructions:{value:null, disabled: false},id_broker:{value:null, disabled: false}, details:{value:null, disabled: false},cpty_name:{value:null, disabled: false},security_group_name :{value:null, disabled: false},   secid_name:{value:null, disabled: false}, trade_amount:[null], facevalue:[null],faceunit:[null],faceunit_name:[null], code_price_currency:[null],  price_currency_name:[null], settlement_currency_name:[null], code_settlement_currency:[null], settlement_amount:[null],settlement_rate:[null]
    })
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.indexDBServiceS.getIndexDBStaticTables('getMoexSecurityTypes').then (data=>this.securityTypes = data['data']);
    this.AutoCompService.getCurrencyList().then(()=>{
      this.id_price_currency.setValidators([this.AutoCompService.currencyValirator(),Validators.required]);
      this.id_price_currency.updateValueAndValidity();
      this.id_settlement_currency.setValidators([this.AutoCompService.currencyValirator()]);
      this.id_settlement_currency.updateValueAndValidity();
      this.faceunit_name.patchValue(this.AutoCompService.getCurrecyData(this.faceunit.value)['CurrencyCode'])
      this.checkCurrenciesHints()
    });
    this.AutoCompService.getSecidLists().then (()=>this.tidinstrument.setValidators(this.AutoCompService.secidValirator()) );
    this.AutoCompService.getCounterpartyLists().then (()=>this.id_cpty.setValidators(this.AutoCompService.counterPartyalirator(this.cpty_name)));
  }
  showErrors () {
   Object.entries(this.tradeModifyForm.controls).forEach(el=>el[1].errors? console.log(el[0],el[1].errors):null)
  }

  ngAfterContentInit (): void {
    this.filterednstrumentsLists = this.tidinstrument.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged(),
      map(value => this.AutoCompService.filterList(value || '','secid'))
    );
    this.filteredCurrenciesList = this.id_price_currency.valueChanges.pipe (
      startWith (''),
      distinctUntilChanged(),
      map(value => this.AutoCompService.filterList(value || '','currency'))
      );
      this.filteredSetCurrenciesList = this.id_settlement_currency.valueChanges.pipe (
        startWith (''),
        distinctUntilChanged(),
        map(value => this.AutoCompService.filterList(value || '','currency'))
        );
      this.filteredCounterPartiesList = this.cpty_name.valueChanges.pipe (
        startWith (''),
        distinctUntilChanged(),
        map(value => this.AutoCompService.filterList(value || '','cpty'))
      );
      this.price.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>this.tradeAmountCalculation());
      this.qty.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>this.tradeAmountCalculation());
      this.settlement_rate.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>this.tradeAmountCalculation());
      this.qty.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>this.tradeAmountCalculation());
      this.id_settlement_currency.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>{
        this.id_settlement_currency.value? this.settlement_rate.setValidators([ Validators.required, Validators.pattern('[0-9]*([0-9.]{0,8})?$')]): this.settlement_rate.removeValidators(Validators.required);
        this.tradeAmountCalculation();
        this.settlement_rate.updateValueAndValidity()
      })
      this.tradeModifyForm.patchValue(this.data);
      this.price_type.value==2? this.id_price_currency.patchValue(this.faceunit.value): null;
      this.action == 'View'|| this.disabledControlElements?  this.tradeModifyForm.disable() : null;
      this.tradeAmountCalculation();
  }
  selectClient (){
    this.dialogClientsTabletRef = this.dialog.open(AppClientsTableComponent ,{minHeight:'400px', minWidth:'90vw', autoFocus: false, maxHeight: '90vh'});
    this.dialogClientsTabletRef.componentInstance.action = 'Select';
    this.dialogClientsTabletRef.componentInstance.modal_principal_parent.subscribe ((item:ClientData )=>{
      this.id_cpty.patchValue(item.idclient)
      this.cpty_name.patchValue(item.clientname)
      this.dialogClientsTabletRef.close(); 
    });
  }
  secidChanged (item:any) {
    this.tidinstrument.patchValue(item.secid)
    this.secid_name.patchValue(item.name+' ('+item.security_type_name+')')
    this.price_type.patchValue(this.securityTypes.filter(el=>el['security_type_name']===item.security_type_name)[0]['price_type'])
    this.facevalue.patchValue(item.facevalue)
    this.faceunit.patchValue(item.faceunit)
    this.faceunit_name.patchValue(this.AutoCompService.getCurrecyData(this.faceunit.value)['CurrencyCode'])
    this.price_type.value==2? this.id_price_currency.patchValue(this.faceunit.value) : null;
    this.checkCurrenciesHints()
    this.tradeAmountCalculation();
  }
  secidAutocolmplete (secidDesc:string) {
    let secidArr = secidDesc.split(' - ');
    let instrument = {name:'',security_type_name:'',faceunit:'',facevalue:0,secid:''}  ;
    instrument.name = secidArr[1];
    instrument.security_type_name=secidArr[2];
    instrument.faceunit=secidArr[3];
    instrument.facevalue=Number(secidArr[4]);
    instrument.secid=secidArr[0];
    this.secidChanged(instrument)
  }
  selectSecID (){
    this.dialogInstrumentTabletRef = this.dialog.open(AppInstrumentTableComponent ,{minHeight:'400px', minWidth:'90vw', autoFocus: false, maxHeight: '90vh'});
    this.dialogInstrumentTabletRef.componentInstance.FormMode = 'Select';
    this.dialogInstrumentTabletRef.componentInstance.modal_principal_parent.subscribe ((item:Instruments )=>{
      this.secidChanged(item)
      this.dialogInstrumentTabletRef.close(); 
    });
  }
  checkCurrenciesHints (){
    let el_price_currency = this.AutoCompService.getCurrecyData(this.id_price_currency.value)
    this.code_price_currency.patchValue(el_price_currency['CurrencyCode'])
    this.price_currency_name.patchValue(el_price_currency['CurrencyName'])
    let el_settlement_currency = this.AutoCompService.getCurrecyData(this.id_settlement_currency.value)
    this.code_settlement_currency.patchValue(el_settlement_currency['CurrencyCode'])
    this.settlement_currency_name.patchValue(el_settlement_currency['CurrencyName'])
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

  tradeAmountCalculation() {
    if (this.price_type.value==='2') {
      this.TradeService.getcouponPeriodInfo(this.vdate.value,this.tidinstrument.value).subscribe (coupon => {
        let cdate = new Date(coupon[0].coupon_date);
        let valdate = new Date(this.vdate.value);
        let days = Math.round( Math.ceil(Math.abs((cdate.getTime()-valdate.getTime()))/(1000 * 3600 * 24)));
        this.id_price_currency.patchValue(coupon[0].currency)
        this.details.patchValue(JSON.stringify(coupon[0]) +' days:' + days, +'fv'+this.facevalue.value);
        let accured_interest = (this.facevalue.value*this.qty.value*coupon[0].couponrate/100*days/365).toFixed(2);
        this.accured_interest.patchValue((this.facevalue.value*this.qty.value*coupon[0].couponrate/100*days/365).toFixed(2));
        this.trade_amount.patchValue(Number(this.price.value/100*this.qty.value*this.facevalue.value)+Number(this.accured_interest.value))
        if (this.id_settlement_currency.value&&this.id_settlement_currency.valid&&Number(this.settlement_rate.value)) {
          this.settlement_amount.patchValue((Number(this.trade_amount.value)*Number(this.settlement_rate.value)).toFixed(2))
        } else { 
          this.settlement_amount.patchValue(!this.id_settlement_currency.value? this.trade_amount.value : 'Error');
          // this.settlement_amount.patchValue(this.trade_amount.value)
        }
      })}
   this.price_type.value==='1'? this.trade_amount.patchValue(this.price.value*this.qty.value):null;
  }
  Number(value) {
    return Number(value)? true:false
  }

  get idtrade() {return this.tradeModifyForm.get('idtrade')}
  get trtype() {return this.tradeModifyForm.get('trtype')}
  get qty() {return this.tradeModifyForm.get('qty')}
  get price() {return this.tradeModifyForm.get('price')}
  get accured_interest() {return this.tradeModifyForm.get('accured_interest')} 
  get f1ee_trade() {return this.tradeModifyForm.get('f1ee_trade')} 
  get fee_settlement() {return this.tradeModifyForm.get('fee_settlement')} 
  get fee_exchange() {return this.tradeModifyForm.get('fee_exchange')} 
  get tdate() {return this.tradeModifyForm.get('tdate')} 
  get vdate() {return this.tradeModifyForm.get('vdate')}
  get tidorder() {return this.tradeModifyForm.get('tidorder')}
  get id_price_currency() {return this.tradeModifyForm.get('id_price_currency')}
  get id_settlement_currency() {return this.tradeModifyForm.get('id_settlement_currency')}
  get id_buyer_instructions() {return this.tradeModifyForm.get('id_buyer_instructions')}
  get id_seller_instructions() {return this.tradeModifyForm.get('id_seller_instructions')}
  get id_cpty() {return this.tradeModifyForm.get('id_cpty')}
  get tidinstrument() {return this.tradeModifyForm.get('tidinstrument')}
  get id_broker() {return this.tradeModifyForm.get('id_broker')}
  get price_type() {return this.tradeModifyForm.get('price_type')}
  get secid_name() {return this.tradeModifyForm.get('secid_name')}
  get secid_type() {return this.tradeModifyForm.get('secid_type')}
  get cpty_name() {return this.tradeModifyForm.get('cpty_name')}
  get trade_amount() {return this.tradeModifyForm.get('trade_amount')}
  get facevalue() {return this.tradeModifyForm.get('facevalue')}
  get faceunit() {return this.tradeModifyForm.get('faceunit')}
  get faceunit_name() {return this.tradeModifyForm.get('faceunit_name')}
  get details() {return this.tradeModifyForm.get('details')}
  get code_price_currency() {return this.tradeModifyForm.get('code_price_currency')}
  get code_settlement_currency() {return this.tradeModifyForm.get('code_settlement_currency')}
  get price_currency_name() {return this.tradeModifyForm.get('price_currency_name')}
  get settlement_currency_name() {return this.tradeModifyForm.get('settlement_currency_name')}
  get settlement_amount() {return this.tradeModifyForm.get('settlement_amount')}
  get settlement_rate() {return this.tradeModifyForm.get('settlement_rate')}
}