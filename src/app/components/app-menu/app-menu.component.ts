import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.css']
})
export class AppMenuComponent {
favorites=false;
fullscreen=false;

constructor(private authService : AuthService) { }

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
}
