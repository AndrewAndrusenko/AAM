import { SelectionModel } from '@angular/cdk/collections';
import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Injectable({
  providedIn: 'root'
})
export class HandlingTableSelectionService {
  public multiSelect: boolean = true; 
 
  constructor() { }
  isAllSelected(dataSource: MatTableDataSource<any>, selection : SelectionModel<any> ) {
    if (!dataSource) return false
    const numSelected = selection.selected.length;
    const numRows = dataSource.data.length||null;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows(dataSource: MatTableDataSource<any>, selection : SelectionModel<any>, forceSelectAll:boolean=false) {
    if (this.isAllSelected(dataSource, selection)&&!forceSelectAll) {
      selection.clear();
      return;
    }
    console.log('toggle',dataSource.data);
    selection.select(...dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(dataSource: MatTableDataSource<any>,  selection : SelectionModel<any>, row?: any): string {
    if (!row) {
      return `${this.isAllSelected(dataSource, selection) ? 'deselect' : 'select'} all`;
    }
    return `${selection.isSelected(row) ? 'deselect' : 'select'} row ${ 1}`;
  }
}
