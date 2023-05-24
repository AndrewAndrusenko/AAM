import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
interface userRoles {
  value: string;
}
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
/*   encapsulation: ViewEncapsulation.None */
})
export class LoginComponent implements OnInit {  
  signInForm=this.fb.group ({
    login: [null, {validators: [Validators.required]}],
    password: [null, {validators: [Validators.required]}],
  })
  addNewUserForm=this.fb.group ({
    userrole: [null, {validators: [Validators.required]}],
    login: [null, {validators: [Validators.required]}],
    password: [null, {validators: [Validators.required]}],
  })
  hide : boolean = true;
  userroles:userRoles[] 
  constructor(
    private authService : AuthService, 
    private router : Router,
    private CommonDialogsService:HadlingCommonDialogsService,
    private fb:FormBuilder, 
  ) {}
  ngOnInit(): void {
   this.authService.getUsersRoles().subscribe (UsersRolesData => this.userroles=UsersRolesData)
  }
  handleLoginClick(){
    this.authService.validate(this.login.value, this.password.value)
    .then(response => {
      this.authService.setUserInfo({'user' : response ['username']});
      this.router.navigate(['tree']);    
    })
    .catch (error => this.CommonDialogsService.snackResultHandler({name:'error', detail: error.error.text}));
  }
  handleNewUserClick(){
    this.authService.createNewUser (this.userroleCreate.value, this.loginCreate.value, this.passwordCreate.value)
      .then(response => this.CommonDialogsService.snackResultHandler({name:'success', detail: response['login'] + '  with ID ' + response['id']}, 'Created user login: ', undefined,undefined, 6000))
      .catch(err => this.CommonDialogsService.snackResultHandler({name:'error', detail:err.error.split("\n", 1).join("")}));
  }
  get  userroleCreate ()   {return this.addNewUserForm.get('userrole') } 
  get  loginCreate ()   {return this.addNewUserForm.get('login') } 
  get  passwordCreate ()   {return this.addNewUserForm.get('password') } 
  get  login ()   {return this.signInForm.get('login') } 
  get  password ()   {return this.signInForm.get('password') } 
}