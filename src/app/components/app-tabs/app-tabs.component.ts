import { Component,Input,OnChanges, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/services/mtree.service';

@Component({
  selector: 'app-app-tabs',
  templateUrl: './app-tabs.component.html',
  styleUrls: ['./app-tabs.component.css']
})
export class AppTabsComponent implements OnDestroy {
  messageReceived ={text:'AAA'};
        private subscriptionName: Subscription; //important to create a subscription
    
        constructor(private Service: CommonService) {
            // subscribe to sender component messages
            this.subscriptionName= this.Service.getUpdate().subscribe
             (message => { //message contains the data sent from service
             this.messageReceived = message;
             console.log(this.messageReceived,'ddd')
             });
        }
    
        ngOnDestroy() { // It's a good practice to unsubscribe to ensure no memory leaks
            this.subscriptionName.unsubscribe();
        }
 
}
