import { Component, ViewChild } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
@Component({
  selector: 'acc-transactions-tab',
  templateUrl: './transactions-tab.html',
  styleUrls: ['./transactions-tab.scss']
})
export class AccTransactionsTabComponent {
  @ViewChild('tabGroup') tabGroup:MatTabGroup
  constructor ( private TreeMenuSevice: TreeMenuSevice) {}
  ngAfterViewInit(): void {
    this.TreeMenuSevice.sendActiveTab(this.tabGroup._allTabs['_results'][0].textLabel);
  }
  showTabName (event:MatTabChangeEvent) {
    this.TreeMenuSevice.sendActiveTab(event.tab.textLabel.trim());
  }
}
