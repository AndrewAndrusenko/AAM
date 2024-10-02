import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import { AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { TreeMenuSevice } from 'Frontend-Angular-Src/app/services/tree-menu.service';
import { DeviceDetectorService } from 'ngx-device-detector';

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
  public sessionID: string;
  deviceType:string;
  hide : boolean = true;
  userroles:string[] 
  loginsArray: string[];
  testingRoles = [
    {position: 0, role: 'SuperUser', login: 'SuperUser', password: 'Super', desc:'Testing role. Read-Write: All objects.'},
    {position: 1, role: 'Investment/Client Adviser (RM manager)', login: 'RMManager', password: 'RMManager', desc:'Manage relations with clients. Read-Write: Client, Portfolios. Read-only: all relevant data.'},
    {position: 2, role: 'Portfolio Manager', login: 'portfolioManager', password: 'portfolioManager', desc:'Asset management via adjusting model portfolios, creating orders, making deals. Read-Write: model portfolios, strategies, orders, trades'},
    {position: 3, role: 'Trader', login: 'traderTest', password: 'trader', desc:'Executing orders placed by Portfolio Managers. Read-Write:trades, orders'},
    {position: 4, role: 'Middle Officer', login: 'mofficer', password: 'middle', desc:'Allocating trades between client portolifos, fees calculations, martket data upload/update, managing restrictions. Read-Write:clients trades, fees, restrtions, instruments, market quotes, etc.'},
    {position: 5, role: 'Back Officer', login: 'bofficer', password: 'back', desc:'Executing non-investment transactions and accounting. Read-Write:accounting entries, fees, swifts'},
    {position: 6, role: 'Accounting Officer', login: 'Accountant', password: 'balance', desc:'Managing accounts, accounting schemes, fees schedules, executing balance closing and opening, etc non-investment transactions and accounting. Read-Wirte:accounts, balance, accounting entries,accounting schemes, fees schedules, etc'}]

    displayedColumns: string[] = ['position', 'role', 'login', 'password','desc'];
  constructor(
    private authService : AuthService, 
    private router : Router,
    private CommonDialogsService:HadlingCommonDialogsService,
    private TreeMenuSevice:TreeMenuSevice,
    private fb:FormBuilder, 
    private deviceService: DeviceDetectorService,
  ) { }
  ngOnInit(): void {
    this.authService.getUsersRoles().subscribe (usersRolesData => this.userroles=usersRolesData)
    this.authService.getloginsArray().subscribe(data =>{ 
      this.loginsArray=data;
      this.loginCreate.addValidators([Validators.required,Validators.minLength(4),this.validateLogin()])
    })
    switch (true) {
      case this.deviceService.isDesktop():
          this.deviceType='Desktop'
      break;
      case this.deviceService.isMobile():
          this.deviceType='Mobile'
      break;
      case this.deviceService.isTablet():
          this.deviceType='Tablet'
      break;
      default:
        this.deviceType='Unknown'
      break;

    }
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