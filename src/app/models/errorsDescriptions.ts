interface errorsDescription {
  constraintCode: string,
  errorText: string
}
export const dbErrorsMap: errorsDescription[] = [
  { 
    constraintCode: 'cUniqueParentStrategyChildStrategy', 
    errorText: 'Attempt to duplicate an instrument in the model portfolio or duplicate a model portfolio in the strategy. cUniqueParentStrategyChildStrategy blocked data modifying'
  },
  {
    constraintCode:'cFK_dStategiesStructure_ChildID',
    errorText: 'Attempt to delete a model portfolio which has strategies linked to it. cFK_dStategiesStructure_ChildID blocked transaction ' 
  },
  {
    constraintCode: 'cForeignKeyStrategyPortfolios',
    errorText:'Attempt to delete a strategy which has portfolios linked to it. cForeignKeyStrategyPortfolios blocked transaction'
  },
  {
    constraintCode: 'cForeignAcountIdAccountTransaction',
    errorText:'Attempt to delete an account which has entries linked to it. bAccountTransaction blocked transaction'
  },
  {
    constraintCode: 'cForeignKeyInstrumentInModelPortfolio',
    errorText:'Attempt to delete an instrument included in the model portfolio. cForeignKeyInstrumentInModelPortfolio blocked transaction'
  },
  {
    constraintCode: 'cForeignClientKey',
    errorText:'Attempt to delete a client with opened portfolios. cForeignClientKey blocked transaction'
  },
  {
    constraintCode: 'cForeignClientKey',
    errorText:'Attempt to delete a client with opened portfolios. cForeignClientKey blocked transaction'
  },
  {
    constraintCode: 'c_fk_AllocatedTrade_dtrades',
    errorText:'Attempt to delete a trade with an allocated client trades. c_fk_AllocatedTrade_dtrades blocked transaction'
  },
  {
    constraintCode: 'cFkBulkOrders_dorders',
    errorText:'Attempt to unmerge a allocated bulk order. cFkBulkOrders_dorders blocked transaction'
  },
  {
    constraintCode: 'cForeignAllocacatedTrade',
    errorText:'Attempt to delete an allocated trade with generated entries. cForeignAllocacatedTrade blocked transaction'
  },
  {
    constraintCode: 'cFK_dportfolios_benckmarkPortfolio',
    errorText:'Attempt to delete benchmark account for existing strategy. cFK_dportfolios_benckmarkPortfolio blocked transaction'
  },
  {
    constraintCode: 'constraint "i_dfee_transaction_pf_mf"',
    errorText:'Attempt to create duplicate fee calculation. i_dfee_transaction_pf_mf blocked transaction'
  },
  {
    constraintCode: 'unique constraint "u_c_xActTypeCode_Ext"',
    errorText:'Attempt to create duplicate transaction type. The record with such Code and Type already exists. u_c_xActTypeCode_Ext blocked transaction'
  },
]