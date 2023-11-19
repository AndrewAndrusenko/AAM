import {Component, OnDestroy, ViewChild } from '@angular/core';
import {Subscription } from 'rxjs';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import {Title} from "@angular/platform-browser";
import {MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
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
  lastIndexChanged:number = 0

  constructor (private TreeMenuSevice : TreeMenuSevice, private titleService:Title) {
        this.subscriptions.add (
      this.TreeMenuSevice.getUpdate().subscribe( message => {
        this.messageReceived = message;
        this.titleService.setTitle(message.name)
        if (this.tabsToFollow.includes(message.text)) 
          setTimeout(() => {this.TreeMenuSevice.sendActiveTab(this.tabGroup._allTabs['_results'][0].textLabel)}, 200);
        })
    )
  }
  ngOnDestroy() { this.subscriptions.unsubscribe()}
  showTabName (event:MatTabChangeEvent) {
    this.tabGroup._allTabs['_results'][event.index].textLabel= this.tabGroup._allTabs['_results'][event.index].ariaLabel+' '+this.messageReceived.name;
    console.log('this.lastIndexChanged',this.lastIndexChanged,event.index);
    this.tabGroup._allTabs['_results'][this.lastIndexChanged].textLabel= this.tabGroup._allTabs['_results'][this.lastIndexChanged].ariaLabel;
    this.lastIndexChanged=event.index;
    this.TreeMenuSevice.sendActiveTab(event.tab.textLabel.trim())}
  SetTitle (title) {this.titleService.setTitle(title)}
}
