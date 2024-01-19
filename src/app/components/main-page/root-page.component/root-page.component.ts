import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppMenuServiceService } from 'src/app/services/menu-service.service';
import { AuthService } from 'src/app/services/auth.service';
import { indexDBService } from 'src/app/services/indexDB.service';
import { MatDialog } from '@angular/material/dialog';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
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
    private AuthServiceS:AuthService,  
    private indexDBServiceS:indexDBService,
    public dialog: MatDialog,
    private AutoCompService:AtuoCompleteService,

    ) {
    this.subscriptionName= this.appMenuService.getToggleTree().subscribe (message => this.opened = message.text );
  }
  async ngOnInit(): Promise<void> {
    this.indexDBServiceS.indexdbDeleteAllCache('AAMCache').subscribe(data => {
      console.log('Cache has been cleared', data)
      this.indexDBServiceS.getIndexDBStaticTables('bcTransactionType_Ext').then ( (data) => console.log('Cache:', data['data'].length,' saved for bcTransactionType_Ext'));
      this.AuthServiceS.getObjectStatuses();
    })
    this.AutoCompService.createSecIDpipe();
    this.AutoCompService.createCurrencypipe();
    this.AutoCompService.createModelPortfoliospipe();

  }
  ngOnDestroy() { 
    this.subscriptionName.unsubscribe();
  }
}
