export interface AccountsTableModel {
 idportfolio:number;
 idclient:number;
 idstategy:number;
 sname:string;
 portfolioname:string;
 portleverage:number; 
}
export interface InstrumentData {
  secid :string, 
  shortname :string, 
  name :string,  
  isin :string,  
  listlevel :number, 
  facevalue :number, 
  faceunit :string,
  primary_board_title :string,
  s_qualified_investors :number,
  registryclosedate :string,  
  lotsize :number, 
  price :number, 
  discountl0 :number, 
  discounth0 :number,
  fullcovered :string
}

export interface ClientData {
  idclient: number,
  clientname: string,
  idcountrydomicile: number,
  isclientproffesional: boolean,
  address: string,
  contact_person:string,
  email: string,
  phone: string,
  code : string,
}
