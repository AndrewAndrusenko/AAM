import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import * as XLSX from 'xlsx'

@Injectable({
  providedIn: 'root'
})
export class HandlingCommonTasksService {

  constructor() { }
  exportToExcel (data:any, name:string)  {
    const fileName = name + ".xlsx";
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, fileName);
  }
  toNumberRange (value:string, control:AbstractControl,name:string):any {
    let min = name + '_min';
    let max = name + '_max';
    let arrayRange = value.split('-')
    let obj =  {[min]:arrayRange[0], [max]:  arrayRange[arrayRange.length===1? 0: 1]};
    if (arrayRange.length>2||!Number(arrayRange[0])||(arrayRange.length===2&&!Number(arrayRange[1]))) {
      obj = null;
      control.setErrors({incorrectRange:true})
    } 
    console.log('obj',obj);
    return obj;
  }
  toDateRange (control:AbstractControl,name:string):any {
    let min = name + '_min';
    let max = name + '_max';
    let obj =  {[min]:null,[max]:null}
    obj[min] = control.value['dateRangeStart']? new Date(control.value['dateRangeStart']['_d']).toDateString() : null;
    obj[max] = control.value['dateRangeEnd']? new Date(control.value['dateRangeEnd']['_d']).toDateString() : null;
    return obj;
  }
}
