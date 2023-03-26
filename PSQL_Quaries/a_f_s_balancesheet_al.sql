-- FUNCTION: public.f_bbalancesheet(date)

--DROP FUNCTION IF EXISTS public.f_s_balancesheet_all();

CREATE OR REPLACE FUNCTION public.f_s_balancesheet_all()
    RETURNS TABLE("accountNo" text, "accountId" integer, "accountType" text, "datePreviousBalance" date, 
				  "dateBalance" date, "openingBalance" numeric, "totalCredit" numeric, "totalDebit" numeric, "OutGoingBalance" numeric, "checkClosing" numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT 
"accountNo",  "vbBalanceDateAccounts"."accountId", 'Account' as "accountType",
COALESCE ("IncomingBalances"."dateAcc", "bAccountStatement"."dateAcc") AS "datePreviousBalance",
"vbBalanceDateAccounts"."dateAcc" AS "dateBalance",
CAST(coalesce("IncomingBalances"."closingBalance" , 0) AS numeric) AS "openingBalance" ,  
COALESCE ("bAccountStatement"."totalCredit", 0),
COALESCE ( "bAccountStatement"."totalDebit" , 0),
COALESCE ("bAccountStatement"."closingBalance" , 0),
(coalesce("IncomingBalances"."closingBalance",0) - "bAccountStatement"."closingBalance") +
CASE "bcAccountType_Ext"."xActTypeCode"
when 1 THEN ("bAccountStatement"."totalDebit" - "bAccountStatement"."totalCredit")
when 2 THEN ("bAccountStatement"."totalDebit" - "bAccountStatement"."totalCredit")*-1
END 
as "checkClosing"
FROM public."vbBalanceDateAccounts"
LEFT JOIN "bcAccountType_Ext" ON "vbBalanceDateAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"
LEFT JOIN "bAccountStatement" 
ON ("vbBalanceDateAccounts"."accountId" = "bAccountStatement"."accountId" AND "vbBalanceDateAccounts"."dateAcc" = "bAccountStatement"."dateAcc" )
LEFT JOIN LATERAL 
  (SELECT DISTINCT ON("b"."accountId") 
	"b"."accountId", "b"."dateAcc", "b"."closingBalance",
	"b"."totalCredit", "b"."totalDebit" 
	FROM "bAccountStatement" as "b" 
    WHERE "b"."dateAcc" < "vbBalanceDateAccounts"."dateAcc" 
	ORDER BY "b"."accountId", "dateAcc" DESC 
  ) AS "IncomingBalances"
ON "vbBalanceDateAccounts"."accountId" = "IncomingBalances"."accountId"
UNION
SELECT 
"ledgerNo",  "ledgerNoId", 'Ledger' as "accountType",
COALESCE ("IncomingBalances"."dateAcc", "vbBalanceDateLedger"."dateAcc"), 
"vbBalanceDateLedger"."dateAcc",
CAST(coalesce("IncomingBalances"."closingBalance" , 0) AS numeric) AS "openingBalance" , 
 "bLedgerStatement"."totalCredit" , 
 "bLedgerStatement"."totalDebit" , 
"bLedgerStatement"."closingBalance" ,
(coalesce("IncomingBalances"."closingBalance",0) - "bLedgerStatement"."closingBalance") +
CASE "bcAccountType_Ext"."xActTypeCode"
when 1 THEN ("bLedgerStatement"."totalDebit" - "bLedgerStatement"."totalCredit")
when 2 THEN ("bLedgerStatement"."totalDebit" - "bLedgerStatement"."totalCredit")*-1
END 
as "checkClosing"
FROM public."vbBalanceDateLedger"
LEFT JOIN "bLedgerStatement" ON 
("vbBalanceDateLedger"."ledgerNoId" = "bLedgerStatement"."ledgerID" AND "bLedgerStatement"."dateAcc" = "vbBalanceDateLedger"."dateAcc" )
LEFT JOIN "bcAccountType_Ext" ON "vbBalanceDateLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
LEFT JOIN LATERAL 
  (SELECT DISTINCT ON("b"."ledgerID") 
	"b"."ledgerID", "b"."dateAcc", "b"."closingBalance",
	"b"."totalCredit", "b"."totalDebit" 
	FROM "bLedgerStatement" as "b" 
    WHERE "b"."dateAcc" < "bLedgerStatement"."dateAcc" 
	ORDER BY "b"."ledgerID", "dateAcc" DESC 
  ) AS "IncomingBalances"
ON "vbBalanceDateLedger"."ledgerNoId" = "IncomingBalances"."ledgerID"
-- WHERE "bLedgerStatement"."dateAcc" IS NOT NULL
ORDER BY 5 DESC, "accountNo" 
$BODY$;

ALTER FUNCTION public.f_s_balancesheet_all()
    OWNER TO postgres;
