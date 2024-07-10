import { Component } from '@angular/core';
import { filter} from 'rxjs';
import { NavigationStart, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  {
  constructor (
    private router:Router  
  ) {}
 /*  ngOnInit() {
    this.router.events
    .pipe(
      filter(event => event instanceof NavigationStart),
      ).subscribe (ev => console.log('NavigationStart'))
  }
 */}
