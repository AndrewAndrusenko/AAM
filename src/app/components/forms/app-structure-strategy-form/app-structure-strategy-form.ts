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
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';
import { debounceTime, distinctUntilChanged, filter, Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-structure-strategy-form',
  templateUrl: './app-structure-strategy-form.html',
  styleUrls: ['./app-structure-strategy-form.css'],
})
export class AppStructureStrategyFormComponent implements OnInit {
  public editStructureStrategyForm=this.fb.group ({
    id: [null, {validators: [Validators.required], updateOn: 'blur'}],
    sname: [null, { updateOn: 'blur'} ],
    description: {value:'', disabled: true}, 
    weight_of_child: {value:'', disabled: false},
    id_item: {value:'', disabled: false},
    id_strategy_parent : ''
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
  public filterednstrumentsLists :string [] =[];
  public title: string;
  public actionType : string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  public showStrateryStructure: boolean;
  public data: any;
  constructor (
    private fb:FormBuilder, 
    private InvestmentDataServiceService:AppInvestmentDataServiceService, 
    private AppTabServiceService: AppTabServiceService,
    private dialog: MatDialog, 
    public snack:MatSnackBar,
    
  ) {}
  
  ngOnInit(): void {
    this.AppTabServiceService.getSecidLists('').subscribe (data=>{
      this.fullInstrumentsLists = data;
      this.filterednstrumentsLists = data;
    })
    this.InvestmentDataServiceService.getGlobalStategiesList (0,'','Get_ModelPortfolios_List').subscribe (data => {
      this.MPnames = data;
    })
    switch (this.action) {
      case 'Create': 
      break;
      case 'Create_Example':
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
    this.editStructureStrategyForm.controls['weight_of_child'].addValidators ( [Validators.required, Validators.pattern('[0-9]*')]);
    if (this.MP=true) {
      this.editStructureStrategyForm.controls['id'].setAsyncValidators(customAsyncValidators.secidCustomAsyncValidator(this.AppTabServiceService, this.id.value));
      this.editStructureStrategyForm.controls['id'].updateValueAndValidity();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.editStructureStrategyForm.controls['id_item'].setValue (changes['strategyId'].currentValue)
    if (this.MP=true) {
      this.editStructureStrategyForm.controls['id'].setAsyncValidators(customAsyncValidators.secidCustomAsyncValidator(this.AppTabServiceService, this.id.value));
      this.editStructureStrategyForm.controls['id'].updateValueAndValidity();
    }
  }
  updateStrategyStructureData (action:string){
    switch (action) {
      case 'Create':
        this.editStructureStrategyForm.controls['id_strategy_parent'].setValue(this.strategyId)
        this.InvestmentDataServiceService.createStrategyStructure (this.editStructureStrategyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Created: ' + result + ' strategy','OK',{panelClass: ['snackbar-success'], duration: 3000})
            this.editStructureStrategyForm.controls['id'].setValue(null)
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
  onKey (value) {
    console.log('value', value.value);
    this.filterednstrumentsLists = this.fullInstrumentsLists.filter(elem=>elem.includes(value.value)) ;
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
    this.dialogRef = this.dialog.open(AppInstrumentTableComponent ,{minHeight:'400px', minWidth:'900px', autoFocus: false, maxHeight: '90vh'});
    this.dialogRef.componentInstance.action="Select";
    this.dialogRef.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.editStructureStrategyForm.controls['id'].patchValue(this.dialogRef.componentInstance.currentInstrument['secid'])
      this.dialogRef.close(); 
    });
  }
  
  get  id ()   {return this.editStructureStrategyForm.get('id') } 
  get  sname ()   {return this.editStructureStrategyForm.get('sname') } 
  get  description ()   {return this.editStructureStrategyForm.get('description') } 
  get  weight_of_child ()   {return this.editStructureStrategyForm.get('weight_of_child') } 

}