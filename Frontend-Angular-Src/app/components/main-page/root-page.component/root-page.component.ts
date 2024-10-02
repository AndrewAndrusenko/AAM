import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppMenuServiceService } from 'Frontend-Angular-Src/app/services/menu-service.service';
import { AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import { indexDBService } from 'Frontend-Angular-Src/app/services/indexDB.service';
import { MatDialog } from '@angular/material/dialog';
import { AtuoCompleteService } from 'Frontend-Angular-Src/app/services/auto-complete.service';
import { AccountingSchemesService } from 'Frontend-Angular-Src/app/services/accounting-schemes.service';
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
    private AccountingSchemesService:AccountingSchemesService,
    ) {
  }
  ngOnInit() {
    this.subscriptionName= this.appMenuService.getToggleTree().subscribe (message => this.opened = message.text );
    this.indexDBServiceS.indexdbDeleteAllCache('AAMCache').subscribe(data => {
      console.log('Cache has been cleared', data)
      this.AccountingSchemesService.subjectTransactionTypePipe.next(null);
      this.AuthServiceS.getObjectStatuses();
    })
  }
  ngOnDestroy() { 
    this.subscriptionName.unsubscribe();
  }
}
