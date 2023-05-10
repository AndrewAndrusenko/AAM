import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {MatFormFieldModule as MatFormFieldModule} from '@angular/material/form-field';

import {MatInputModule as MatInputModule} from '@angular/material/input'; 
import { AuthService } from 'src/app/services/auth.service';
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
  userrole:string;
  username:string;
  password:string;
  hide : boolean = true;
  errorMsg="";
  userroles:userRoles[] 
/*   foods: Food[] = [
    {value: 'steak-0', viewValue: 'Steak'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos'},
  ]; */
  
  myFunction() {
    this.hide = !this.hide;
  }
  constructor(private authService : AuthService, private router : Router) { }

  ngOnInit(): void {
   this.authService.getUsersRoles().subscribe (UsersRolesData => this.userroles=UsersRolesData)
  }

  handleLoginClick(){
    this.authService.validate(this.username, this.password)
    .then((response) => {
     console.log(response)
     //console.log(response)
      this.authService.setUserInfo({'user' : response ['username']});
      this.router.navigate(['general']);    
    })
    .catch ((error) => {
     console.log(error.error.text)

      this.errorMsg = error.error.text
      
    })
   
  }

  authenticateUser(userName){
    sessionStorage.setItem("user", userName);
    if(userName == "admin"){
      this.router.navigate(['/admin']);
    } else if(userName == "manager"){ 
      this.router.navigate(['/manage']);
    } else if(userName == "officer"){
      this.router.navigate(['/general'])
    }
  }

  handleNewUserClick(){
    this.authService.createNewUser (this.userrole, this.username, this.password)
    .then((response) => {
      console.log(response)
  /*     this.authService.setUserInfo({'user' : response ['user']});
      this.router.navigate(['general']); */
    })
   
  }

}
