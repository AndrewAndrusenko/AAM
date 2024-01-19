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
    idfee_scedule :number, 
    fee_type_value :number,
    feevalue :number,
    calculation_period :number, 
    deduction_period :number,
    schedule_range: number[],
    range_parameter:string, 
    below_ranges_calc_type:number, 
    id_fee_main:number, 
    pf_hurdle:number,
    highwatermark:boolean
  `
  let a = obj.split(',').map(el=> {return {fieldName:el.split(':')[0].trim(),displayName:el.split(':')[0].trim()}});
  console.log('obj',a.flat());
  }
}

