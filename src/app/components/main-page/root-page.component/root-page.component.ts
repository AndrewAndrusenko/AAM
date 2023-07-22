import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppMenuServiceService } from 'src/app/services/app-menu-service.service';
import { AuthService } from 'src/app/services/auth.service';
import { indexDBService } from 'src/app/services/indexDB.service';
@Component({
  selector: 'app-root-page',
  templateUrl: './root-page.component.html',
  styleUrls: ['./root-page.component.css']
})
export class DashboardComponent implements OnDestroy,OnInit {
  opened: boolean = true;
  private subscriptionName: Subscription;
  color = 'accent';
  checked = false;
  constructor (
    private appMenuService : AppMenuServiceService,
    private indexDBServiceS:indexDBService,

    ) {
    this.subscriptionName= this.appMenuService.getToggleTree().subscribe (message => this.opened = message.text );
  }
  async ngOnInit(): Promise<void> {
    this.indexDBServiceS.indexdbDeleteAllCache('AAMCache').subscribe(data => {
      console.log('Cache has been cleared', data)
      this.indexDBServiceS.getIndexDBStaticTables('bcTransactionType_Ext').then ( (data) => console.log('Cache:', data['data'].length,' saved for bcTransactionType_Ext'));
    })
  }
  ngOnDestroy() { 
    this.subscriptionName.unsubscribe();
  }
}
