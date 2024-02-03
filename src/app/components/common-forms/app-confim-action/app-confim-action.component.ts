import { Component, Input } from '@angular/core';
import { MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { jsonFieldsNames } from 'src/app/models/jsonFieldsNames';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';

@Component({
  selector: 'app-app-confim-action',
  templateUrl: './app-confim-action.component.html',
  styleUrls: ['./app-confim-action.component.css']
})
export class AppConfimActionComponent {
  constructor(
    public dialogRefConfirm: MatDialogRef<AppConfimActionComponent>,
    private HandlingCommonTasks:HandlingCommonTasksService) {
  }
  public actionToConfim : {'action':string ,'isConfirmed': boolean, data?:any,buttonLabel?:string}
  @Input () jsonData:any;
  @Input () captionTitle:string;
  public stringsJSON : string[][] = []
  private jsonFieldsNameDic = jsonFieldsNames
  @Input () dialogType:string ='confirmDialog';
  ngOnInit(): void {
    this.jsonData? this.jsonTransform(this.jsonData):null;
  }
  exportToExcel(){
    let jsonDatatoExcel =  {};
    Object.keys(this.jsonData).forEach((key)=>{
      let nameIndex = this.jsonFieldsNameDic.findIndex(name=>name[0]===key)
      let newKey = nameIndex>-1? this.jsonFieldsNameDic[nameIndex][1]:key;
      Object.assign(jsonDatatoExcel,{[newKey]:this.jsonData[key]})
    })
    this.HandlingCommonTasks.exportToExcel ([jsonDatatoExcel],"jsonData");
  }
  jsonTransform(jsonData:any) {
    Object.entries(jsonData).forEach((el)=>{
      let nameIndex = this.jsonFieldsNameDic.findIndex(name=>name[0]===el[0])
      el[0] = nameIndex>-1? this.jsonFieldsNameDic[nameIndex][1]:el[0];
      this.stringsJSON.push([el[0],(el[1]??'').toString()])
    })
  }
  submitAction () {
    this.actionToConfim.isConfirmed = true;
    this.dialogRefConfirm.close(this.actionToConfim);
  }
  cancelAction () {
    this.actionToConfim.isConfirmed = false;
    this.dialogRefConfirm.close(this.actionToConfim);
  }

}
