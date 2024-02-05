import {Component, Input, SimpleChanges, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {StrategyStructure } from 'src/app/models/interfaces.model';
import {AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import { MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppStructureStrategyFormComponent } from '../../forms/strategy-structure-form.component/strategy-structure-form';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
@Component({
  selector: 'app-table-strategy_structure',
  templateUrl: './strategy_structure-table.component.html',
  styleUrls: ['./strategy_structure-table.component.scss'],
})
export class AppTableStrategyComponent   {
  subscription = new Subscription;
  columnsToDisplay = [];
  columnsHToDisplay = [];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<StrategyStructure>;
  dataSourceInit: StrategyStructure[];
  panelOpenState:boolean = false;
  historicalData:boolean = false;
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
    this.subscription.add(
      this.InvestmentDataService.getReloadStrategyStructure().subscribe ((id) => this.updateStrategyStructure(id))
    );
    this.subscription.add(
      this.InvestmentDataService.receiveStrategyStructureHistoryPortfolio().subscribe(chagesMap =>{
      this.historicalData=true;
    this.dataSource.data = structuredClone( this.dataSourceInit);

        chagesMap.forEach(el=>{
          let index = this.dataSource.data.findIndex(row=>row['id']===el.id_strategy_child)
          if (index>-1)  {
            console.log('Item for instrument ' +el.id_strategy_child+' has not been found. Op: ',el.type_trans);
          }
            switch (el.type_trans) {
              case 'New':
                index>-1? this.dataSource.data[index].weight_of_child=null: console.log('error new',el.id_strategy_child);
              break;
              case 'Old':
                index>-1? this.dataSource.data[index].weight_of_child = el.weight_of_child :this.dataSource.data.push({
                id:el.id_strategy_child,
                id_item:null,
                description:null,
                id_strategy_parent:el.id_strategy_parent,
                weight_of_child: el.weight_of_child,
                name:el.sec_name,
                isin:el.isin,
                })
              break;
              case 'Delete':
                this.dataSource.data.push({
                  id:el.id_strategy_child,
                  id_item:null,
                  description:null,
                  id_strategy_parent:el.id_strategy_parent,
                  weight_of_child:el.weight_of_child,
                  name:el.sec_name,
                  isin:el.isin,
                  })
              break;
            }
        })
        this.columnsHToDisplay = ['id','isin', 'name', 'historical %','current %'] ;
        this.columnsToDisplay = ['id','isin', 'name', 'weight_of_child','old_weight'] ;
        this.columnsToDisplayWithExpand = [...this.columnsToDisplay];

        this.dataSource = new MatTableDataSource (this.dataSource.data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort
      })

    )
  }
  restoreToCurrent () {
    this.historicalData=false;
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
    this.dataSource.data = structuredClone( this.dataSourceInit);
  this.dataSource.paginator = this.paginator;
   this.dataSource.sort = this.sort;
  
  }
  ngOnChanges(changes: SimpleChanges) {
    Object.hasOwn(changes,'parentStrategyId')? this.updateStrategyStructure(changes['parentStrategyId'].currentValue) : null;
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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
        this.dataSourceInit = structuredClone( strategyItems)
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
}
  getTotalWeight (col:string) {
    return this.dataSource? this.dataSource.data.map(t => t[col]).reduce((acc, value) => acc + Number(value??0)/100, 0):0;
  }
}