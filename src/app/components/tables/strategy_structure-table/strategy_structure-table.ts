import {AfterViewInit, Component, Input, SimpleChanges, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {StrategyStructure } from 'src/app/models/intefaces';
import {AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppStructureStrategyFormComponent } from '../../forms/strategy-structure-form/strategy-structure-form';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { additionalLightGreen } from 'src/app/models/constants';
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
export class AppTableStrategyComponent  implements AfterViewInit {
  StrategiesGlobalDataC = (): StrategyStructure => ( {
    id_strategy_parent: 0, 
    id : 0, 
    sname : '',
    description: '',
    weight_of_child : 0,
    id_item:0,
   });
  private subscriptionName: Subscription;
  columnsToDisplay = ['id','sname', 'description', 'weight_of_child'];
  public columnsHToDisplay = ['id','sname', 'description', 'weight'];
  additionalLightGreen = additionalLightGreen;
  panelOpenState = false;
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<StrategyStructure>;
  accessToClientData: string = 'true';
  dialogRef: MatDialogRef<AppStructureStrategyFormComponent>;
  dtOptions: any = {};
  action ='';
  public row: any;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  expandedElement: StrategyStructure  | null;
  @Input() parentStrategyId: any;
  @Input() MP: boolean;
  public editStructureStrategyForm: FormGroup;

  constructor(private InvestmentDataService:AppInvestmentDataServiceService, private dialog: MatDialog, private fb:FormBuilder ) {
    this.subscriptionName= this.InvestmentDataService.getReloadStrategyStructure().subscribe ( (id) => {
      console.log('messageAA', id )
      this.InvestmentDataService.getStrategyStructure (id,'0','0').subscribe (portfoliosData => {
        console.log('portfoliosData', portfoliosData);
        this.dataSource  = new MatTableDataSource(portfoliosData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    } )
  }
  ngOnInit(): void {
    if (this.MP==true) { this.columnsToDisplay = ['id','isin', 'shortname', 'weight_of_child'] }
  }
  async ngAfterViewInit() {
    this.editStructureStrategyForm=this.fb.group ({
      id: {value:''},
      sname: [null, { updateOn: 'blur'} ],
      description: {value:'', disabled: true}, 
      weight_of_child: {value:'', disabled: false},
      id_item: {value:'', disabled: false},
    })
    console.log('parentStrategyId',this.parentStrategyId);
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
      this.InvestmentDataService.getStrategyStructure(this.parentStrategyId,'0','0').subscribe (portfoliosData => {
        console.log('portfoliosData', portfoliosData);
        this.dataSource  = new MatTableDataSource(portfoliosData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
  }
  ngOnChanges(changes: SimpleChanges) {
    this.columnsToDisplay = ['id','sname', 'description', 'weight_of_child'];
    if (this.MP==true) { this.columnsToDisplay = ['id','isin', 'shortname', 'weight_of_child'] }

    console.log('changes', changes);
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    let newId = changes['parentStrategyId'].currentValue
    console.log('OK', newId);

    this.InvestmentDataService.getStrategyStructure(this.parentStrategyId,'0','0').subscribe (portfoliosData => {
      console.log('portfoliosData', portfoliosData);
      this.dataSource  = new MatTableDataSource(portfoliosData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    })
  }
  openStrategyStructureForm (actionType:string, row: any ) {
    console.log('row', row, this.parentStrategyId);
    this.dialogRef = this.dialog.open(AppStructureStrategyFormComponent ,{minHeight:'150px', minWidth:'800px' });
    this.dialogRef.componentInstance.MP = this.MP;
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = actionType;
    this.dialogRef.componentInstance.data = row;
    this.dialogRef.componentInstance.strategyId=this.parentStrategyId;
    console.log('action',actionType);
    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
      this.dialogRef.componentInstance.title = 'Create New';
      break;
    }
  }
  getTotalWeight () {
   return this.dataSource.data.map(t => t.weight_of_child).reduce((acc, value) => acc + Number(value)/100, 0);
  }
}