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
  messageReceived ={text:'AAA', name:'', id:0};
  Edit = "Edit"
  private subscriptions = new Subscription();
  @ViewChild('tabGroup') tabGroup:MatTabGroup
  tabsToFollow:string[]=['Portfolios']

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
  showTabName (event:MatTabChangeEvent) {this.TreeMenuSevice.sendActiveTab(event.tab.textLabel.trim())}
  SetTitle (title) {this.titleService.setTitle(title)}
}
