import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppMenuServiceService } from 'src/app/services/app-menu-service.service';
import { indexDBService } from 'src/app/services/indexDB.service';
@Component({
  selector: 'app-dashboard',
  templateUrl: './root-page.html',
  styleUrls: ['./root-page.css']
})
export class DashboardComponent implements OnDestroy,OnInit {
  opened: boolean = true;
  private subscriptionName: Subscription;
  color = 'accent';
  checked = false;
  constructor (
    private appMenuService : AppMenuServiceService,
    private indexDBServiceS:indexDBService
    ) {
    this.subscriptionName= this.appMenuService.getToggleTree().subscribe (message => this.opened = message.text );
  }
  ngOnInit(): void {
    this.indexDBServiceS.indexdbDeleteAllCache('AAMCache')
  }
  ngOnDestroy() { 
    this.subscriptionName.unsubscribe();
  }
}
