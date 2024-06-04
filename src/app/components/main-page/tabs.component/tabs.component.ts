import {Component, OnDestroy, ViewChild } from '@angular/core';
import {Subscription } from 'rxjs';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import {Title} from "@angular/platform-browser";
import {MatTabGroup } from '@angular/material/tabs';
@Component({
  selector: 'app-app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css'],
})
export class AppTabsComponent implements OnDestroy {
  messageReceived ={text:'AAA', name:'', id:0,action:''};
  Edit = "Edit"
  private subscriptions = new Subscription();
  @ViewChild('tabGroup') tabGroup:MatTabGroup
  tabsToFollow:string[]=['Portfolios']
  lastIndexChanged:number = null
  panel_Pr_Res_OpenState:boolean=false;
  panel_St_Res_OpenState:boolean=false;
  constructor (private TreeMenuSevice : TreeMenuSevice, private titleService:Title) {
    this.subscriptions.add (
      this.TreeMenuSevice.getUpdate().subscribe( message => {
        this.messageReceived = message;
        this.titleService.setTitle(message.name)
        if (this.tabsToFollow.includes(message.text)&&this.tabGroup) {
        this.lastIndexChanged=null
        this.showTabName(this.tabGroup.selectedIndex)}
      })
    )
  }
  ngOnDestroy() { this.subscriptions.unsubscribe()}
  showTabName (index:number) {
    this.tabGroup._allTabs['_results'][index].textLabel= this.tabGroup._allTabs['_results'][index].ariaLabel+' '+this.messageReceived.name;
    this.lastIndexChanged!==null? this.tabGroup._allTabs['_results'][this.lastIndexChanged].textLabel= this.tabGroup._allTabs['_results'][this.lastIndexChanged].ariaLabel : null;
    this.lastIndexChanged=index;
  }
  SetTitle (title) {this.titleService.setTitle(title)}
}
