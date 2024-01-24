import { Component,  EventEmitter,  Input, OnInit, Output, SimpleChanges} from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../common-forms/app-confim-action/app-confim-action.component';
import { StrategiesGlobalData } from 'src/app/models/interfaces.model';
import { distinctUntilChanged, filter, map, Observable, startWith, switchMap } from 'rxjs';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AppInstrumentTableComponent } from '../../tables/instrument-table.component/instrument-table.component';
import { AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import { indexDBService } from 'src/app/services/indexDB.service';

@Component({
  selector: 'app-structure-strategy-form',
  templateUrl: './strategy-structure-form.component.html',
  styleUrls: ['./strategy-structure-form.component.css'],
})
export class AppStructureStrategyFormComponent implements OnInit {
  public editStructureStrategyForm=this.fb.group ({
    id: [null, {validators: [Validators.required]}],
    weight_of_child: [null, {validators: [Validators.required,Validators.pattern('-?[0-9]*([0-9.]{0,6})?$')], updateOn: 'blur'} ],
    sname: [null, { updateOn: 'blur'} ],
    description: {value:'', disabled: true}, 
    id_item: {value:'', disabled: false},
    id_strategy_parent : '',
    id_strategy_child_integer: [0]
  })
  
  @Input() disabledControlElements: boolean ;
  @Input() action: string = 'Create'
  @Input() strategyId: string;
  @Input() MP: number;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  dialogRef: MatDialogRef<AppInstrumentTableComponent>;
  MPnames: StrategiesGlobalData [] = [];
  @Output() public modal_principal_parent = new EventEmitter();
  public filterednstrumentsLists : Observable<string[]>;
  public actionType : string;
  public showStrateryStructure: boolean;
  public data: any;
  constructor (
    private fb:FormBuilder, 
    private InvestmentDataService: AppInvestmentDataServiceService,
    private AtuoCompService:AtuoCompleteService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private dialog: MatDialog, 
    private indexDBServiceS:indexDBService,
  ) {}
  ngOnInit(): void {
    this.action !== "Create"? this.editStructureStrategyForm.patchValue(this.data) : null;
    this.action === "Create_Example"?  this.action = "Create" : null;
  }
  ngOnChanges(changes: SimpleChanges) {
    this.disabledControlElements? this.editStructureStrategyForm.disable() : null;
    if (this.MP===2) {
      this.id. setValidators(null);
      this.indexDBServiceS.getIndexDBStaticTables('getModelPortfolios').then (data => this.MPnames = data['data'].filter(el=>el.level===1))
    };
    if (this.MP===1) {
      this.AtuoCompService.getSecidLists();
      this.id.setValidators(this.AtuoCompService.secidValirator())
      this.filterednstrumentsLists = this.id.valueChanges.pipe(
        startWith(''),
        distinctUntilChanged(),
        map(value => this.AtuoCompService.filterList(value || '','secid'))
      );
    };
    Object.hasOwn(changes,'parentStrategyId')? this.id_item.setValue(changes['strategyId'].currentValue): null;
  }
  snacksBox(result:any, action?:string){
    ['Edit','Delete'].includes(this.action)? this.modal_principal_parent.emit(result) : null;
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + ' item'}, action, undefined, false);
      this.InvestmentDataService.sendReloadStrategyStructure(Number(this.strategyId));
    }
  }
  updateStrategyStructureData (action:string){
       this.id_child_integer.patchValue(+(this.id.value||0))
    switch (action) {
      case 'Create':
        this.editStructureStrategyForm.controls['id_strategy_parent'].setValue(this.strategyId)
        this.InvestmentDataService.createStrategyStructure (this.editStructureStrategyForm.value).subscribe(result=>{
          this.snacksBox(result,'Created');
          this.editStructureStrategyForm.controls['id'].setValue(null);
          this.editStructureStrategyForm.controls['weight_of_child'].setValue(null);
          this.editStructureStrategyForm.controls['weight_of_child'].markAsPending();
          this.editStructureStrategyForm.controls['id'].markAsPending();
        })
      break;
      case 'Edit':
        this.editStructureStrategyForm.addControl('id_strategy_parent',new FormControl(this.strategyId, Validators.required))
        this.InvestmentDataService.updateStrategyStructure (this.editStructureStrategyForm.value).subscribe(result=>this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog( this.MP!==1? 'Delete ' + this.sname.value : 'Delete ' + this.id.value).pipe(
          filter(isConfirmed => isConfirmed.isConfirmed===true),
          switchMap(confirmed => this.InvestmentDataService.deleteStrategyStructure(this.id_item.value))
        ).subscribe(result => this.snacksBox(result, 'Deleted'))
      break;
    }
  }
  selectInstrument () {
    this.dialogRef = this.dialog.open(AppInstrumentTableComponent ,{minHeight:'400px', minWidth:'90vw', autoFocus: false, maxHeight: '90vh'});
    this.dialogRef.componentInstance.FormMode="Select";
    this.dialogRef.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.id.patchValue(item.secid)
      this.dialogRef.close(); 
    });
  }
  get  id ()   {return this.editStructureStrategyForm.get('id') } 
  get  id_child_integer ()   {return this.editStructureStrategyForm.get('id_strategy_child_integer') } 
  get  id_item ()   {return this.editStructureStrategyForm.get('id_item') } 
  get  sname ()   {return this.editStructureStrategyForm.get('sname') } 
  get  description ()   {return this.editStructureStrategyForm.get('description') } 
  get  weight_of_child ()   {return this.editStructureStrategyForm.get('weight_of_child') } 

}