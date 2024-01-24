import {Component, Input, SimpleChanges, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {StrategyStructure } from 'src/app/models/interfaces.model';
import {AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppStructureStrategyFormComponent } from '../../forms/strategy-structure-form.component/strategy-structure-form';
import { FormBuilder, FormGroup } from '@angular/forms';
@Component({
  selector: 'app-table-strategy_structure',
  templateUrl: './strategy_structure-table.component.html',
  styleUrls: ['./strategy_structure-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableStrategyComponent   {
  columnsToDisplay = [];
  columnsHToDisplay = [];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<StrategyStructure>;
  panelOpenState:boolean = false;
  expandedElement: StrategyStructure  | null;
  dialogRef: MatDialogRef<AppStructureStrategyFormComponent>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(AppStructureStrategyFormComponent) newItemForm:AppStructureStrategyFormComponent;
  @Input() action:string ='';
  @Input() parentStrategyId: any;
  @Input() ModelPortfolio: number;
  @Input() accessState: string = 'none';
  @Input() disabledControlElements: boolean = false;
  editStructureStrategyForm: FormGroup;
  constructor(
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private dialog: MatDialog, 
    private fb:FormBuilder,
  ) 
  {
    this.editStructureStrategyForm=this.fb.group ({
      id: {value:''},
      sname: [null, { updateOn: 'blur'} ],
      description: {value:'', disabled: true}, 
      weight_of_child: {value:'', disabled: false},
      id_item: {value:'', disabled: false},
    })
    this.InvestmentDataService.getReloadStrategyStructure().subscribe ((id) => this.updateStrategyStructure(id));
  }
  ngOnChanges(changes: SimpleChanges) {
    Object.hasOwn(changes,'parentStrategyId')? this.updateStrategyStructure(changes['parentStrategyId'].currentValue) : null;
  }
  updateStrategyStructure (id:number) {
    if (this.accessState !== 'none') {
      this.InvestmentDataService.getStrategyStructure (id,'0','0').subscribe (strategyItems => {
        if (this.ModelPortfolio===1) { 
          this.columnsHToDisplay = ['id','isin', 'name', 'weight'] ;
          this.columnsToDisplay = ['id','isin', 'name', 'weight_of_child'] ;
        } else {
          this.columnsHToDisplay = ['id','name', 'description', 'weight'];
          this.columnsToDisplay = ['id','sname', 'description', 'weight_of_child'];
        }
        this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
        this.newItemForm.action='Create';
        this.newItemForm.editStructureStrategyForm.reset();
        this.dataSource = new MatTableDataSource (strategyItems);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    }
  }
  openStrategyStructureForm (actionType:string, row: any ) {
    this.panelOpenState=true
    this.newItemForm.action=actionType
    this.newItemForm.editStructureStrategyForm.patchValue(row);
/*     this.dialogRef = this.dialog.open(AppStructureStrategyFormComponent ,{minHeight:'20vh', minWidth:'60vw' });
    this.dialogRef.componentInstance.MP = this.ModelPortfolio;
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.data = row;
    this.dialogRef.componentInstance.strategyId=this.parentStrategyId;
    this.dialogRef.componentInstance.modal_principal_parent.subscribe ((item)=>this.dialogRef.close()) */
}
  getTotalWeight () {
    return this.dataSource? this.dataSource.data.map(t => t.weight_of_child).reduce((acc, value) => acc + Number(value)/100, 0):0;
  }
}