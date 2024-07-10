import { Component, ViewChild } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { TreeMenuSevice } from 'FrontendAngularSrc/app/services/tree-menu.service';

@Component({
  selector: 'accounting-fees-tab',
  templateUrl: './accounting-fees-tab.html',
  styleUrls: ['./accounting-fees-tab.scss']
})
export class AccAccountsFeesTabComponent {
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
