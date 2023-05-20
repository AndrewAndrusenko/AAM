import {Component, Input, SimpleChanges, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {StrategyStructure } from 'src/app/models/intefaces';
import {AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppStructureStrategyFormComponent } from '../../forms/strategy-structure-form/strategy-structure-form';
import { FormBuilder, FormGroup } from '@angular/forms';
@Component({
  selector: 'app-table-strategy_structure',
  templateUrl: './strategy_structure-table.html',
  styleUrls: ['./strategy_structure-table.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableStrategyComponent   {
  columnsToDisplay = ['id','sname', 'description', 'weight_of_child'];
  columnsHToDisplay = ['id','sname', 'description', 'weight'];
  panelOpenState = false;
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<StrategyStructure>;
  expandedElement: StrategyStructure  | null;
  dialogRef: MatDialogRef<AppStructureStrategyFormComponent>;
  action ='';
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
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
    console.log('Structure Changes',changes); 
    this.updateStrategyStructure(changes['parentStrategyId'].currentValue);
  }
  updateStrategyStructure (id:number) {
    if (this.accessState !== 'none') {
      this.InvestmentDataService.getStrategyStructure (id,'0','0').subscribe (strategyItems => {
        console.log('ModelPortfolio',this.ModelPortfolio);
        if (this.ModelPortfolio===1) { 
          this.columnsToDisplay = ['id','isin', 'shortname', 'weight_of_child'] 
        } else {
          this.columnsToDisplay = ['id','sname', 'description', 'weight_of_child'];
        }
        this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
        this.dataSource = new MatTableDataSource (strategyItems);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    }
  }
  openStrategyStructureForm (actionType:string, row: any ) {
    this.dialogRef = this.dialog.open(AppStructureStrategyFormComponent ,{minHeight:'150px', minWidth:'800px' });
    this.dialogRef.componentInstance.MP = this.ModelPortfolio;
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = actionType;
    this.dialogRef.componentInstance.data = row;
    this.dialogRef.componentInstance.strategyId=this.parentStrategyId;

    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
      this.dialogRef.componentInstance.title = 'Create New';
      break;
    }
    this.dialogRef.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.dialogRef.close();
    })
}
  getTotalWeight () {
    return this.dataSource? this.dataSource.data.map(t => t.weight_of_child).reduce((acc, value) => acc + Number(value)/100, 0):0;
  }
}