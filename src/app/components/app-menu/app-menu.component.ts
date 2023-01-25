import { Component } from '@angular/core';
import { AppMenuServiceService } from 'src/app/services/app-menu-service.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.css']
})
export class AppMenuComponent {
treeOpened : boolean = true;
fullscreen : boolean = false;

constructor(private authService : AuthService, private appMenuService : AppMenuServiceService) { }

public getLogin = () => {
  var userData;
  userData = JSON.parse(localStorage.getItem ('userInfo'));
  return userData.user.login +" (AR: " +userData.user.accessrole+ ")"
}

toggleFullscreenMode = () => {
  var elem = document.documentElement;
  this.fullscreen ? document.exitFullscreen() : elem.requestFullscreen();
  this.fullscreen=!this.fullscreen;
}
LogOut = () => {
  this.authService.LogOut();
  window.location.reload();
}

showHideTree = () => {
this.treeOpened = !this.treeOpened
this.appMenuService.sendToggleTree(this.treeOpened)
}
}
