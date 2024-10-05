import { Component, Input } from '@angular/core';
import { AppMenuServiceService } from 'Frontend-Angular-Src/app/services/menu-service.service';
import { AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import { indexDBService } from 'Frontend-Angular-Src/app/services/indexDB.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class AppMenuComponent {
@Input()  treeOpened : boolean = true;
fullscreen : boolean = false;
constructor(
  private authService : AuthService, 
  private appMenuService : AppMenuServiceService,
  private indexDBServiceS:indexDBService,
  private router:Router
  ) { }
  public getLogin = () => {
    let userData = JSON.parse(localStorage.getItem ('userInfo'));
    return userData? userData.user.login +" (AR: " +userData.user.accessrole+ ")":null;
  }
  toggleFullscreenMode = () => {
    var elem = document.documentElement;
    this.fullscreen ? document.exitFullscreen() : elem.requestFullscreen();
    this.fullscreen=!this.fullscreen;
  }
  navigateToTree (link:string) {
    this.router.navigate([link]);
    // this.TreeMenuSeviceS.sendUpdate('Clients', element.clientname, element.idclient,'Edit')
  }
  LogOut = () => {
    console.log('LogOut cpm',);
    this.authService.LogOut();
  }
  showHideTree = () => {
    this.treeOpened = !this.treeOpened
    this.appMenuService.sendToggleTree(this.treeOpened)
  }

  indexdbDeleteAllCache (){
    this.indexDBServiceS.indexdbDeleteAllCache('AAMCache')
  }

}

