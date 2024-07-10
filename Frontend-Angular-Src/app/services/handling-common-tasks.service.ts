import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import * as XLSX from 'xlsx'
@Injectable({
  providedIn: 'root'
})
export class HandlingCommonTasksService {
  constructor(
    private http : HttpClient,
  ) { }
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
    if (!value) {return null};
    let arrayRange = value.split('-')
    if (arrayRange.length>2||
      !Number(arrayRange[0])||
      (arrayRange.length===2&&!Number(arrayRange[1]))||
      Number(arrayRange[0])>Number(arrayRange[1])
    ) {
      control.setErrors({incorrectRange:true})
      return null;
    } else { 
      arrayRange.length===1? arrayRange.push(arrayRange[0]):null;
      return '['+arrayRange.join()+']'
    };
  }
  toDateRangeNew (control:AbstractControl):string|null {
    let end = '01/01/2050';
    let start = '01/01/1970';
    if (!control.value['dateRangeStart']&&!control.value['dateRangeEnd']) {
      return null
    } else {
      start=control.value['dateRangeStart']['_isAMomentObject']? new Date(control.value['dateRangeStart']['_d']).toDateString():new Date(control.value['dateRangeStart']).toDateString();
      if (control.value['dateRangeEnd']) {
        end=control.value['dateRangeEnd']['_isAMomentObject']? new Date(control.value['dateRangeEnd']['_d']).toDateString() : new Date(control.value['dateRangeEnd']).toDateString()
      }
      return '['+start+','+end+']'
    }
  }
  toDateRange (control:AbstractControl,name:string):{min?:string|null,max?:string|null} {
    let obj =  {[name + '_min']:null,[name + '_max']:null}
    obj[name + '_min'] = control.value['dateRangeStart']? new Date(control.value['dateRangeStart']['_d']).toDateString() : null;
    obj[name + '_max'] = control.value['dateRangeEnd']? new Date(control.value['dateRangeEnd']['_d']).toDateString() : null;
    return obj;
  }
  nodecls (){
      return this.http.get <string> ('/api/nodecls/').subscribe(data=>console.log('nodeTerminalClear',data))
  }
  tools () {
    let obj = `
    id :number,
    code :string,
    mp_name :string,
    rest_type :string,
    param :string,
    restrictinon :number,
    act_violation_and_orders :number,
    act_violation :number,
    mp_violation :number,
    act_weight_and_orders :number,
    act_weight :number,
    mp_weight :number,
    sum_weight :number,
    act_mtm :number,
    npv :number,
    net_orders  :number
  `
  let a = obj.split(',').map(el=> {return {fieldName:el.split(':')[0].trim(),displayName:el.split(':')[0].trim()}});
  console.log('obj',a.flat());
  }
}
