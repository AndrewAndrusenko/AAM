import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppMenuServiceService } from 'src/app/services/app-menu-service.service';
@Component({
  selector: 'app-dashboard',
  templateUrl: './root-page.html',
  styleUrls: ['./root-page.css']
})
export class DashboardComponent implements OnDestroy {
  opened: boolean = true;
  private subscriptionName: Subscription;
  color = 'accent';
  checked = false;
  constructor (private appMenuService : AppMenuServiceService) {
    this.subscriptionName= this.appMenuService.getToggleTree().subscribe (message => this.opened = message.text );
  }
  ngOnDestroy() { 
    this.subscriptionName.unsubscribe();
  }
}
