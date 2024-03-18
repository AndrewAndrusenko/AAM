-- FUNCTION: public.f_a_b_balances_closed_all_v2()

-- DROP FUNCTION IF EXISTS public.f_a_b_balances_closed_all_v2(daterange, numeric[], text[]);

CREATE OR REPLACE FUNCTION public.f_a_b_balances_closed_all_v2(
	p_date_balance_range daterange,
	p_account_types numeric[],
	p_accounts_list text[]
	)
    RETURNS TABLE("accountNo" text, "accountId" integer, "accountType" text, "datePreviousBalance" date, "dateBalance" date, "openingBalance" numeric, "totalCredit" numeric, "totalDebit" numeric, "OutGoingBalance" numeric, "checkClosing" numeric, xacttypecode integer) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT 
"accountNo",  "f_a_b_balance_date_accounts"."accountId", 'Account' as "accountType",
COALESCE ("IncomingBalances"."dateAcc", "f_a_b_balance_date_accounts"."dateAcc") AS "datePreviousBalance",
"f_a_b_balance_date_accounts"."dateAcc" AS "dateBalance",
CAST(coalesce("IncomingBalances"."closingBalance" , 0) AS decimal) AS "openingBalance" ,  
COALESCE ("bAccountStatement"."totalCredit", 0),
COALESCE ( "bAccountStatement"."totalDebit" , 0),
COALESCE ("bAccountStatement"."closingBalance" , "IncomingBalances"."closingBalance",0),
coalesce("IncomingBalances"."closingBalance",0) - COALESCE ("bAccountStatement"."closingBalance" , "IncomingBalances"."closingBalance",0) +
COALESCE (CASE "bcAccountType_Ext"."xActTypeCode"
when 1 THEN ("bAccountStatement"."totalDebit" - "bAccountStatement"."totalCredit")
when 2 THEN ("bAccountStatement"."totalDebit" - "bAccountStatement"."totalCredit")*-1
END, 0) 
as "checkClosing" , "bcAccountType_Ext"."xActTypeCode"
FROM public.f_a_b_balance_date_accounts(p_date_balance_range,	p_account_types,p_accounts_list)
LEFT JOIN "bcAccountType_Ext" ON "f_a_b_balance_date_accounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"
LEFT JOIN "bAccountStatement" 
ON ("f_a_b_balance_date_accounts"."accountId" = "bAccountStatement"."accountId" AND "f_a_b_balance_date_accounts"."dateAcc" = "bAccountStatement"."dateAcc" )
LEFT JOIN LATERAL 
  (SELECT DISTINCT ON("b"."accountId") 
	"b"."accountId", "b"."dateAcc", "b"."closingBalance",
	"b"."totalCredit", "b"."totalDebit" 
	FROM "bAccountStatement" as "b" 
    WHERE "b"."dateAcc" < "f_a_b_balance_date_accounts"."dateAcc" 
	ORDER BY "b"."accountId", "dateAcc" DESC 
  ) AS "IncomingBalances"
ON "f_a_b_balance_date_accounts"."accountId" = "IncomingBalances"."accountId"
UNION
SELECT 
"ledgerNo",  "ledgerNoId", 'Ledger' as "accountType",
COALESCE ("IncomingBalances"."dateAcc", "f_a_b_balance_date_ledger_accounts"."dateAcc"), 
"f_a_b_balance_date_ledger_accounts"."dateAcc",
CAST(coalesce("IncomingBalances"."closingBalance" , 0) AS decimal) AS "openingBalance" , 
coalesce( "bLedgerStatement"."totalCredit",0) , 
coalesce( "bLedgerStatement"."totalDebit",0) , 
coalesce("bLedgerStatement"."closingBalance","IncomingBalances"."closingBalance", 0) ,
coalesce("IncomingBalances"."closingBalance",0) - 
coalesce("bLedgerStatement"."closingBalance","IncomingBalances"."closingBalance", 0) +
coalesce(CASE "bcAccountType_Ext"."xActTypeCode"
when 1 THEN ("bLedgerStatement"."totalDebit" - "bLedgerStatement"."totalCredit")
when 2 THEN ("bLedgerStatement"."totalDebit" - "bLedgerStatement"."totalCredit")*-1
END,0) 
as "checkClosing" , "bcAccountType_Ext"."xActTypeCode"
FROM public.f_a_b_balance_date_ledger_accounts (p_date_balance_range,p_account_types,p_accounts_list)
LEFT JOIN "bLedgerStatement" ON 
("f_a_b_balance_date_ledger_accounts"."ledgerNoId" = "bLedgerStatement"."ledgerID" AND "bLedgerStatement"."dateAcc" = "f_a_b_balance_date_ledger_accounts"."dateAcc" )
LEFT JOIN "bcAccountType_Ext" ON "f_a_b_balance_date_ledger_accounts"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
LEFT JOIN LATERAL 
  (SELECT DISTINCT ON("b"."ledgerID") 
	"b"."ledgerID", "b"."dateAcc", "b"."closingBalance",
	"b"."totalCredit", "b"."totalDebit" 
	FROM "bLedgerStatement" as "b" 
    WHERE "b"."dateAcc" < "f_a_b_balance_date_ledger_accounts"."dateAcc" 
	ORDER BY "b"."ledgerID", "dateAcc" DESC 
  ) AS "IncomingBalances"
ON "f_a_b_balance_date_ledger_accounts"."ledgerNoId" = "IncomingBalances"."ledgerID"
-- WHERE "bLedgerStatement"."dateAcc" IS NOT NULL
ORDER BY 5 DESC, "accountNo" 
$BODY$;

ALTER FUNCTION public.f_a_b_balances_closed_all_v2(daterange, numeric[], text[])
    OWNER TO postgres;
select * from  f_a_b_balances_closed_all_v2('[3/9/2024,3/9/2024]'::daterange,array[8,10],null)
