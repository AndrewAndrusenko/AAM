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
export interface StrategiesGlobalData {
  id: number, 
  name : string, 
  stype : number,
  Level : number,
  description: string, 
  s_benchmark_account: number,
  'Benchmark Account': string, 
}
export interface StrategyStructure {
  id_strategy_parent: number, 
  id : number, 
  sname : string,
  description: string;
  weight_of_child : number,
  id_item:number,
}
export interface accountTypes {
  typeCode: string, 
  typeValue: string,
  typeDescription: string
}

export interface SWIFTStatement950model {
  msgId: number,
  amountTransaction: number,
  typeTransaction: string, 
  valueDate: string,
  comment: string, 
  entryAllocatedId: number,
  refTransaction: string
}
export interface SWIFTSGlobalListmodel {
  id: number, 
  msgId: number, 
  senderBIC: string, 
  DateMsg: string, 
  typeMsg: string,
  accountNo: string,
  ledgerNo:string
}
export interface bcTransactionType_Ext {
  id: number, 
  xActTypeCode_Ext: string, 
  description: string, 
  code2: string,
}
export interface bcParametersSchemeAccTrans {
  pRef : string,
  pAccountNo : string,
  pLedgerNo: string,
  pAmount: number,
  pSenderBIC: string,
  pRefTransaction: string,
  pDate_T: string,
  cxActTypeCode_Ext:string,
  cxActTypeCode: string,
  cLedgerType: string
}