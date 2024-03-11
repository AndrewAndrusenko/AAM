import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import * as XLSX from 'xlsx'
@Injectable({
  providedIn: 'root'
})
export class HandlingCommonTasksService {
  constructor() { }
  exportToExcel (data:Array<{}>, name:string,numberFields?:string[],dateFields?:string[])  {
    let dataToExport=data;
    if (numberFields!==undefined) {
    dataToExport = data.map(el=>{
      Object.keys(el).forEach(key=>{
        switch (true==true) {
          case  numberFields.includes(key): return el[key]=Number(el[key]) ;
          case dateFields.includes(key): return el[key]=new Date(el[key])
          default: return el[key]=el[key]
        }
      })
      return el;
    })}
    const fileName = name + ".xlsx";
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, fileName);
  }
  toNumberRange (value:string, control:AbstractControl,name:string):{min?:string|null,max?:string|null} {
    let arrayRange = value.split('-')
    let obj =  {[name + '_min']:arrayRange[0], [name + '_max']:  arrayRange[arrayRange.length===1? 0: 1]};
    if (arrayRange.length>2||!Number(arrayRange[0])||(arrayRange.length===2&&!Number(arrayRange[1]))) {
      obj = null;
      control.setErrors({incorrectRange:true})
    } 
    console.log('obj',obj);
    return obj;
  }
  toNumberRangeNew (value:string, control:AbstractControl):string|null {
    let arrayRange = value.split('-')
    if (arrayRange.length>2||!Number(arrayRange[0])||(arrayRange.length===2&&!Number(arrayRange[1]))) {
      control.setErrors({incorrectRange:true})
      return null;
    } else { 
      arrayRange.length===1? arrayRange.push(arrayRange[0]):null;
      return '['+arrayRange.join()+']'
    };
  }
  toDateRangeNew (control:AbstractControl):string|null {
    if (!control.value['dateRangeStart']&&!control.value['dateRangeEnd']) {
      return null
    } else {
      let start = control.value['dateRangeStart']? new Date(control.value['dateRangeStart']['_d']).toLocaleDateString() : '01/01/1970';
      let end = control.value['dateRangeEnd']? new Date(control.value['dateRangeEnd']['_d']).toLocaleDateString() : '01/01/2050';
      return '['+start+','+end+']'
    }
  }
  toDateRange (control:AbstractControl,name:string):{min?:string|null,max?:string|null} {
    let obj =  {[name + '_min']:null,[name + '_max']:null}
    obj[name + '_min'] = control.value['dateRangeStart']? new Date(control.value['dateRangeStart']['_d']).toDateString() : null;
    obj[name + '_max'] = control.value['dateRangeEnd']? new Date(control.value['dateRangeEnd']['_d']).toDateString() : null;
    return obj;
  }
}
