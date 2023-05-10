import { Component,  Input, OnInit, SimpleChanges,  } from '@angular/core';
import { FormBuilder, FormControl, FormGroup,  ValidationErrors,  Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../common-forms/app-confim-action/app-confim-action.component';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { StrategiesGlobalData } from 'src/app/models/accounts-table-model';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';
import { map, Observable, startWith } from 'rxjs';
import { AtuoCompSecidService } from 'src/app/services/atuo-comp-secid.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AppInstrumentTableComponent } from '../../tables/instrument-table/instrument-table';

@Component({
  selector: 'app-structure-strategy-form',
  templateUrl: './strategy-structure-form.html',
  styleUrls: ['./strategy-structure-form.css'],
})
export class AppStructureStrategyFormComponent implements OnInit {
  public editStructureStrategyForm=this.fb.group ({
    id: [null, {validators: [Validators.required]}],
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
  public filterednstrumentsLists : Observable<string[]>;
  public title: string;
  public actionType : string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public showStrateryStructure: boolean;
  public data: any;
  constructor (
    private fb:FormBuilder, 
    private InvestmentDataServiceService:AppInvestmentDataServiceService, 
    private AppTabServiceService: AppTabServiceService,
    private AtuoCompService:AtuoCompSecidService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private dialog: MatDialog, 
  ) {}
  
  ngOnInit(): void {
    this.AtuoCompService.getSecidLists('get_secid_array');
    this.filterednstrumentsLists = this.editStructureStrategyForm.controls['id'].valueChanges.pipe(
      startWith(''),
      map(value => this.AtuoCompService.filter(value || ''))
    );
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
    if (this.MP==true) {
      this.editStructureStrategyForm.controls['id'].setAsyncValidators(customAsyncValidators.secidCustomAsyncValidator(this.AppTabServiceService, this.id.value));
      this.editStructureStrategyForm.controls['id'].updateValueAndValidity();
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    this.editStructureStrategyForm.controls['id_item'].setValue (changes['strategyId'].currentValue)
    if (this.MP==true) {
      this.editStructureStrategyForm.controls['id'].setAsyncValidators(customAsyncValidators.secidCustomAsyncValidator(this.AppTabServiceService, this.id.value));
      this.editStructureStrategyForm.controls['id'].updateValueAndValidity();
    } else {
      this.editStructureStrategyForm.controls['id'].clearAsyncValidators();
      this.editStructureStrategyForm.controls['id'].updateValueAndValidity();
    }
  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + 'item'}, action);
      this.InvestmentDataServiceService.sendReloadStrategyStructure(Number(this.strategyId));
      this.CommonDialogsService.dialogCloseAll();
    }
  }
  updateStrategyStructureData (action:string){
    switch (action) {
      case 'Create':
        this.editStructureStrategyForm.controls['id_strategy_parent'].setValue(this.strategyId)
        this.InvestmentDataServiceService.createStrategyStructure (this.editStructureStrategyForm.value).then(result=>{
          this.snacksBox(result,'Created');
          this.editStructureStrategyForm.controls['id'].setValue(null);
          this.editStructureStrategyForm.controls['weight_of_child'].setValue('');
          this.editStructureStrategyForm.controls['weight_of_child'].markAsPending();
          this.editStructureStrategyForm.controls['id'].markAsPending();
        })
      break;
      case 'Edit':
        this.editStructureStrategyForm.addControl('id_strategy_parent',new FormControl(this.strategyId, Validators.required))
        this.InvestmentDataServiceService.updateStrategyStructure (this.editStructureStrategyForm.value).then(result=>{
          this.snacksBox(result,'Updated');
        })
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete ' + this.sname.value).subscribe(isConfirmed => {
          if (isConfirmed.isConfirmed) {
            this.InvestmentDataServiceService.deleteStrategyStructure (this.editStructureStrategyForm.value['id_item']).then (result =>{
              this.snacksBox(result,'Deleted')
              this.CommonDialogsService.dialogCloseAll();
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
    this.dialogRef = this.dialog.open(AppInstrumentTableComponent ,{minHeight:'400px', minWidth:'900px', autoFocus: false, maxHeight: '90vh'});
    this.dialogRef.componentInstance.FormMode="Select";
    this.dialogRef.componentInstance.modal_principal_parent.subscribe ((item)=>{
      // this.editStructureStrategyForm.controls['id'].patchValue(this.dialogRef.componentInstance.currentInstrument['secid'])
      this.dialogRef.close(); 
    });
  }
  
  get  id ()   {return this.editStructureStrategyForm.get('id') } 
  get  sname ()   {return this.editStructureStrategyForm.get('sname') } 
  get  description ()   {return this.editStructureStrategyForm.get('description') } 
  get  weight_of_child ()   {return this.editStructureStrategyForm.get('weight_of_child') } 

}