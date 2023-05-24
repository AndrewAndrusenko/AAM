import { HttpClient  } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';
import { InstrumentData, ClientData } from "../models/intefaces";

@Injectable({
  providedIn: 'root'
})
export class AppTabServiceService {
  constructor(private http:HttpClient) { }




}
