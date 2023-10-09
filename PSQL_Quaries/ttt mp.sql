select "bAccounts"."accountNo",dportfolios.portfolioname, 
CASE 
	WHEN "bAccounts".secid NOTNULL THEN "bAccounts".secid
	ELSE  "bAccounts"."currencyCode"::text
END as "instrument",
CASE 
	WHEN "bAccounts".secid NOTNULL THEN 'investment'
	ELSE  'money'
END as "instrument_type",
"bAccountStatement"."dateAcc" as last_closed_day_with_transactions,
turnovers.signed_turnover::money,
COALESCE ("bAccountStatement"."closingBalance",0)::money as last_closed_balance,
(COALESCE(turnovers.signed_turnover,0) + COALESCE ("bAccountStatement"."closingBalance",0))::money as current_balance,
modelportfolio_structure.instrument_corrected_weight
FROM "bAccounts"
left join (SELECT DISTINCT ON ("accountId") "accountId","closingBalance","dateAcc" FROM "bAccountStatement" ORDER BY "accountId", "dateAcc" desc ) 
"bAccountStatement" ON "bAccounts"."accountId" = "bAccountStatement"."accountId"
left join dportfolios on dportfolios.idportfolio = "bAccounts".idportfolio 
left join 
	(select * from f_a_b_positions_current_turnovers_not_closed_by_date(now()::date)) 
as turnovers on turnovers."accountId" = "bAccounts"."accountId"
FULL join
(select * from f_i_model_portfolios_select_mp_structure_for_accounts(ARRAY[7,2,29,25])) 
as modelportfolio_structure ON (modelportfolio_structure.id=dportfolios.idportfolio AND  "bAccounts".secid=modelportfolio_structure.instrument)
where 
	"bAccounts"."accountTypeExt"!=13 AND
	"bAccounts".idportfolio = ANY(ARRAY[7,2,29,25])
