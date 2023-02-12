import { Component,  Input, OnInit, SimpleChanges,  } from '@angular/core';
import { FormBuilder, FormControl, FormGroup,  ValidationErrors,  Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { MatSnackBar} from '@angular/material/snack-bar';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { StrategiesGlobalData } from 'src/app/models/accounts-table-model';
import { formatPercent } from '@angular/common';
import { AppInstrumentTableComponent } from '../../tables/app-table-instrument/app-table-instrument.component';
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
  @Input() strategyId: string;
  @Input() MP: boolean;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  isEditForm: boolean = false;
  dialogRef: MatDialogRef<AppInstrumentTableComponent>;
  dtOptions: any = {};
  MPnames: StrategiesGlobalData [] = [];
  public title: string;
  public actionType : string;
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
      /* this.data['id']='';
      this.editStructureStrategyForm.patchValue(this.data); */
      // this.sname.markAsTouched();
    break;
    case 'Edit':
      this.title = "Edit"
      this.action="Edit"
      this.editStructureStrategyForm.patchValue(this.data);
    break;   
    case 'Delete': 
      this.editStructureStrategyForm.patchValue(this.data);
      this.editStructureStrategyForm.controls['id'].disable() 
      this.editStructureStrategyForm.controls['weight_of_child'].disable() 
    break;
    default :
      this.title = "Create"
      this.action = "Create"
    break; 
   }  
  this.InvestmentDataServiceService.getGlobalStategiesList (0,'','Get_ModelPortfolios_List').subscribe (data => {
    this.MPnames = data;
  })
  this.editStructureStrategyForm.controls['id'].addValidators ( [Validators.required])
  this.editStructureStrategyForm.controls['weight_of_child'].addValidators ( [Validators.required, Validators.pattern('[0-9]*')])
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('changes',changes);
    console.log('MP',this.MP);
    this.editStructureStrategyForm.controls['id_item'].setValue (changes['strategyId'].currentValue)
  }
  updateStrategyStructureData (action:string){
    switch (action) {
      case 'Create':
        this.editStructureStrategyForm.removeControl('id_strategy_parent');
        this.editStructureStrategyForm.addControl('id_strategy_parent',new FormControl(this.strategyId, Validators.required))
        this.InvestmentDataServiceService.createStrategyStructure (this.editStructureStrategyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Created: ' + result + ' strategy','OK',{panelClass: ['snackbar-success'], duration: 3000})
            this.editStructureStrategyForm.controls['id'].setValue('')
            this.editStructureStrategyForm.controls['weight_of_child'].setValue('')
            this.InvestmentDataServiceService.sendReloadStrategyStructure(Number(this.strategyId))
            this.editStructureStrategyForm.controls['weight_of_child'].markAsPending()
            this.editStructureStrategyForm.controls['id'].markAsPending()
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
            this.InvestmentDataServiceService.sendReloadStrategyStructure(Number(this.strategyId))
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
              this.snack.open('Deleted: ' + result + ' item','OK',{panelClass: ['snackbar-success'], duration: 3000})
              this.InvestmentDataServiceService.sendReloadStrategyStructure(Number(this.strategyId))
              this.dialog.closeAll();
            }
          })
          }
        })
      break;
    }
  }

  getFormValidationErrors() {
    Object.keys(this.editStructureStrategyForm.controls).forEach(key => {
      const controlErrors: ValidationErrors = this.editStructureStrategyForm.get(key).errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach(keyError => {
         console.log('Key control: ' + key + ', keyError: ' + keyError + ', err value: ', controlErrors[keyError]);
        });
      }
    });
  }
  selectInstrument () {
    this.dialogRef = this.dialog.open(AppInstrumentTableComponent ,{minHeight:'400px', minWidth:'900px' });
    this.dialogRef.componentInstance.modal_principal_parent.subscribe ((item)=>{
      console.log(this.editStructureStrategyForm.controls);
      console.log(this.dialogRef.componentInstance.currentInstrument['secid']);
      this.editStructureStrategyForm.controls['id'].patchValue(this.dialogRef.componentInstance.currentInstrument['secid'])
      this.dialogRef.close(); 
    });
  }
  
  get  id ()   {return this.editStructureStrategyForm.get('id') } 
  get  sname ()   {return this.editStructureStrategyForm.get('sname') } 
  get  description ()   {return this.editStructureStrategyForm.get('description') } 
  get  weight_of_child ()   {return this.editStructureStrategyForm.get('weight_of_child') } 

}