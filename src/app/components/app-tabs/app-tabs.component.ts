import { Component,Input,OnChanges, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';

@Component({
  selector: 'app-app-tabs',
  templateUrl: './app-tabs.component.html',
  styleUrls: ['./app-tabs.component.css']
})
export class AppTabsComponent implements OnDestroy {
  messageReceived ={text:'AAA'};
        private subscriptionName: Subscription; //important to create a subscription
    
        constructor(private TreeMenuSevice : TreeMenuSevice) {
            // subscribe to sender component messages
            this.subscriptionName= this.TreeMenuSevice.getUpdate().subscribe
             (message => { //message contains the data sent from service
             this.messageReceived = message;
             //console.log(this.messageReceived,'ddd')
             });
        }
    
        ngOnDestroy() { // It's a good practice to unsubscribe to ensure no memory leaks
            this.subscriptionName.unsubscribe();
        }
 
}
