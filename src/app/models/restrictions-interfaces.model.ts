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