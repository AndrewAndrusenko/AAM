import { AfterViewInit, Component,  EventEmitter,  Input, OnInit, Output, SimpleChanges, ViewChild,  } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { Instruments, instrumentCorpActions, instrumentDetails } from 'src/app/models/accounts-table-model';
import { TableAccounts } from '../../tables/app-table-accout/app-table-portfolio.component';
import { Subscription } from 'rxjs';
import { MatTabGroup as MatTabGroup } from '@angular/material/tabs';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { menuColorGl } from 'src/app/models/constants';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-inv-instrument-modify-form',
  templateUrl: './app-inv-instrument-modify-form.html',
  styleUrls: ['./app-inv-instrument-modify-form.scss'],
})
export class AppInvInstrumentModifyFormComponent implements OnInit, AfterViewInit {

  public panelOpenState = true;
  public instrumentModifyForm: FormGroup;
  public instrumentDetailsForm: FormGroup;
  @Input() action: string;
  @Input() moexBoards = []
  @Input() secidParam:string;
  instrumentDetails:instrumentDetails[] = [];
  instrumentCorpActions:instrumentCorpActions[] = [];
  dialogChoseAccount: MatDialogRef<TableAccounts>;
  @Output() public modal_principal_parent = new EventEmitter();
  public title: string;
  public actionType : string;
  public data: any;
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  formDisabledFields: string[] = [];
  private subscriptionName: Subscription
  panelOpenStateFirst = false;
  panelOpenStateSecond = false;
  menuColorGl=menuColorGl
  securityTypes: any[];
  securityTypesFiltered: any[];
  securityGroups: any;

  constructor (
    private fb:FormBuilder, 
    private dialog: MatDialog, 
    private AccountingDataService:AppAccountingService, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private MarketDataService: AppMarketDataService,

  ) 
  { 
    this.formDisabledFields = ['clientId', 'accountId', 'idportfolio']
    this.instrumentModifyForm = this.fb.group ({
      id : {value:null, disabled: false},
      secid:  {value:null, disabled: false}, 
      security_type_title:  {value:null, disabled: false},
      security_group_name:  {value:null, disabled: false}, 
      security_type_name:  {value:null, disabled: false}, 
      shortname:  {value:null, disabled: false}, 
      primary_boardid:  {value:null, disabled: false}, 
      board_title:  {value:null, disabled: false}, 
      title:  {value:null, disabled: false},
      category:  {value:null, disabled: false}, 
      name:  {value:null, disabled: false}, 
      isin:  {value:null, disabled: false}, 
      emitent_title:  {value:null, disabled: false}, 
      emitent_inn:  {value:null, disabled: false}, 
      type:  {value:null, disabled: false}, 
      group:  {value:null, disabled: false}, 
      marketprice_boardid:  {value:null, disabled: false},
      group_title:  {value:null, disabled: false}
    })
    this.instrumentDetailsForm = this.fb.group ({
      secid: {value:null, disabled: false}, boardid: {value:null, disabled: false}, shortname: {value:null, disabled: false}, lotsize: {value:null, disabled: false}, facevalue: {value:null, disabled: false}, status: {value:null, disabled: false}, boardname: {value:null, disabled: false}, decimals: {value:null, disabled: false}, matdate: {value:null, disabled: false}, secname: {value:null, disabled: false}, couponperiod: {value:null, disabled: false}, issuesize: {value:0, disabled: false}, remarks: {value:null, disabled: false}, marketcode: {value:null, disabled: false}, instrid: {value:null, disabled: false}, sectorid: {value:null, disabled: false}, minstep: {value:null, disabled: false}, faceunit: {value:null, disabled: false}, isin: {value:null, disabled: false}, latname: {value:null, disabled: false}, regnumber: {value:null, disabled: false}, currencyid: {value:null, disabled: false}, sectype: {value:null, disabled: false}, listlevel: {value:null, disabled: false}, issuesizeplaced: {value:null, disabled: false}, couponpercent: {value:null, disabled: false}, lotvalue: {value:null, disabled: false}, nextcoupon: {value:null, disabled: false}, issuevolume:{value:null, disabled: true}
    })
  }
  ngOnInit(): void {
    this.title = this.action;
    this.secidParam?  this.MarketDataService.getMoexInstruments(undefined,undefined, {secid:[this.secidParam,this.secidParam]}).subscribe (instrumentData => {
      this.MarketDataService.getInstrumentDataGeneral('getBoardsDataFromInstruments').subscribe(dataBoard => {
        this.moexBoards = dataBoard;
        console.log('boards',this.moexBoards);
      });
      this.instrumentModifyForm.patchValue(instrumentData[0]);

    }) :null;  
    this.MarketDataService.getInstrumentDataGeneral('getMoexSecurityTypes').subscribe(securityTypesData => {
      this.securityTypes = securityTypesData;
      this.filtersecurityType(this.group.value)
    })
    
    this.MarketDataService.getInstrumentDataGeneral('getMoexSecurityGroups').subscribe(securityGroupsData => this.securityGroups = securityGroupsData );
    switch (this.action) {
      case 'Create': 
      break;
      case 'Create_Example':
        this.instrumentModifyForm.patchValue(this.data)
        this.title = 'Create';
        break;
        default :
        this.instrumentModifyForm.patchValue(this.data)
      break;
    } 
    if (this.action == 'View') {
      this.instrumentModifyForm.disable();
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    this.MarketDataService.getMoexInstruments(undefined,undefined, {secid:[changes['secidParam'].currentValue,changes['secidParam'].currentValue]}).subscribe (instrumentData => {
      this.instrumentModifyForm.patchValue(instrumentData[0]);
      this.filtersecurityType(this.group.value)
      this.MarketDataService.getInstrumentDataCorpActions(instrumentData[0].isin).subscribe(instrumentCorpActions => {
        this.MarketDataService.sendCorpActionData(instrumentCorpActions)
      })
    });  
    this.MarketDataService.getInstrumentDataDetails(changes['secidParam'].currentValue).subscribe(instrumentDetails => this.instrumentDetailsForm.patchValue(instrumentDetails[0]));
  }
  ngAfterViewInit(): void {
    this.instrumentDetailsForm.patchValue(this.instrumentDetails[0])
  }
  filtersecurityType (filter:string) {
    this.securityTypesFiltered = this.securityTypes.filter (elem => elem.security_group_name===filter)
  }
  selectPortfolio () {

  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + ' instrument'}, action)
      this.AccountingDataService.sendReloadAccontList (this.instrumentModifyForm.controls['id']);
    }
    this.formDisabledFields.forEach(elem => this.instrumentModifyForm.controls[elem].disable())
  }
  addJoinedFieldsToResult (result:Instruments[]):Instruments[] {
    result[0].board_title = this.moexBoards.find(el=>el.boardid===result[0].primary_boardid).board_title;
    result[0].security_type_title = this.securityTypes.find(el=>el.security_type_name===result[0].type).security_type_title
    return result;
  }
  updateInstrumentData(action:string){
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.MarketDataService.createInstrument(this.instrumentModifyForm.value).then(result => {
          this.MarketDataService.sendInstrumentData(this.addJoinedFieldsToResult(result),'Created')
          this.snacksBox(result.length,'Created');
        })
      break;
      case 'Edit':
        this.MarketDataService.updateInstrument (this.instrumentModifyForm.value).then(result => {
          this.MarketDataService.sendInstrumentData(this.addJoinedFieldsToResult(result),'Updated')
          this.snacksBox(result.length,'Updated')
        })
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Instrument ' + this.secid.value).subscribe(isConfirmed => {
          if (isConfirmed.isConfirmed) {
            this.instrumentModifyForm.controls['id'].enable()
            this.MarketDataService.deleteInstrument (this.instrumentModifyForm.value['id']).then (result =>{
              this.MarketDataService.sendInstrumentData(result,'Deleted')
              this.snacksBox(result.length,'Deleted')
              this.CommonDialogsService.dialogCloseAll();
            })
          }
        })
      break;
    }
  }

  get  secid() {return this.instrumentModifyForm.get('secid')}​
  get  security_type_title() {return this.instrumentModifyForm.get('security_type_title')}​
  get  shortname ()   {return this.instrumentModifyForm.get('shortname') } 
  get  isin ()   {return this.instrumentModifyForm.get('isin') } 
  get  primary_boardid ()   {return this.instrumentModifyForm.get('primary_boardid') } 
  get  board_title ()   {return this.instrumentModifyForm.get('board_title') } 
  get  name ()   {return this.instrumentModifyForm.get('name') } 
  get  emitent_inn ()   {return this.instrumentModifyForm.get('emitent_inn') }
  get  security_group_name ()   {return this.instrumentModifyForm.get('security_group_name') }
  get  security_type_name ()   {return this.instrumentModifyForm.get('security_type_name') }
  get  group ()   {return this.instrumentModifyForm.get('group') }
  
  get  issuesize ()   {return this.instrumentDetailsForm.get('issuesize') } 
  get  facevalue ()   {return this.instrumentDetailsForm.get('facevalue') } 
  get  lotsize ()   {return this.instrumentDetailsForm.get('lotsize') } 
  get  issuevolume ()   {return this.instrumentDetailsForm.get('issuevolume') } 
  
}