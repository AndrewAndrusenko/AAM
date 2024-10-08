import { Component,  EventEmitter,  Input, Output, SimpleChanges} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { instrumentDetails, moexBoard } from 'Frontend-Angular-Src/app/models/instruments.interfaces';
import { filter, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { indexDBService } from 'Frontend-Angular-Src/app/services/indexDB.service';
import { InstrumentDataService } from 'Frontend-Angular-Src/app/services/instrument-data.service';

@Component({
  selector: 'app-instrument-details-form',
  templateUrl: './instrument-details-form.component.html',
  styleUrls: ['./instrument-details-form.component.scss'],
})
export class AppInvInstrumentDetailsFormComponent {
  public instrumentDetailsForm: FormGroup;
  @Input() action: string;
  @Input() moexBoards:moexBoard[] = []
  @Input() secidParam:string;
  instrumentDetails:instrumentDetails[] = [];
  @Output() public modal_principal_parent = new EventEmitter();
  public title: string;
  @Input() data: instrumentDetails;
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private InstrumentDataS:InstrumentDataService,
    private indexDBServiceS: indexDBService,
  ) 
  {  
    this.instrumentDetailsForm = this.fb.group ({
      status: {value:null, disabled: false},
      boardid:  [null, { validators:  Validators.required, updateOn: 'blur' }], 
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
      marketcode: {value:null, disabled: false},
      secid: {value:null, disabled: false},
      id: {value:null, disabled: false}
    })
   }
  ngOnInit(): void {
    this.indexDBServiceS.getIndexDBStaticTables('getBoardsDataFromInstruments').subscribe (data=>this.moexBoards=(data.data as moexBoard[]))
  }
  ngAfterContentInit(): void {
    this.title = this.action;
    switch (this.action) {
      case 'Create': 
        this.secid.patchValue(this.secidParam);
      break;
      case 'Create_Example':
        this.instrumentDetailsForm.patchValue(this.data);
        this.title = 'Create';
      break;
      default:
        this.instrumentDetailsForm.patchValue(this.data);
      break; 
    } 
  }
  ngOnChanges(changes: SimpleChanges) {
    this.InstrumentDataS.getMoexInstruments(undefined,undefined, {secid:[changes['secidParam'].currentValue,changes['secidParam'].currentValue]}).subscribe (instrumentData => {
      this.instrumentDetailsForm.patchValue(instrumentData[0]);
      this.InstrumentDataS.getInstrumentDataCorpActions(instrumentData[0].isin).subscribe(instrumentCorpActions => {
        this.InstrumentDataS.sendCorpActionData(instrumentCorpActions)
      })
    });  
    this.InstrumentDataS.getInstrumentDataDetails(changes['secidParam'].currentValue).subscribe(instrumentDetails => this.instrumentDetailsForm.patchValue(instrumentDetails[0]));
  }
  snacksBox(result:{name:string,detail:string}|instrumentDetails[], action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: (result as instrumentDetails[]).length + ' instrument details'}, action,undefined,false)
      this.InstrumentDataS.sendReloadInstrumentDetails(result as instrumentDetails[])
      this.modal_principal_parent.emit(true)
    }
  }
  updateInstrumentData(action:string){
    this.instrumentDetailsForm.updateValueAndValidity();
    if (this.instrumentDetailsForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.InstrumentDataS.updateInstrumentDetails(this.instrumentDetailsForm.value,'Create').subscribe(result => this.snacksBox(result))
      break;
      case 'Edit':
        this.InstrumentDataS.updateInstrumentDetails (this.instrumentDetailsForm.value,'Edit').subscribe(result => this.snacksBox(result))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Instrument Details ' + this.boardid.value).pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(data => this.InstrumentDataS.updateInstrumentDetails(this.instrumentDetailsForm.value,'Delete'))
        ).subscribe(result => this.snacksBox(result,'Deleted'))
      break;
    }
  }
  get  status() {return this.instrumentDetailsForm.get('status')}
  get  boardid() {return this.instrumentDetailsForm.get('boardid')}
  get  boardname () {return this.instrumentDetailsForm.get('boardname') } 
  get  listlevel () {return this.instrumentDetailsForm.get('listlevel') } 
  get  matdate () {return this.instrumentDetailsForm.get('matdate') } 
  get  regnumber () {return this.instrumentDetailsForm.get('regnumber') } 
  get  currencyid () {return this.instrumentDetailsForm.get('currencyid') } 
  get  minstep () {return this.instrumentDetailsForm.get('minstep') }
  get  decimals () {return this.instrumentDetailsForm.get('decimals') }
  get  issuesize () {return this.instrumentDetailsForm.get('issuesize') } 
  get  facevalue () {return this.instrumentDetailsForm.get('facevalue') } 
  get  lotsize () {return this.instrumentDetailsForm.get('lotsize') } 
  get  issuevolume () {return this.instrumentDetailsForm.get('issuevolume') } 
  get  secid () {return this.instrumentDetailsForm.get('secid') } 
  get  remarks () {return this.instrumentDetailsForm.get('remarks') } 
  get  marketcode () {return this.instrumentDetailsForm.get('marketcode') } 
  get  isin () {return this.instrumentDetailsForm.get('isin') } 
}
