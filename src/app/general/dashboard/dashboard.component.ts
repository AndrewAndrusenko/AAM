import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppMenuServiceService } from 'src/app/services/app-menu-service.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnDestroy {
  opened: boolean = true;
  private subscriptionName: Subscription;
  color = 'accent';
  checked = false;


constructor (private appMenuService : AppMenuServiceService) {
  this.subscriptionName= this.appMenuService.getToggleTree().subscribe (message => this.opened = message.text );
}
ngOnDestroy() { // It's a good practice to unsubscribe to ensure no memory leaks
  this.subscriptionName.unsubscribe();
}

}
