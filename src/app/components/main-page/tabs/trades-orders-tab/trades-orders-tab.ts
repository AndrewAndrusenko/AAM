import { Component, ViewChild } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';

@Component({
  selector: 'acc-trades-orders-tab',
  templateUrl: './trades-orders-tab.html',
  styleUrls: ['./trades-orders-tab.scss']
})
export class OrdersTabComponent {
  @ViewChild('tabGroup') tabGroup:MatTabGroup
  constructor ( private TreeMenuSeviceS: TreeMenuSevice) {}
  ngAfterViewInit(): void {
    this.TreeMenuSeviceS.sendActiveTab(this.tabGroup._allTabs['_results'][0].textLabel);
  }
  showTabName (event:MatTabChangeEvent) {
    this.TreeMenuSeviceS.sendActiveTab(event.tab.textLabel.trim());
  }
}
