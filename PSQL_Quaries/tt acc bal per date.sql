with accounts_data as (
select 
"bAccounts"."accountNo" as account_no, 
"bAccounts"."accountId" as account_id, 
dportfolios.idportfolio,
dportfolios.portfolioname,
"bAccounts"."currencyCode" as currency_code
from
"bAccounts"
left join dportfolios on dportfolios.idportfolio="bAccounts".idportfolio
where portfolioname = ANY(select portfolioname from dportfolios )
AND "accountTypeExt"=8
),
turnovers_not_closed_accounting as (
select    
	"bAccountTransaction"."accountId" as account_id,
	SUM("bAccountTransaction"."amountTransaction") FILTER (WHERE "bAccountTransaction"."XactTypeCode" = 1)
	AS "totalCredit",
    SUM("bAccountTransaction"."amountTransaction") FILTER (WHERE "bAccountTransaction"."XactTypeCode" = 2)
	AS "totalDebit"
FROM "bAccountTransaction"
	where "bAccountTransaction"."accountId" = ANY(select account_id from accounts_data)
	AND "dataTime"<='10/30/2023' AND "dataTime">=(SELECT "FirstOpenedDate" 	FROM public."gAppMainParams")
GROUP BY "accountId"
)
select 
(COALESCE("closingBalance",0) + 
 COALESCE(turnovers_not_closed_accounting."totalCredit",0) - 
 COALESCE(turnovers_not_closed_accounting."totalDebit",0))
 ::money as current_balance,
 accounts_data.account_id,
 accounts_data.account_no,
 accounts_data.idportfolio,
accounts_data.portfolioname,
accounts_data.currency_code
from accounts_data
left join turnovers_not_closed_accounting using(account_id)
LEFT JOIN LATERAL 
(select *  from "bAccountStatement"
 where "bAccountStatement"."accountId"=accounts_data.account_id
 Order by "dateAcc" desc
 LIMIT 1
 ) as accounts_statements_data ON TRUE