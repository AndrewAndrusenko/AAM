export interface restrictionsData {
  id :number, 
  portfolioname :string, 
  idportfolio :number, 
  restriction_type_id: number, 
  value: number, 
  param :string,
  object_code :string, 
  object_id: number, 
  object_description :string
}
export interface dRestrictionsObjects{
  id:number,object_id:number,object_group:number,object_code:string,object_description:string,object_owner:string
}
export interface restrictionsVerification{
  id :number,
  code :string,
  mp_name :string,
  rest_type :string,
  param :string,
  restrictinon :number,
  act_violation_and_orders :number,
  act_violation :number,
  mp_violation :number,
  act_weight_and_orders :number,
  act_weight :number,
  mp_weight :number,
  sum_weight :number,
  act_mtm :number,
  npv :number,
  net_orders:number ,
  id_order :number, 
  order_qty :number, 
  parent_order :number
}
export interface restrictionVerificationAllocation extends restrictionsVerification {
  new_wgt :number, new_viol :number, new_mtm :number
}