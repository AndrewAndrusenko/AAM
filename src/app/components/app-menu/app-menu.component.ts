import { Component } from '@angular/core';

@Component({
  selector: 'app-app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.css']
})
export class AppMenuComponent {
favorites=false;
fullscreen=false;
toggleFullscreenMode = () => {
  var elem = document.documentElement;
  this.fullscreen ? document.exitFullscreen() : elem.requestFullscreen();
  this.fullscreen=!this.fullscreen;

}
}
