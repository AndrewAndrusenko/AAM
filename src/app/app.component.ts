import { Component, OnInit } from '@angular/core';
import { TreeMenuSevice } from './services/tree-menu.service';

@Component({
  
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  
  constructor (private treeSevice:TreeMenuSevice) {    
  }
  ngOnInit(): void {
    this.treeSevice.sendUpdate("Accounts", "A");
  }
  title = 'AAM';
}
