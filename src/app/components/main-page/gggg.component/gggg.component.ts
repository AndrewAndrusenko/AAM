import { Component, HostListener} from '@angular/core';


@Component({
  selector: 'app-gggg',
  templateUrl: './gggg.component.html',
  styleUrls: ['./gggg.component.css']
})
export class AppGGGGComponent {
drawInt:NodeJS.Timer;
sphere:HTMLElement;
initTop:any;
initLeft:any;
@HostListener('document:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) { 

  if (event.key==='ArrowRight') {
    this.forceStop();  
    this.drawInt = setInterval(()=>{this.sphere.style.left= parseInt(this.sphere.style.left,10)+2+'px'},10)
  }
  if (event.key==='ArrowLeft') {
    this.forceStop();  
    this.drawInt = setInterval(()=>{this.sphere.style.left= parseInt(this.sphere.style.left,10)-2+'px'},10)
  }
  if (event.key==='ArrowUp') {
    this.forceStop();  
    this.drawInt = setInterval(()=>{this.sphere.style.top= parseInt(this.sphere.style.top,10)-2+'px'},10)
  }
  if (event.key==='ArrowDown') {
    this.forceStop();  
    this.drawInt = setInterval(()=>{this.sphere.style.top= parseInt(this.sphere.style.top,10)+2+'px'},10)
  }
}
constructor(
  ) { }

ngAfterViewInit(): void {
 this.sphere = document.getElementById('sphere')
this.initTop = this.sphere.style.top;
this.initLeft = this.sphere.style.left;
  
}
forceStop() {
  clearInterval(this.drawInt)
}
toStart() {
 this.sphere.style.top = this.initTop;
 this.sphere.style.left = this.initLeft;
}
mainFunc () {
if (this.drawInt) {
  clearInterval(this.drawInt);
  this.drawInt=null
} else {
  this.drawInt = setInterval(()=>{this.sphere.style.top= parseInt(this.sphere.style.top,10)+2+'px'},10)
}
//  this.drawInt = setInterval(()=>{this.sphere.style.top= parseInt(this.sphere.style.top,10)+2+'px'},10)
/*  while (parseInt(sphere.style.top,10)<200) {
  sphere.style.top= parseInt(sphere.style.top,10)+2+'px'
  
 } */
/*  for (let index = 0; index < 600; index++) {
  setTimeout(() => {
    sphere.style.top= parseInt(sphere.style.top,10)+2+'px'
    }, index*10);
  
 } */
/*  while (parseInt(sphere.style.top,10)<200) {
  setTimeout(() => {
    sphere.style.top= parseInt(sphere.style.top,10)+1+'px'
    }, 500);
 } */

}
  }

