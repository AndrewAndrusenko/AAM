import { Component,  Input, OnInit, SimpleChanges,  } from '@angular/core';
import { FormBuilder, FormControl, FormGroup,  Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { MatSnackBar} from '@angular/material/snack-bar';
import { StrategynameValidator } from 'src/app/services/UniqueClientName';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { TableAccounts } from '../../tables/app-table-accout/app-table-accout.component';
import { StrategiesGlobalData } from 'src/app/models/accounts-table-model';
import { formatPercent } from '@angular/common';
interface strategy_structure {
  id: number;
  sname: string;
  description: string;
  weight_of_child: number;
  id_item:number;
}

@Component({
  selector: 'app-structure-strategy-form',
  templateUrl: './app-structure-strategy-form.html',
  styleUrls: ['./app-structure-strategy-form.css'],
})
export class AppStructureStrategyFormComponent implements OnInit {
  public editStructureStrategyForm: FormGroup;
  @Input() action: string;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  isEditForm: boolean = false;
  dialogRef: MatDialogRef<TableAccounts>;
  dtOptions: any = {};
  MPnames: StrategiesGlobalData [] = [];
  public title: string;
  public actionType : string;
  public strategyId : any;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  public showStrateryStructure: boolean;
  public data: any;
  constructor (
    private fb:FormBuilder, private InvestmentDataServiceService:AppInvestmentDataServiceService, private dialog: MatDialog, public snack:MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.editStructureStrategyForm=this.fb.group ({
      id: {value:''},
      sname: [null, { updateOn: 'blur'} ],
      description: {value:'', disabled: true}, 
      weight_of_child: {value:'', disabled: false},
      id_item: {value:'', disabled: false},
    })
   switch (this.action) {
    case 'Create': 
    break;
    case 'Create_Example':
      console.log('id',this.strategyId);
      this.data['id']='';
      this.editStructureStrategyForm.patchValue(this.data);
      this.sname.markAsTouched();
    break;
    case 'Delete': 
    console.log('data',this.data);
      this.editStructureStrategyForm.patchValue(this.data);
    break;
    default :
      this.editStructureStrategyForm.patchValue(this.data);
      this.title = "Edit"
      this.editStructureStrategyForm.patchValue(this.data);
    break; 
   }  
  this.InvestmentDataServiceService.getGlobalStategiesList (0,'','Get_ModelPortfolios_List').subscribe (data => {
    this.MPnames = data;
  })
  this.editStructureStrategyForm.controls['id'].addValidators ( [Validators.required])
  this.editStructureStrategyForm.controls['weight_of_child'].addValidators ( [Validators.required, Validators.pattern('[0-9]*')])
  }

  updateStrategyStructureData (action:string){
    console.log('action',action);
    switch (action) {
     
      case 'Create_Example':
      case 'Create':
        this.editStructureStrategyForm.addControl('id_strategy_parent',new FormControl(this.strategyId, Validators.required))
        this.InvestmentDataServiceService.createStrategyStructure (this.editStructureStrategyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Created: ' + result + ' strategy','OK',{panelClass: ['snackbar-success'], duration: 3000})
            this.dialog.closeAll();
          }
        })
      break;

      case 'Edit':
        this.editStructureStrategyForm.addControl('id_strategy_parent',new FormControl(this.strategyId, Validators.required))
        this.InvestmentDataServiceService.updateStrategyStructure (this.editStructureStrategyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Updated: ' + result + ' strategy','OK',{panelClass: ['snackbar-success'], duration: 3000})
            this.dialog.closeAll();

          }
        })
      break;

      case 'Delete':
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
        this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Delete Item' ,'isConfirmed': false}
        this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
          if (actionToConfim.isConfirmed===true) {
          this.InvestmentDataServiceService.deleteStrategyStructure (this.editStructureStrategyForm.value['id_item']).then ((result) =>{
            if (result['name']=='error') {
              this.snack.open('Error: ' + result['detail'],'OK',{panelClass: ['snackbar-error']} ) 
            } else {
              this.snack.open('Deleted: ' + result + 'item','OK',{panelClass: ['snackbar-success'], duration: 3000})
              this.dialog.closeAll();
            }
          })
          }
        })
      break;
    }
  }

  selectBenchmarkAccount () {
    this.dialogRef = this.dialog.open(TableAccounts ,{minHeight:'400px', minWidth:'900px' });
    this.dialogRef.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.dialogRef.componentInstance.expandedElement
      console.log('close',item, this.dialogRef.componentInstance.currentAccout);
      console.log(this.dialogRef.componentInstance.currentAccout['account_id'],this.editStructureStrategyForm.controls['s_benchmark_account']);
      this.editStructureStrategyForm.controls['s_benchmark_account'].patchValue(this.dialogRef.componentInstance.currentAccout['account_id'])
      this.editStructureStrategyForm.controls['Benchmark Account'].patchValue(this.dialogRef.componentInstance.currentAccout['account_name'])
      this.dialogRef.close(); 
    });
    console.log('action',this.actionType);
    switch (this.actionType) {
      case 'Create':
      case 'Create_Example': 
      break;
  }
  }
  get  id ()   {return this.editStructureStrategyForm.get('id') } 
  get  sname ()   {return this.editStructureStrategyForm.get('sname') } 
  get  description ()   {return this.editStructureStrategyForm.get('description') } 
  get  weight_of_child ()   {return this.editStructureStrategyForm.get('weight_of_child') } 

}