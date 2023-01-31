import { Component,Input,OnChanges, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
import {Title} from "@angular/platform-browser";
@Component({
  selector: 'app-app-tabs',
  templateUrl: './app-tabs.component.html',
  styleUrls: ['./app-tabs.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AppTabsComponent implements OnDestroy {
  messageReceived ={text:'AAA', name:'', id:0};
  private subscriptionName: Subscription; //important to create a subscription
 
constructor (private TreeMenuSevice : TreeMenuSevice, private titleService:Title) {
  this.subscriptionName= this.TreeMenuSevice.getUpdate().subscribe( (message) => {
    console.log('message',message)
    this.messageReceived = message;
    this.titleService.setTitle(message.name)
  })
  }
   ngOnDestroy() { // It's a good practice to unsubscribe to ensure no memory leaks
      this.subscriptionName.unsubscribe();
  }
  handleChange (event) {
    console.log('load form',event)
  }
 SetTitle (title) {
  this.titleService.setTitle(title)
 }
}
