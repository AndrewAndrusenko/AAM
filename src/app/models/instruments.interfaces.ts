export interface moexBoard {
  boardid:string,
  board_title:string
}
export interface moexSecurityType {
  id:number, 
  security_type_name:string, 
  security_type_title:string, 
  security_group_name:string,
  price_type:number
}
export interface corporateActionsTypes {
  id: number, 
  name: string, 
  sectype: number[], 
  ismandatory: boolean, 
  ratetype: string, 
  fixedrate: boolean
}
export interface moexSecurityGroup {
  name:string,
  title:string 
}
export interface instrumentDetails {
  secid: string, boardid: string, shortname: string, lotsize: number, facevalue: number, status: string, boardname: string, decimals: number, matdate: Date, secname: string, couponperiod: string, issuesize: number, remarks: string, marketcode: string, instrid: string, sectorid: string, minstep: number, faceunit: number, isin: string, latname: string, regnumber: string, currencyid: string, sectype: string, listlevel: number, issuesizeplaced: number, couponpercent: string, lotvalue: number, nextcoupon: string, issuevolume:number,id: number
}
export interface instrumentCorpActions {
  id: number, isin: string, issuevolume: number, secname: string, notinal: number, notinalcurrency: string, unredemeedvalue: number, couponrate: number, couponamount: number, actiontype: string, couponamountrur: number, date: Date, action: string, actiontypename: string
}
export interface instrumentShort {
  secid:string,
  group:string,
  type:string,
  groupid:number
}
export interface Instruments  {
  id :number,
  groupid: number,
  secid: string, 
  security_type_title: string,
  stock_type: number, 
  security_type_name: string, 
  shortname: string, 
  primary_boardid: string, 
  board_title: string, 
  title: string,
  category: string, 
  name: string, 
  isin: string, 
  emitent_title: string, 
  emitent_inn: string, 
  type: string, 
  group: string, 
  marketprice_boardid: string,
  group_title: string,
  security_group_name: string,
  action: string,
  faceunit: string, 
  facevalue: number, 
  maturitydate: Date, 
  regnumber: string 
}