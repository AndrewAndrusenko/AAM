import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';

import {MatInputModule} from '@angular/material/input'; 
import { AuthService } from 'src/app/services/auth.service';

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


  myFunction() {
    this.hide = !this.hide;
  }
  constructor(private authService : AuthService, private router : Router) { }

  ngOnInit(): void {
    
  }

  handleLoginClick(){
    this.authService.validate(this.username, this.password)
    .then((response) => {
      console.log(response)
      this.authService.setUserInfo({'user' : response ['user']});
      this.router.navigate(['general']);
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
