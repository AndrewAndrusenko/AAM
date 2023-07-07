import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
import {Title} from "@angular/platform-browser";
import { indexDBService } from 'src/app/services/indexDB.service';
@Component({
  selector: 'app-app-tabs',
  templateUrl: './app-tabs.component.html',
  styleUrls: ['./app-tabs.component.css'],

})
export class AppTabsComponent implements OnDestroy {

  messageReceived ={text:'AAA', name:'', id:0};
  Edit = "Edit"
  private subscriptionName: Subscription; //important to create a subscription
 
constructor (private TreeMenuSevice : TreeMenuSevice, private titleService:Title,  private indexDBServiceS:indexDBService) {
/*   this.indexDBServiceS.getIndexDBStaticTables('bcTransactionType_Ext').then ( (data) => console.log('Cache:', data['data'].length,' saved for bcTransactionType_Ext')); */
  this.subscriptionName= this.TreeMenuSevice.getUpdate().subscribe( (message) => {
    this.messageReceived = message;
    this.titleService.setTitle(message.name)
  })
  }
   ngOnDestroy() { // It's a good practice to unsubscribe to ensure no memory leaks
      this.subscriptionName.unsubscribe();
  }

 SetTitle (title) {
  this.titleService.setTitle(title)
 }
}
