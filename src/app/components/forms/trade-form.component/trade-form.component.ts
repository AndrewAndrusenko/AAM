import { AfterContentInit, Component,  EventEmitter,  Input, Output, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientData, Instruments, allocation, bAccountTransaction, bLedgerTransaction, bcParametersSchemeAccTrans, orders} from 'src/app/models/intefaces.model';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AuthService } from 'src/app/services/auth.service';
import { Observable, Subscription, distinctUntilChanged, filter, firstValueFrom, map, observable, startWith, switchMap, tap } from 'rxjs';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { AppTradeService } from 'src/app/services/trades-service.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppClientsTableComponent } from '../../tables/clients-table.component/clients-table.component';
import { AppInstrumentTableComponent } from '../../tables/instrument-table.component/instrument-table.component';
import { indexDBService } from 'src/app/services/indexDB.service';
import { InstrumentDataService } from 'src/app/services/instrument-data.service';
import { AppAccountingService } from 'src/app/services/accounting.service';
import { AppOrderTableComponent } from '../../tables/orders-table.component/orders-table.component';
import { HandlingTableSelectionService } from 'src/app/services/handling-table-selection.service';
import { AppallocationTableComponent } from '../../tables/allocation-table.component/allocation-table.component';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { AccountingTradesService } from 'src/app/services/accounting-trades.service';
import { AppAllocationService } from 'src/app/services/allocation.service';
@Component({
  selector: 'app-trade-modify-form',
  templateUrl: './trade-form.component.html',
  styleUrls: ['./trade-form.component.scss'],
})
export class AppTradeModifyFormComponent implements AfterContentInit  {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  public tradeModifyForm: FormGroup;
  tabIndex=1;
  @Input() action: string = 'View';
  @Output() public modal_principal_parent = new EventEmitter();
  @ViewChild('ordersTable',{ static: false }) orderTable : AppOrderTableComponent
  @ViewChild('allocationTable',{ static: false }) allocationTable : AppallocationTableComponent
  public title: string;
  public actionType : string;
  @Input() data: any;
  firstOpenedAccountingDate: Date;
  panelOpenStateFirst = false;
  panelOpenStateSecond = false;
  panellAlocationTable = true;
  panelOrdersAllocated = true;
  filteredCurrenciesList: Observable<string[]>;
  filteredSetCurrenciesList: Observable<string[]>;
  filterednstrumentsLists : Observable<string[]>;
  filteredCounterPartiesList : Observable<string[]>;
  dialogClientsTabletRef: MatDialogRef<AppClientsTableComponent>;
  dialogInstrumentTabletRef: MatDialogRef<AppInstrumentTableComponent>;
  securityTypes: any[];
  formerrors: any;
  private arraySubscrition = new Subscription ()

  constructor (
    private fb:FormBuilder, 
    private AuthServiceS:AuthService,  
    private SelectionService:HandlingTableSelectionService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private TradeService: AppTradeService,
    private AllocationService: AppAllocationService,
    private accountingTradeService: AccountingTradesService,
    private AccountingDataService:AppAccountingService, 
    private AutoCompService:AtuoCompleteService,
    private indexDBServiceS:indexDBService,
    private InstrumentDataS:InstrumentDataService,
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
      fee_trade:[null, { validators: Validators.pattern('[0-9]*([0-9.]{0,3})?$'), updateOn: 'blur' }],
      fee_settlement:[null, { validators: Validators.pattern('[0-9]*([0-9.]{0,3})?$'), updateOn: 'blur' }],
      fee_exchange:[null, { validators: Validators.pattern('[0-9]*([0-9.]{0,3})?$'), updateOn: 'blur' }],
      id_cpty:[null, { validators:  Validators.required, updateOn: 'blur' }],
      id_price_currency:[null],
      id_settlement_currency:[null],
      settlement_rate:[null],
      tidorder:{value:null, disabled: false},
      allocatedqty:{value:0, disabled: false},
      unalloacted:{value:0, disabled: false},
      idportfolio:{value:null, disabled: false},
      id_buyer_instructions:{value:null, disabled: false},id_seller_instructions:{value:null, disabled: false},id_broker:{value:null, disabled: false}, details:{value:null, disabled: false},cpty_name:{value:null, disabled: false},security_group_name :{value:null, disabled: false},   secid_name:{value:null, disabled: false}, trade_amount:[null], facevalue:[null],faceunit:[null],faceunit_name:[null], code_price_currency:[null],  price_currency_name:[null], settlement_currency_name:[null], code_settlement_currency:[null], settlement_amount:[null], coupon_details:[null]
    })
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data => this.firstOpenedAccountingDate = data[0].FirstOpenedDate);
    this.indexDBServiceS.getIndexDBStaticTables('getMoexSecurityTypes').then (data=>this.securityTypes = data['data']);
    this.AutoCompService.getCurrencyList().then(()=>{
      this.id_price_currency.setValidators([this.AutoCompService.currencyValirator(),Validators.required]);
      this.id_price_currency.updateValueAndValidity();
      this.id_settlement_currency.setValidators([this.AutoCompService.currencyValirator(),Validators.required]);
      this.id_settlement_currency.updateValueAndValidity();
      this.faceunit.value? this.faceunit_name.patchValue(this.AutoCompService.getCurrecyData(this.faceunit.value)['CurrencyCode']):null;
      this.checkCurrenciesHints()
    });
    this.AutoCompService.getSecidLists().then (()=>this.tidinstrument.setValidators(this.AutoCompService.secidValirator()) );
    this.AutoCompService.getCounterpartyLists().then (()=>this.id_cpty.setValidators(this.AutoCompService.counterPartyalirator(this.cpty_name)));
  }
  ngOnDestroy(): void {
    this.arraySubscrition.unsubscribe()
  }
  ngAfterContentInit (): void {
    this.tradeModifyForm.patchValue(this.data);
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
    this.price.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>this.fullAmountCalcualtion(false));
    this.qty.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>this.fullAmountCalcualtion(true));
    this.settlement_rate.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>this.settlementAmountUpdate());
    this.vdate.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>this.fullAmountCalcualtion(true));
    this.id_price_currency.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>this.fullAmountCalcualtion(true));
    this.id_settlement_currency.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>{
      this.id_settlement_currency.value? this.settlement_rate.setValidators([ Validators.required, Validators.pattern('[0-9]*([0-9.]{0,8})?$')]): 
      this.settlement_rate.removeValidators(Validators.required);
      this.settlement_rate.updateValueAndValidity();
      this.id_settlement_currency.value !== this.id_price_currency.value&&this.settlement_rate.value==1? this.settlement_rate.patchValue(null) : null;
      this.changeSettlementRate();
    }
    )
    this.action == 'View'? this.disabledControlElements=true:null;
    this.action == 'View'|| this.disabledControlElements?  this.tradeModifyForm.disable() : null;
    this.fullAmountCalcualtion(true);
    this.changeSettlementRate();
  }
  executeOrders () {
    let qtyForAllocation = this.qty.value - this.allocatedqty.value;
    let unexecutedTotal = this.orderTable.selection.selected.map(el=>Number(el.unexecuted)).reduce((acc, val)=> acc+val,0)
    if (qtyForAllocation<1) {
      this.CommonDialogsService.snackResultHandler({name:'error',detail:'The whole trade volume has been allocated!'},'Allocation');
      return;
    };
    if (!unexecutedTotal) {
      this.CommonDialogsService.snackResultHandler({name:'error',detail:'Orders have been allocated!'},'Allocation');
      return;
    };
    let ordersForExecution = this.orderTable.selection.selected.map(el=> Number(el.id));
    if (ordersForExecution.length) {
      this.TradeService.executeOrders(ordersForExecution,Number(qtyForAllocation),this.idtrade.value).subscribe(data=>{
        this.CommonDialogsService.snackResultHandler({name:'sucess',detail:'Orders have been allocated'},'Allocation',undefined,false)
        this.TradeService.sendReloadOrdersForExecution(data,this.idtrade.value,ordersForExecution);
        this.allocationTable.submitQuery(true,false)
        this.allocatedqty.patchValue(Number(this.allocatedqty.value) + Number(data.filter(el=>el['id_joined']==this.idtrade.value)[0].allocated))
      })
    } else {
      this.CommonDialogsService.snackResultHandler({name:'error',detail:'No bulk order has been selected!'},'Allocation');
    }
  } 
  async createAccountingForAllocation () {
    let tradeToConfirm = this.allocationTable.selection.selected;
    let tradeToConfirmProcessStatus = tradeToConfirm.map(el=>{return {id:el.id,bAccountTransaction:1,bLedgerTransaction:1}})
    let portfolioWitoutAccounts = this.allocationTable.selection.selected.filter(trade=>!trade.accountId||!trade.depoAccountId).map(trade=>{return trade.portfolioname});

    let tradesWithAccounting = this.allocationTable.selection.selected.filter(trade=>trade.entries>0).map(trade=>{return trade.id});
    if (tradesWithAccounting.length) {
      this.CommonDialogsService.snackResultHandler({name:'error',detail:'There are created entries for the trades: '+[...tradesWithAccounting]});
      return;
    }
    let depoSubAccountsToOpen = tradeToConfirm.filter(trade=>!trade.depoAccountId).map(trade=>Number(trade.idportfolio));
    console.log('trade',depoSubAccountsToOpen,tradeToConfirm);
    if (depoSubAccountsToOpen.length) {
    await firstValueFrom (this.AccountingDataService.createDepoSubAccounts(depoSubAccountsToOpen,this.tidinstrument.value)).then(newDepoAccounts=>{
      console.log('d',newDepoAccounts);
      newDepoAccounts.forEach (depoAccount=>{ 
        let i =tradeToConfirm.findIndex(el=>el.idportfolio==depoAccount.idportfolio);
        i!==-1? tradeToConfirm[i].depoAccountId=depoAccount.accountId:null;
      })
    })}
    console.log('tradeToConfirm',...tradeToConfirm);
    if (portfolioWitoutAccounts.length) {
      this.CommonDialogsService.snackResultHandler({name:'error',detail:'There are no opened current or depo accounts for the portfolios: '+[...portfolioWitoutAccounts]});
      return;
    }
    let bcEntryParameters = <any> {}
    let createdEntries = <bAccountTransaction[]>[]
    let createdLLEntries = <bLedgerTransaction[]>[]
    tradeToConfirm.forEach(clientTrade => {
      bcEntryParameters.id_settlement_currency=this.id_settlement_currency.value;
      bcEntryParameters.cptyCode='CHASUS';
      bcEntryParameters.pDate_T=new Date(this.tdate.value).toDateString();
      bcEntryParameters.pAccountId=clientTrade.accountId;
      bcEntryParameters.pDepoAccountId=clientTrade.depoAccountId;
      bcEntryParameters.pQty=clientTrade.qty;
      bcEntryParameters.pSettlementAmount=clientTrade.trade_amount;
      bcEntryParameters.secid=this.tidinstrument.value;
      bcEntryParameters.allocated_trade_id=clientTrade.id;
      bcEntryParameters.idtrade=this.idtrade.value;
    this.accountingTradeService.getAccountingScheme(bcEntryParameters,'Investment_Buy_Basic').pipe(
      map(entryDrafts=>entryDrafts.forEach(draft=>this.AccountingDataService.updateEntryAccountAccounting (draft,'Create',).subscribe(el=>createdEntries.push(...el))))
    ).subscribe (result => {
      let index = tradeToConfirmProcessStatus.findIndex(el=>el.id===clientTrade.id);
      index!==-1? tradeToConfirmProcessStatus[index].bAccountTransaction=0 : null;
      this.createAllocationAccountingStatus(tradeToConfirmProcessStatus,'AL');
    })
    this.accountingTradeService.getAccountingScheme(bcEntryParameters,'Investment_Buy_Basic','LL').pipe(
      map(entryDrafts=>entryDrafts.forEach(draft=>this.AccountingDataService.updateLLEntryAccountAccounting (draft,'Create',).subscribe(el=>createdLLEntries.push(...el))))
    ).subscribe (result => {
      let index = tradeToConfirmProcessStatus.findIndex(el=>el.id===clientTrade.id);
      index!==-1? tradeToConfirmProcessStatus[index].bLedgerTransaction=0 : null;

      this.createAllocationAccountingStatus(tradeToConfirmProcessStatus,'LL')
    })
    })
    this.allocationTable.selection.clear();
  }
  createAllocationAccountingStatus (tradeToConfirmProcessStatus:{id:number,bAccountTransaction:number,bLedgerTransaction:number}[],type:string) {
    let status = tradeToConfirmProcessStatus.reduce((acc,val)=>acc+val.bAccountTransaction+val.bLedgerTransaction,0)
    status===0? this.allocationTable.submitQuery(true,false).then(data=>{
      this.CommonDialogsService.snackResultHandler({name:'success',detail:'Accounting has been created'},'Allocation Accounting',undefined,false)
    }):null;
  }
  deleteAccountingForAllocatedTrades () {
    this.AllocationService.deleteAccountingForAllocatedTrades(this.allocationTable);
/*     let tradesToDelete = this.allocationTable.selection.selected.map(trade=>Number(trade.id))
    if (!tradesToDelete.length) {
      return this.CommonDialogsService.snackResultHandler({name:'error',detail:'No trades are selected to be deleted'},'DeleteAllocation')
    }
    this.CommonDialogsService.confirmDialog('Delete accouting for allocated trades ').pipe(
      filter (isConfirmed => isConfirmed.isConfirmed),
      switchMap(data => this.AccountingDataService.deleteAllocationAccounting (tradesToDelete))
    ).subscribe (deletedTrades=>{
      this.allocationTable.selection.clear();
      this.CommonDialogsService.snackResultHandler({name:'success',detail:deletedTrades.length + ' entries have been deleted'},'Delete accounting: ',null,false)
      this.allocationTable.submitQuery(true, false);
    })  */
  }
  deleteAllocatedTrades (){
    let tradesToDelete=this.allocationTable.selection.selected.filter(el=>!el.entries)
    if (tradesToDelete.length!==this.allocationTable.selection.selected.length) {
      this.CommonDialogsService.snackResultHandler({name:'error',detail:'Trades with entries have been selected. Accounted trades can not be deleted'},'Allocated trades delete',null,false);
      return;
    }
    if (!this.allocationTable.selection.selected.length) {
      return this.CommonDialogsService.snackResultHandler({name:'error',detail:'No trades are selected to be deleted'},'DeleteAllocation')
    }
    this.CommonDialogsService.confirmDialog('Delete allocated trades ').pipe(
      filter (isConfirmed => isConfirmed.isConfirmed),
      switchMap(data => this.TradeService.deleteAllocatedTrades(this.allocationTable.selection.selected.map(el=>Number(el.id))))
    ).subscribe (deletedTrades=>{
      this.allocationTable.selection.clear();
      this.CommonDialogsService.snackResultHandler({name:'success',detail:deletedTrades.length+' have been deleted'},'Delete allocated trades: ',undefined,false)
      this.allocatedqty.patchValue(
        Number(this.allocatedqty.value)-deletedTrades.map(el=>el.idtrade==this.idtrade.value? el.qty:null).reduce((acc, value) => acc + Number(value), 0)
        );
      this.TradeService.sendNewAllocatedQty({idtrade:this.idtrade.value,allocatedqty:this.allocatedqty.value})
      this.TradeService.sendDeletedAllocationTrades(deletedTrades)
      this.orderTable.submitQuery(true, false).then(()=>this.orderTable.filterForAllocation())
    })
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
  selectSecID (){
    this.dialogInstrumentTabletRef = this.dialog.open(AppInstrumentTableComponent ,{minHeight:'400px', minWidth:'90vw', autoFocus: false, maxHeight: '90vh'});
    this.dialogInstrumentTabletRef.componentInstance.FormMode = 'Select';
    this.dialogInstrumentTabletRef.componentInstance.modal_principal_parent.subscribe ((item:Instruments )=>{
      this.secidChanged(item)
      this.dialogInstrumentTabletRef.close(); 
    });
  }  
  secidAutocolmplete (secidDesc:string) {
    let secidArr = secidDesc.split(' - ');
    let instrument = {name:'',security_type_name:'',faceunit:'',facevalue:0,secid:''}  ;
    instrument.name = secidArr[1];
    instrument.security_type_name=secidArr[2];
    instrument.faceunit = !Number.isNaN(+secidArr[3])? secidArr[3] :'810';
    instrument.facevalue=Number(secidArr[4])
    instrument.secid=secidArr[0];
    this.secidChanged(instrument)
  }
  secidChanged (item:any) {
    this.tidinstrument.patchValue(item.secid)
    this.secid_name.patchValue(item.name+' ('+item.security_type_name+')')
    this.price_type.patchValue(this.securityTypes.filter(el=>el['security_type_name']===item.security_type_name)[0]['price_type'])
    this.facevalue.patchValue(item.facevalue)
    this.faceunit.patchValue(item.faceunit)
    this.faceunit.value? this.faceunit_name.patchValue(this.AutoCompService.getCurrecyData(this.faceunit.value)['CurrencyCode']):null;
    this.id_price_currency.patchValue( this.price_type.value==2? this.faceunit.value : null);
    this.id_settlement_currency.patchValue( this.price_type.value==2? this.faceunit.value : null);
    this.price_type.value==2? this.checkCurrenciesHints() : this.clearCurrencies();
    this.fullAmountCalcualtion(true);
  }
  clearCurrencies(): any {
    ['code_price_currency', 'price_currency_name', 'code_settlement_currency','settlement_currency_name','settlement_rate'].forEach(key => this.tradeModifyForm.get(key).patchValue(null))
  }
  checkCurrenciesHints (){
    if (this.id_price_currency.value) {  
      let el_price_currency = this.AutoCompService.getCurrecyData(this.id_price_currency.value)
      this.code_price_currency.patchValue(el_price_currency['CurrencyCode'])
      this.price_currency_name.patchValue(el_price_currency['CurrencyName'])
    }
    if (this.id_settlement_currency.value) {
      let el_settlement_currency = this.AutoCompService.getCurrecyData(this.id_settlement_currency.value)
      this.code_settlement_currency.patchValue(el_settlement_currency['CurrencyCode'])
      this.settlement_currency_name.patchValue(el_settlement_currency['CurrencyName'])
    }
  } 
  changeSettlementRate () {
    if (this.id_price_currency.value === this.id_settlement_currency.value) {
      this.settlement_rate.patchValue(1)
      this.settlement_rate.disable();
      this.settlement_amount.patchValue(this.trade_amount.value)
    } else {
        this.settlement_rate.enable();
        this.settlement_rate.value===1? this.settlement_rate.patchValue(null) : null;
    }   
  }
  settlementAmountUpdate() {
    if (this.id_settlement_currency.valid&&this.id_settlement_currency.valid&&Number(this.settlement_rate.value)) {
      this.settlement_amount.patchValue((Number(this.trade_amount.value)*Number(this.settlement_rate.value)).toFixed(2))
    } else { 
      this.settlement_amount.patchValue(!this.id_settlement_currency.value? this.trade_amount.value : 'Error');
    }
  }
  tradeAmountsUpdate() {
    switch (this.price_type.value) {
      case '2':
        this.trade_amount.patchValue(Number(this.price.value/100*this.qty.value*this.facevalue.value)+Number(this.accured_interest.value))
      break;
      case '1':
        this.trade_amount.patchValue(this.id_price_currency.value? this.price.value*this.qty.value:0*this.qty.value);
        this.accured_interest.patchValue(0);
      break;
    }
    this.changeSettlementRate ()
    this.settlementAmountUpdate();
  }
  fullAmountCalcualtion(accured_interest_update:boolean) {
    if (this.price_type.value==='2'&&accured_interest_update) {
      this.InstrumentDataS.getcouponPeriodInfo(this.vdate.value,this.tidinstrument.value,this.facevalue.value,this.qty.value).subscribe (coupon=>{ 
        this.coupon_details.patchValue(coupon.couponDetails);
        this.accured_interest.patchValue(coupon.accuredInterest);
        this.tradeAmountsUpdate();
      })
    } else {this.tradeAmountsUpdate()}
  }
  updateInstrumentData(action:string){
    let srDisabled = this.settlement_rate.disabled? this.settlement_rate.enable() : false
    if (this.tradeModifyForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.TradeService.updateTrade(this.tradeModifyForm.value,'Create').subscribe(result =>this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.TradeService.updateTrade (this.tradeModifyForm.value,'Edit').subscribe(result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Trade ID  ' + this.idtrade.value).pipe(
          filter (isConfirmed => isConfirmed.isConfirmed),
          switchMap(data => this.TradeService.updateTrade (this.tradeModifyForm.value,'Delete'))
        ).subscribe (result =>this.snacksBox(result,'Deleted'));
      break;
    }
    srDisabled? this.settlement_rate.disable():null;

  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.dialogCloseAll();
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + ' instrument'}, action)
      this.TradeService.getTradeInformation({idtrade:result[0].idtrade}).subscribe(
        data=>this.TradeService.sendTradeDataToUpdateTableSource(action==='Deleted'? result:data,action)
      );
    }
  }
  showErrors () {
    Object.entries(this.tradeModifyForm.controls).forEach(el=>el[1].errors? console.log(el[0],el[1].errors):null)
   }
  toggleAllRows(dataSource:MatTableDataSource<orders|allocation>,selection:SelectionModel<orders|allocation>, forceSelectAll:boolean=false) { 
    return this.SelectionService.toggleAllRows(dataSource, selection,forceSelectAll);
  }
  isAllSelected() { return this.SelectionService.isAllSelected(this.orderTable.dataSource, this.orderTable.selection)}  
  fNumber (value) { return Number(value)}
  get idtrade() {return this.tradeModifyForm.get('idtrade')}
  get trtype() {return this.tradeModifyForm.get('trtype')}
  get qty() {return this.tradeModifyForm.get('qty')}
  get price() {return this.tradeModifyForm.get('price')}
  get accured_interest() {return this.tradeModifyForm.get('accured_interest')} 
  get fee_trade() {return this.tradeModifyForm.get('fee_trade')} 
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
  get coupon_details() {return this.tradeModifyForm.get('coupon_details')}
  get allocatedqty() {return this.tradeModifyForm.get('allocatedqty')}
}