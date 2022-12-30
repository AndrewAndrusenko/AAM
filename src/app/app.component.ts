import { Component, OnInit } from '@angular/core';
import { CommonService } from './services/mtree.service';
import { TreeMenuSevice } from './services/tree-menu.service';

@Component({
  
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  
  constructor (private treeSevice:TreeMenuSevice,  private Service: CommonService) {    
  }
  ngOnInit(): void {
   
    this.Service.sendUpdate("Accounts");
    // this.treeSevice.getTreeData().subscribe( treeElem => { console.log('appint', treeElem)} )
  }
  title = 'AAM';
}
