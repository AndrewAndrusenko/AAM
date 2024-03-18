import { SelectionModel } from '@angular/cdk/collections';
import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
@Injectable({
  providedIn: 'root'
})
export class HandlingTableSelectionService {
  public multiSelect: boolean = true; 
// Selection table module is applicable to all table component with diffrent data sources. That is why such typing is appropritate in the current module
  constructor() { }
  isAllSelected(dataSource: MatTableDataSource<{}>, selection : SelectionModel<{}> ) {
    if (!dataSource) return false
    const numSelected = selection.selected.length;
    const numRows = dataSource.data.length||null;
    return numSelected === numRows;
  }
  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows(dataSource: MatTableDataSource<{}>, selection : SelectionModel<{}> , forceSelectAll:boolean=false) {
    if (this.isAllSelected(dataSource, selection)&&!forceSelectAll) {
      selection.clear();
      return;
    }
    selection.select(...dataSource.filteredData);
  }
  /** The label for the checkbox on the passed row */
  checkboxLabel(dataSource: MatTableDataSource<{}>, selection : SelectionModel<{}> , row?: {}): string {
    if (!row) {
      return `${this.isAllSelected(dataSource, selection) ? 'deselect' : 'select'} all`;
    }
    return `${selection.isSelected(row) ? 'deselect' : 'select'} row ${ 1}`;
  }
}
