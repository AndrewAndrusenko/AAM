interface errorsDescription {
  constraintCode: string,
  errorText: string
}
export const dbErrorsMap: errorsDescription[] = [
  { 
    constraintCode: 'cUniqueParentStrategyChildStrategy', 
    errorText: '\nAttempt to duplicate an instrument in the model portfolio or duplicate a model portfolio in the strategy\ncUniqueParentStrategyChildStrategy blocked data modifying'
  },
  {
    constraintCode:'cFK_dStategiesStructure_ChildID',
    errorText: '\nAttempt to delete a model portfolio which has strategies linked to it\ncFK_dStategiesStructure_ChildID blocked transaction ' 
  },
  {
    constraintCode: 'cForeignKeyStrategyPortfolios',
    errorText:'\nAttempt to delete a strategy which has portfolios linked to it\ncForeignKeyStrategyPortfolios blocked transaction'
  },
  {
    constraintCode: 'cForeignAcountIdAccountTransaction',
    errorText:'\nAttempt to delete an account which has entries linked to it\nbAccountTransaction blocked transaction'
  },
  {
    constraintCode: 'cForeignKeyInstrumentInModelPortfolio',
    errorText:'\nAttempt to delete an instrument included in the model portfolio\ncForeignKeyInstrumentInModelPortfolio blocked transaction'
  },
  {
    constraintCode: 'cForeignClientKey',
    errorText:'\nAttempt to delete a client with opened portfolios\ncForeignClientKey blocked transaction'
  },
  {
    constraintCode: 'cForeignClientKey',
    errorText:'\nAttempt to delete a client with opened portfolios\ncForeignClientKey blocked transaction'
  },
  {
    constraintCode: 'c_fk_AllocatedTrade_dtrades',
    errorText:'\nAttempt to delete a trade with an allocated client trades\nc_fk_AllocatedTrade_dtrades blocked transaction'
  },
  {
    constraintCode: 'cFkBulkOrders_dorders',
    errorText:'\nAttempt to unmerge a allocated bulk order\ncFkBulkOrders_dorders blocked transaction'
  },
  {
    constraintCode: 'cForeignAllocacatedTrade',
    errorText:'\nAttempt to delete an allocated trade with generated entries\ncForeignAllocacatedTrade blocked transaction'
  },
  {
    constraintCode: 'cFK_dportfolios_benckmarkPortfolio',
    errorText:'\nAttempt to delete benchmark account for existing strategy\ncFK_dportfolios_benckmarkPortfolio blocked transaction'
  },
  {
    constraintCode: 'constraint "i_dfee_transaction_pf_mf"',
    errorText:'\nAttempt to create duplicate fee calculation\ni_dfee_transaction_pf_mf blocked transaction'
  },
  {
    constraintCode: 'unique constraint "u_c_xActTypeCode_Ext"',
    errorText:'\nAttempt to create duplicate transaction type.\nThe record with such Code and Type already exists.\nu_c_xActTypeCode_Ext blocked transaction'
  },
  {
    constraintCode: 'violates unique constraint "unique_leverage_restriction"',
    errorText:'\nAttempt to create duplicate leverage restriction\nunique_leverage_restriction blocked transaction'
  },
  {
    constraintCode: 'violates unique constraint "unique_security_type_restriction"',
    errorText:'\nAttempt to create duplicate security type restriction\nunique_security_type_restriction blocked transaction'
  },
  {
    constraintCode: 'violates unique constraint "unique_listing_secid_restriction"',
    errorText:'\nAttempt to create duplicate listing or instrument restriction\nunique_listing_secid_restriction blocked transaction'
  },
  {
    constraintCode: 'insert or update on table "bAccountTransaction" violates foreign key constraint "cForeignLedgerId"',
    errorText:'\nAttempt to create an AL entry with incorrect ledger account id.\nPlease verify the relevant account scheme.\nForeignLedgerId blocked transaction.'
  },
  {
    constraintCode: 'insert or update on table "bAccountTransaction" violates foreign key constraint "cForeignAcountIdAccountTransaction"',
    errorText:'\nAttempt to create an AL entry with incorrect account id.\nPlease verify the relevant account scheme.\cForeignAcountIdAccountTransaction blocked transaction.'
  },
  {
    constraintCode: 'insert or update on table "bLedgerTransactions" violates foreign key constraint "cForeignLedgerId"',
    errorText:'\nAttempt to create an LL entry with incorrect ledger id.\nPlease verify the relevant account scheme.\cForeignLedgerId blocked transaction.'
  },
  {
    constraintCode: 'insert or update on table "bLedgerTransactions" violates foreign key constraint "cForeignLedgerDebitId"',
    errorText:'\nAttempt to create an LL entry with incorrect ledger id.\nPlease verify the relevant account scheme.\cForeignLedgerDebitId blocked transaction.'
  },
  {
    constraintCode: 'error: new row violates row-level security policy',
    errorText:'\nYou are not allowed to create transactions.\nPlease verify priveliges for your access role.\nRLS blocked transaction.'
  },
]