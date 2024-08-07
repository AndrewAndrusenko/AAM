import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import { AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { TreeMenuSevice } from 'Frontend-Angular-Src/app/services/tree-menu.service';

interface userRoles {
  value: string;
}
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent  {  
  addNewUserForm = this.fb.group ({
    userroleValue: [null, {validators: [Validators.required]}],
    login: [null,{validators: [Validators.required,Validators.minLength(4)]} ],
    password: [null, {validators: [Validators.required,Validators.minLength(4)]}],
  })
  signInForm = this.fb.group ({
    login: [null, {validators: [Validators.required]}],
    password: [null, {validators: [Validators.required]}],
  }
  )
  ISINuniqueAsyncValidator :ValidatorFn;
  public sessionID: string
  hide : boolean = true;
  userroles:string[] 
  loginsArray: string[];
  constructor(
    private authService : AuthService, 
    private router : Router,
    private CommonDialogsService:HadlingCommonDialogsService,
    private TreeMenuSevice:TreeMenuSevice,
    private fb:FormBuilder, 
  ) {
    this.authService.getUsersRoles().subscribe (usersRolesData => this.userroles=usersRolesData)
    this.authService.getloginsArray().subscribe(data =>{ 
      this.loginsArray=data;
      this.loginCreate.addValidators([Validators.required,Validators.minLength(4),this.validateLogin()])
    })
  }
  validateLogin(): ValidatorFn  {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      console.log(control.value,this.loginsArray);
      if (this.loginsArray.includes(control.value)) {
        return { 'loginIsTaken': true };
      }
      return null;
    }
  }
  handleLoginClick(){
    this.authService.validate(this.login.value, this.password.value).pipe(
      catchError(err => {
        this.CommonDialogsService.snackResultHandler({name:'error', detail:err.error.text});
        return EMPTY
      })).subscribe(response => {
      this.authService.setUserInfo({'user' : response.username},response.sessionID);
      this.router.navigate(['tree']);    
      this.TreeMenuSevice.sendRefreshTree(true);
    })
  }
  handleNewUserClick(){
    this.authService.createNewUser (this.userroleCreate.value, this.loginCreate.value, this.passwordCreate.value).pipe(
      catchError(err => {
        console.log(err);
        this.CommonDialogsService.snackResultHandler({name:'error', detail:err.error.split("\n", 1).join("")});
        return EMPTY
      })
    ).subscribe(response => this.CommonDialogsService.snackResultHandler({name:'success', detail: response['login'] + '  with ID ' + response['id']}, 'Created user login: ', undefined,undefined, 6000))
  }
  get  userroleCreate ()   {return this.addNewUserForm.get('userroleValue') } 
  get  loginCreate ()   {return this.addNewUserForm.get('login') } 
  get  passwordCreate ()   {return this.addNewUserForm.get('password') } 
  get  login ()   {return this.signInForm.get('login') } 
  get  password ()   {return this.signInForm.get('password') } 
}