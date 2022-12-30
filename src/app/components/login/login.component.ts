import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';

import {MatInputModule} from '@angular/material/input'; 

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {  
  username:string;
  password:string;
  hide : boolean = true;


  myFunction() {
    this.hide = !this.hide;
  }
  constructor(private http : HttpClient, private router : Router) { }

  ngOnInit(): void {
    
  }

  handleLoginClick(){
    if(this.username && this.password){
      this.authenticateUser(this.username);
    } else {
      alert('enter username and password');
    }
   
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

}