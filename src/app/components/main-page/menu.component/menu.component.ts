import { Component, Input } from '@angular/core';
import { menuColorGl } from 'src/app/models/constants.model';
import { AppMenuServiceService } from 'src/app/services/menu-service.service';
import { AuthService } from 'src/app/services/auth.service';
import { indexDBService } from 'src/app/services/indexDB.service';

@Component({
  selector: 'app-app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class AppMenuComponent {
@Input()  treeOpened : boolean = true;
fullscreen : boolean = false;
public menuColor = menuColorGl
constructor(
  private authService : AuthService, 
  private appMenuService : AppMenuServiceService,
  private indexDBServiceS:indexDBService,
  ) { }

  public getLogin = () => {
    let userData = JSON.parse(localStorage.getItem ('userInfo'));
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
  showChart () {}
  indexdbDeleteAllCache (){
    this.indexDBServiceS.indexdbDeleteAllCache('AAMCache')
  }
  nodecls (){
    this.authService.nodeTerminalClear().subscribe(data=>console.log('nodeTerminalClear',data))
  }
  tools () {
    let obj = `
    out_date:Date,
    idtrade:number,
    tr_type:number,
    qty:number,
    qty_out:number,
    price_in:number,
    price_out:number,
    closed:boolean,
    idportfolio:number,
    trade_date:Date,
    id:number,
    generated:Date,
    profit_loss:number,
    id_sell_trade:number,
    id_buy_trade:number,
    secid:string,
  `
  let a = obj.split(',').map(el=> {return {fieldName:el.split(':')[0].trim(),displayName:el.split(':')[0].trim()}});
  console.log('obj',a.flat());
  }
}

