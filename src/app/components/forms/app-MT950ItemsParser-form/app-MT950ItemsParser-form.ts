import { Component,  Input, OnInit, SimpleChanges,  } from '@angular/core';
import { FormBuilder, FormControl, FormGroup,  ValidationErrors,  Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { MatSnackBar} from '@angular/material/snack-bar';
import { bcTransactionType_Ext, StrategiesGlobalData } from 'src/app/models/accounts-table-model';
import { AppInstrumentTableComponent } from '../../tables/app-table-instrument/app-table-instrument.component';
import { AppAccountingService } from 'src/app/services/app-accounting.service';

@Component({
  selector: 'app-MT950ItemsParser-form',
  templateUrl: './app-MT950ItemsParser-form.html',
  styleUrls: ['./app-MT950ItemsParser-form.css'],
})
export class AppMT950ItemParsing implements OnInit {
  public swift950Entry=this.fb.group ({
    xActTypeCode_Ext: 'DP',

    allocatedAmount: '20 00 000 000',
      EntryDate: '23/02/2023',
      Debit: '40820PMIKES001',
      Credit: '30114BCHASU001',
      Details:' Incoming payment ${pSenderBIC:raw} to with ref: ${pRef:raw}   '
    })
  @Input() action: string;
  @Input() strategyId: string;
  @Input() MP: boolean;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  isEditForm: boolean = false;
  dialogRef: MatDialogRef<AppInstrumentTableComponent>;
  dtOptions: any = {};
  MPnames: StrategiesGlobalData [] = [];
  public fullInstrumentsLists :string [] =[];
  public actionType : string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  public showStrateryStructure: boolean;
  public data: any;
  TransactionTypes: bcTransactionType_Ext[] = [];
  constructor (
    private fb:FormBuilder, 
    private AccountingDataService:AppAccountingService, 
    private dialog: MatDialog, 
    public snack:MatSnackBar,
    
  ) {}
  
  ngOnInit(): void {
    this.AccountingDataService.GetTransactionType_Ext(null,null,null,null,'bcTransactionType_Ext').subscribe (data => { this.TransactionTypes=data;
     } )

  }

  ngOnChanges(changes: SimpleChanges) {
  console.log('950 form SimpleChanges', changes);
  }
  ftEntryCreate () {
    console.log('dd', 'ftEntryCreate');
    let data:any;
    // this.AccountingDataService.createEntryTest(data).then ( (result) => {console.log('rers', result) })
  }
  
/*   get  id ()   {return this.editStructureStrategyForm.get('id') } 
  get  sname ()   {return this.editStructureStrategyForm.get('sname') } 
  get  description ()   {return this.editStructureStrategyForm.get('description') } 
  get  weight_of_child ()   {return this.editStructureStrategyForm.get('weight_of_child') }  */

}