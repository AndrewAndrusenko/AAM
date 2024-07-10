import { Component, ViewChild } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { TreeMenuSevice } from 'FrontendAngularSrc/app/services/tree-menu.service';

@Component({
  selector: 'acc-accounts-tab',
  templateUrl: './acc-accounts-tab.html',
  styleUrls: ['./acc-accounts-tab.scss']
})
export class AccAccountsTabComponent {
  @ViewChild('tabGroup') tabGroup:MatTabGroup
  constructor ( 
    private TreeMenuSeviceS: TreeMenuSevice,
    private titleService:Title
    ) {}
  ngAfterViewInit(): void {
    this.TreeMenuSeviceS.sendActiveTab(this.tabGroup._allTabs['_results'][0].textLabel);
    this.titleService.setTitle(this.tabGroup._allTabs['_results'][0].textLabel)
  }
  showTabName (event:MatTabChangeEvent) {
    this.TreeMenuSeviceS.sendActiveTab(event.tab.textLabel.trim());
    this.titleService.setTitle(event.tab.textLabel.trim())
  }
}
