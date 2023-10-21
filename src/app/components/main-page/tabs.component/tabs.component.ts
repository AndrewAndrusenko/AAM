import {Component, OnDestroy } from '@angular/core';
import {Subscription } from 'rxjs';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import {Title} from "@angular/platform-browser";
import {MatTabChangeEvent } from '@angular/material/tabs';
@Component({
  selector: 'app-app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css'],
})
export class AppTabsComponent implements OnDestroy {
  messageReceived ={text:'AAA', name:'', id:0};
  Edit = "Edit"
  private subscriptions = new Subscription();
  constructor (private TreeMenuSevice : TreeMenuSevice, private titleService:Title) {
    this.subscriptions.add (
      this.TreeMenuSevice.getUpdate().subscribe( message => {
        this.messageReceived = message;
        this.titleService.setTitle(message.name)
      })
    )
  }
  ngOnDestroy() { this.subscriptions.unsubscribe()}
  showTabName (event:MatTabChangeEvent) {this.TreeMenuSevice.sendActiveTab(event.tab.textLabel.trim())}
  SetTitle (title) {this.titleService.setTitle(title)}
}
