import { Component,  EventEmitter,  Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'FrontendAngularSrc/app/services/hadling-common-dialogs.service';
import { dRestrictionsObjects, restrictionsData } from 'FrontendAngularSrc/app/models/restrictions-interfaces.model';
import { AppRestrictionsHandlingService } from 'FrontendAngularSrc/app/services/restrictions-handling.service';
import { AtuoCompleteService } from 'FrontendAngularSrc/app/services/auto-complete.service';
@Component({
  selector: 'inv-restriction-main-form',
  templateUrl: './inv-restriction-main-form.html',
  styleUrls: ['./inv-restriction-main-form.scss'],
})
export class AppInvRestrictionMainFormComponent {
  public RestrictionMainForm: FormGroup;
  public restricionsType:dRestrictionsObjects[];
  @Input() action: string;
  @Input() data: restrictionsData;

  @Output() public modal_principal_parent = new EventEmitter();
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private RestrictionsHandlingService:AppRestrictionsHandlingService,
    private AutoCompService:AtuoCompleteService,
 
  ) 
  {   
    this.RestrictionMainForm = this.fb.group ({
      id :{value:null, disabled: false}, 
      portfolioname :{value:null, disabled: false}, 
      idportfolio :{value:null, validators:[Validators.required]}, 
      restriction_type_id: {value:null, disabled: false}, 
      value: [0, { validators:[Validators.required,Validators.pattern('[0-9]*([0-9.]{0,6})?$')], updateOn: 'blur' }],
      param :[null, { validators:[], updateOn: 'blur' }],
      object_code :{value:null, validators:[Validators.required]}, 
      object_id: {value:null, disabled: true}, 
      object_description :{value:null, disabled: false}
    })
    this.AutoCompService.subSecIdList.next(true)
  }
  ngOnInit(): void {
    this.action==='View'? this.RestrictionMainForm.disable():null;
    this.RestrictionMainForm.patchValue(this.data);
    this.restTypeChanged();
    this.RestrictionsHandlingService.getRestrictionsObjects().subscribe(data=>this.restricionsType=data)
  }
  restTypeChanged (){
    this.param.clearValidators()
    this.param.updateValueAndValidity();
    switch (this.restriction_type_id.value) {
      case 6: //listing
        this.param.addValidators([Validators.required,Validators.pattern('[0-9]')])
        this.param.updateValueAndValidity();
      break;
      case 5://particular secid
        this.param.addValidators([Validators.required,this.AutoCompService.secidValirator()])
        this.param.updateValueAndValidity();
      break;
    }
  }
  snacksBox(result:{name:string,detail:string}|restrictionsData[], action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: (result as restrictionsData[]).length + ' restriction'}, action,undefined,false)
      this.RestrictionsHandlingService.sendRestrictionsDataMainReload(result as restrictionsData[],action);
      this.modal_principal_parent.emit(true)
    }
  }
  updateRestrictionData(action:string){
    this.RestrictionMainForm.updateValueAndValidity();
    if (this.RestrictionMainForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.RestrictionsHandlingService.updateRestrictionMainData(this.RestrictionMainForm.value,'Create').subscribe(result => this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.RestrictionsHandlingService.updateRestrictionMainData (this.RestrictionMainForm.value,'Edit').subscribe(result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete restriction ','Delete').pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(() => this.RestrictionsHandlingService.updateRestrictionMainData(this.RestrictionMainForm.value,'Delete'))
        ).subscribe(result => this.snacksBox(result,'Deleted'))
      break;
    }
  }
  get  portfolioname() {return this.RestrictionMainForm.get('portfolioname')}
  get  id() {return this.RestrictionMainForm.get('id')}
  get  idportfolio () {return this.RestrictionMainForm.get('idportfolio') } 
  get  restriction_type_id () {return this.RestrictionMainForm.get('restriction_type_id') } 
  get  rstValue () {return this.RestrictionMainForm.get('value') } 
  get  object_code () {return this.RestrictionMainForm.get('object_code') } 
  get  param () {return this.RestrictionMainForm.get('param') } 

}
/* id :{value:null, disabled: false}, 
 :{value:null, disabled: false}, 
 :{value:null, disabled: false}, 
: {value:null, disabled: false}, 
value: {value:null, disabled: false}, 
param :{value:null, disabled: false},
object_code :{value:null, disabled: false}, 
object_id: {value:null, disabled: false}, 
object_description :{value:null, disabled: false} */
