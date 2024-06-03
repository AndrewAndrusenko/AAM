import { Component,  EventEmitter,  Input, Output} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../common-forms/app-confim-action/app-confim-action.component';
import { marketData } from 'src/app/models/interfaces.model';
import { distinctUntilChanged, filter, map, Observable, startWith, switchMap } from 'rxjs';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AppInstrumentTableComponent } from '../../tables/instrument-table.component/instrument-table.component';
import { moexBoard } from 'src/app/models/instruments.interfaces';
import { AppMarketDataService } from 'src/app/services/market-data.service';

@Component({
  selector: 'app-market-quote-manual-form',
  templateUrl: './market-quote-manual-form.component.html',
  styleUrls: ['./market-quote-manual-form.component.css'],
})
export class AppMarketQuoteManualFormComponent {
  public manualQuoteEdit=this.fb.group ({
    secid:['', { validators:[Validators.required]}],
    tradedate:[new Date().toDateString(), {validators: [Validators.required]}],
    close:[0, { validators:[Validators.required,Validators.pattern('[0-9]*([0-9.]{0,6})?$')], updateOn: 'blur' }],
    open:[0, { validators:Validators.pattern('[0-9]*([0-9.]{0,6})?$'), updateOn: 'blur' }],
    high:[0, { validators:Validators.pattern('[0-9]*([0-9.]{0,6})?$'), updateOn: 'blur' }],
    low:[0, { validators:Validators.pattern('[0-9]*([0-9.]{0,6})?$'), updateOn: 'blur' }],
    volume:[0, { validators:Validators.pattern('[0-9]*([0-9.]{0,3})?$'), updateOn: 'blur' }],
    sourcecode:'',
    boardid:['', { validators:[Validators.required]}],
    globalsource:'Manual',
    id:0
  })
  @Input() action: string = 'Create'
  @Input() data: marketData
  @Input() moexBoards: moexBoard[]
  @Input() marketSergements:{code:string,name:string}[];
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  dialogRef: MatDialogRef<AppInstrumentTableComponent>;
  @Output() public modal_principal_parent = new EventEmitter();
  public filterednstrumentsLists : Observable<string[][]>;
  constructor (
    private fb:FormBuilder, 
    private MarketDataService: AppMarketDataService,
    private AutoCompService:AtuoCompleteService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private dialog: MatDialog, 
  ) {
    this.AutoCompService.getSecidLists();
    this.secid.setValidators(this.AutoCompService.secidValirator());
    this.filterednstrumentsLists = this.secid.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged(),
      map(value => this.AutoCompService.filterList(value || '','secid') as string[][])
    );
  }
  ngOnInit(): void {
    this.manualQuoteEdit.patchValue(this.data)    
  }
  updateMarketQuote(action:string){
    this.manualQuoteEdit.updateValueAndValidity();
    let data = this.manualQuoteEdit.getRawValue()
    data.tradedate = new Date(this.tradedate.value).toDateString()
    if (this.manualQuoteEdit.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.MarketDataService.updateMarketQuotes (data,'Create').subscribe(result => this.CommonDialogsService.snackResultHandler(
          {name:'succcess',detail:result.length+ ' market quote'},'Added'))
      break;
      case 'Edit':
        this.MarketDataService.updateMarketQuotes (data,'Edit').subscribe(result =>this.CommonDialogsService.snackResultHandler(
          {name:'succcess',detail:result.length+ ' market quote'},'Edited'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: Market Quote SecID: '+this.secid.value+' for: '+new Date(this.tradedate.value).toLocaleDateString(),'Delete').pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(() => this.MarketDataService.updateMarketQuotes(data,'Delete'))
        ).subscribe(result => this.CommonDialogsService.snackResultHandler( {name:'succcess',detail:result.length+ ' market quote'},'Deleted'))
      break;
    }
  }
  selectInstrument () {
    this.dialogRef = this.dialog.open(AppInstrumentTableComponent ,{minHeight:'400px', minWidth:'90vw', autoFocus: false, maxHeight: '90vh'});
    this.dialogRef.componentInstance.FormMode="Select";
    this.dialogRef.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.secid.patchValue(item.secid)
      this.dialogRef.close(); 
    });
  }
  get  secid ()   {return this.manualQuoteEdit.get('secid') } 
  get  boardid ()   {return this.manualQuoteEdit.get('boardid') } 
  get  close ()   {return this.manualQuoteEdit.get('close') } 
  get  low ()   {return this.manualQuoteEdit.get('low') } 
  get  high ()   {return this.manualQuoteEdit.get('high') } 
  get  volume ()   {return this.manualQuoteEdit.get('volume') } 
  get  tradedate ()   {return this.manualQuoteEdit.get('tradedate') } 
  get  id ()   {return this.manualQuoteEdit.get('id') } 

}