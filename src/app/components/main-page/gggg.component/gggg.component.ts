import { Component, HostListener} from '@angular/core';


@Component({
  selector: 'app-gggg',
  templateUrl: './gggg.component.html',
  styleUrls: ['./gggg.component.css']
})
export class AppGGGGComponent {
drawInt:NodeJS.Timer;
sphere:HTMLElement;
star:HTMLElement;
initTop:any;
initLeft:any;
@HostListener('document:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) { 

  if (event.key==='ArrowRight') {

    this.forceStop();  
    this.drawInt = setInterval(()=>{this.sphere.style.left= parseInt(this.sphere.style.left,10)+2+'px'},10)
    for (let index = 2; index < 8; index++) {
      let bi:string;
      bi='url(assets/star'+index+'.JPG)';
      if (index===7) {
        setTimeout(() => {
          this.star.style.left=parseInt(this.star.style.left,10)+118+'px'
          this.star.style.backgroundImage='url(assets/star1.JPG)';
          console.log('backgroundImage',this.star.style.backgroundImage,this.star.style.left);
        }, 20*(index-1));
      } 
      else {
        setTimeout(() => {
          this.star.style.backgroundImage=bi;
          console.log('backgroundImage',this.star.style.backgroundImage);
        }, 20*(index-1));
      }
    }

  }

  if (event.key==='ArrowLeft') {
    for (let index = 6; index > 0; index--) {
      let bi:string;
      bi='url(assets/star'+index+'.JPG)';
      if (index===6) {
        setTimeout(() => {
          this.star.style.left=parseInt(this.star.style.left,10)-118+'px'
          this.star.style.backgroundImage='url(assets/star6.JPG)';
          console.log('backgroundImage',this.star.style.backgroundImage,this.star.style.left);
        }, 20*(6-index+1));
      } 
      else {
        setTimeout(() => {
          this.star.style.backgroundImage=bi;
          console.log('backgroundImage',this.star.style.backgroundImage);
        }, 20*(6-index+1));
      }
    }
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
 this.star = document.getElementById('star')
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

