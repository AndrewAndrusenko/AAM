PGDMP     ;    )                {            AAM_DB    13.8    13.8 1   �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            �           1262    41950    AAM_DB    DATABASE     l   CREATE DATABASE "AAM_DB" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'English_United States.1252';
    DROP DATABASE "AAM_DB";
                postgres    false                        3079    42059    pgcrypto 	   EXTENSION     <   CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
    DROP EXTENSION pgcrypto;
                   false            �           0    0    EXTENSION pgcrypto    COMMENT     <   COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';
                        false    2            @           1255    51376 ,   f_accounts_balance_closure_select_data(date)    FUNCTION     }  CREATE FUNCTION public.f_accounts_balance_closure_select_data(dateb date) RETURNS TABLE("accountId" integer, "dateAcc" date, "openingBalance" money, "totalCredit" money, "totalDebit" money, "closingBalance" money)
    LANGUAGE sql
    AS $_$
SELECT 
"bAccountTransaction"."accountId", "dataTime"::date, "IncomingBalances"."closingBalance" AS "openingBalance",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 1) AS MONEY),'$0') AS "totalCredit",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 2) AS MONEY),'$0') AS "totalDebit",
CAST(SUM (
	CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
		WHEN 3 THEN "amountTransaction"
		ELSE "amountTransaction"*-1
	END 
) + "IncomingBalances"."closingBalance" AS MONEY)  AS "closingBalance"
FROM public."bAccountTransaction" 
LEFT JOIN "bAccounts"
ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
LEFT JOIN "bcAccountType_Ext" ON "bAccounts"."accountTypeExt" = "bcAccountType_Ext"."xActTypeCode"
LEFT JOIN (
	SELECT DISTINCT ON ("bAccountStatement"."accountId") 
	"bAccountStatement"."accountId", "bAccountStatement"."dateAcc"::date, "bAccountStatement"."closingBalance",
	"bAccountStatement"."totalCredit", "bAccountStatement"."totalDebit"
	 FROM "bAccountStatement" 
	 WHERE "bAccountStatement"."dateAcc" < $1 ORDER BY "bAccountStatement"."accountId","dateAcc"::date DESC ) AS "IncomingBalances"
ON ("bAccountTransaction"."accountId" = "IncomingBalances"."accountId")
WHERE "bAccountTransaction"."dataTime"::date = $1::date
GROUP BY "bAccountTransaction"."accountId", "dataTime"::date, "IncomingBalances"."closingBalance";

$_$;
 I   DROP FUNCTION public.f_accounts_balance_closure_select_data(dateb date);
       public          postgres    false            ?           1255    51312 )   f_basic_balance_sheet_witout_parameters()    FUNCTION       CREATE FUNCTION public.f_basic_balance_sheet_witout_parameters() RETURNS TABLE("accountId" integer, "dateAccounting" date, "accountNo" text, "accountType" integer, closingbalance money)
    LANGUAGE sql
    AS $$

SELECT DISTINCT  "bAccounts"."accountId",  "statementsAcconts"."dateAcc", "bAccounts"."accountNo","bcAccountType_Ext"."xActTypeCode", "closingBalance" 
FROM "bAccounts"
LEFT JOIN "bcAccountType_Ext" ON "bAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"
CROSS JOIN (SELECT DISTINCT "bAccountStatement"."dateAcc" FROM "bAccountStatement") AS "statementsAcconts"
LEFT JOIN LATERAL (
	SELECT DISTINCT ON ("bAccountStatement"."accountId") 
	"bAccountStatement"."accountId", "bAccountStatement"."dateAcc", "bAccountStatement"."closingBalance"
	FROM "bAccountStatement" 
	WHERE "bAccountStatement"."dateAcc" <= "statementsAcconts"."dateAcc" 
	ORDER BY "bAccountStatement"."accountId","dateAcc" DESC ) AS "Balances"
 ON "bAccounts"."accountId" = "Balances"."accountId"

UNION

SELECT DISTINCT  "bLedger"."ledgerNoId",  "statementsAcconts"."dateAcc", "bLedger"."ledgerNo","bcAccountType_Ext"."xActTypeCode", "closingBalance" 
FROM "bLedger"
LEFT JOIN "bcAccountType_Ext" ON "bLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
CROSS JOIN (SELECT DISTINCT "bLedgerStatement"."dateAcc" FROM "bLedgerStatement") AS "statementsAcconts"
LEFT JOIN LATERAL (
	SELECT DISTINCT ON ("bLedgerStatement"."ledgerID") 
	"bLedgerStatement"."ledgerID", "bLedgerStatement"."dateAcc", "bLedgerStatement"."closingBalance"
	FROM "bLedgerStatement" 
	WHERE "bLedgerStatement"."dateAcc" <= "statementsAcconts"."dateAcc" 
	ORDER BY "bLedgerStatement"."ledgerID","dateAcc" DESC ) AS "Balances"
 ON "bLedger"."ledgerNoId" = "Balances"."ledgerID"
ORDER BY "dateAcc", "accountNo"

$$;
 @   DROP FUNCTION public.f_basic_balance_sheet_witout_parameters();
       public          postgres    false            B           1255    51616 "   f_bbalancesheet_lastmovement(date)    FUNCTION     I
  CREATE FUNCTION public.f_bbalancesheet_lastmovement(dateb date) RETURNS TABLE("accountNo" text, "accountId" integer, "accountType" text, "dataTime" date, "openingBalance" money, "totalCredit" money, "totalDebit" money, "OutGoingBalance" money, "lastMovement" date)
    LANGUAGE sql
    AS $_$
SELECT 
"ledgerNo",  "ledgerNoId", 'Ledger' as "accountType",
coalesce("bLedgerStatement"."dateAcc", $1),
coalesce("IncomingBalances"."closingBalance" , 0) AS "openingBalance" , 
coalesce("bLedgerStatement"."totalCredit", "IncomingBalances"."totalCredit"), 
coalesce("bLedgerStatement"."totalDebit", "IncomingBalances"."totalDebit"), 
coalesce("bLedgerStatement"."closingBalance", "IncomingBalances"."closingBalance"),
coalesce("bLedgerStatement"."dateAcc", "IncomingBalances"."dateAcc") AS "lastMovement"
	FROM public."bLedger"
	LEFT JOIN "bLedgerStatement" ON ("bLedger"."ledgerNoId" = "bLedgerStatement"."ledgerID" AND "bLedgerStatement"."dateAcc" = $1)
	LEFT JOIN (SELECT DISTINCT ON("bLedgerStatement"."ledgerID") 
			   "bLedgerStatement"."ledgerID", "bLedgerStatement"."dateAcc", "bLedgerStatement"."closingBalance",
			   "bLedgerStatement"."totalCredit", "bLedgerStatement"."totalDebit" 
		  FROM "bLedgerStatement" WHERE "bLedgerStatement"."dateAcc" < $1 ORDER BY "bLedgerStatement"."ledgerID", "dateAcc" DESC ) AS "IncomingBalances"
		  ON "bLedger"."ledgerNoId" = "IncomingBalances"."ledgerID"

UNION
SELECT 
"accountNo",  "bAccounts"."accountId", 'Account' as "accountType",
coalesce("bAccountStatement"."dateAcc", $1), 
coalesce("IncomingBalances"."closingBalance" , 0) AS "openingBalance", 
coalesce("bAccountStatement"."totalCredit", "IncomingBalances"."totalCredit") , 
coalesce("bAccountStatement"."totalDebit", "IncomingBalances"."totalDebit") ,
coalesce("bAccountStatement"."closingBalance", "IncomingBalances"."closingBalance"), 
coalesce("bAccountStatement"."dateAcc", "IncomingBalances"."dateAcc")  AS "lastMovement"
-- "bAccountStatement"."dateAcc" AS "lastMovement"

	FROM public."bAccounts"
	LEFT JOIN "bAccountStatement" ON ("bAccounts"."accountId" = "bAccountStatement"."accountId" AND "bAccountStatement"."dateAcc" = $1)
	LEFT JOIN (
		SELECT DISTINCT ON ("bAccountStatement"."accountId") 
		"bAccountStatement"."accountId", "bAccountStatement"."dateAcc", "bAccountStatement"."closingBalance",
		"bAccountStatement"."totalCredit", "bAccountStatement"."totalDebit"
		  FROM "bAccountStatement" WHERE "bAccountStatement"."dateAcc" < $1 ORDER BY "bAccountStatement"."accountId","dateAcc" DESC ) AS "IncomingBalances"
		  ON ("bAccounts"."accountId" = "IncomingBalances"."accountId")
ORDER BY "accountType", 1
$_$;
 ?   DROP FUNCTION public.f_bbalancesheet_lastmovement(dateb date);
       public          postgres    false            F           1255    51614 #   f_bbalancesheet_lastmovement_full()    FUNCTION     ]  CREATE FUNCTION public.f_bbalancesheet_lastmovement_full() RETURNS TABLE("accountNo" text, "accountId" integer, "accountType" text, "dataTime" date, "openingBalance" money, "totalCredit" money, "totalDebit" money, "closingBalance" money, "lastMovement" date)
    LANGUAGE sql
    AS $$


SELECT 
"accountNo",  "bAccounts"."accountId", 'Account' as "accountType",
"bAccountStatement"."dateAcc", 
coalesce("IncomingBalances1"."closingBalance" , 0) AS "openingBalance", 
coalesce("bAccountStatement"."totalCredit", "IncomingBalances1"."totalCredit") , 
coalesce("bAccountStatement"."totalDebit", "IncomingBalances1"."totalDebit") ,
coalesce("bAccountStatement"."closingBalance", "IncomingBalances1"."closingBalance"), 
coalesce("bAccountStatement"."dateAcc", "IncomingBalances1"."dateAcc")  AS "lastMovement"
-- "bAccountStatement"."dateAcc" AS "lastMovement"

  FROM public."bAccounts"
  LEFT JOIN "bAccountStatement" ON ("bAccounts"."accountId" = "bAccountStatement"."accountId" )
  LEFT JOIN LATERAL (
	SELECT 
	"IncomingBalances"."accountId", "bAccountStatement"."dateAcc", "bAccountStatement"."closingBalance",
	"bAccountStatement"."totalCredit", "bAccountStatement"."totalDebit"
	FROM "bAccountStatement" AS "IncomingBalances"
	WHERE "IncomingBalances"."dateAcc" < "bAccountStatement"."dateAcc" - '2 day'::interval AND "IncomingBalances"."accountId" = "bAccountStatement"."accountId"
	ORDER BY "IncomingBalances"."accountId","IncomingBalances"."dateAcc"::date DESC  LIMIT 1) AS "IncomingBalances1"
  ON ("bAccounts"."accountId" = "IncomingBalances1"."accountId")
ORDER BY "accountType", "bAccountStatement"."dateAcc" desc
$$;
 :   DROP FUNCTION public.f_bbalancesheet_lastmovement_full();
       public          postgres    false            E           1255    59803 ,   f_bcurrentturnoversandbalncesnotclosed(date)    FUNCTION     )  CREATE FUNCTION public.f_bcurrentturnoversandbalncesnotclosed(lastclosedbalancedate date) RETURNS TABLE("accountId" numeric, "accountNo" text, "dataTime" date, "xActTypeCode" numeric, "openingBalance" numeric, "corrOpeningBalance" numeric, "signedTurnOver" numeric, "totalCredit" numeric, "totalDebit" numeric)
    LANGUAGE sql
    AS $_$
 
-- Balance sheet for entries within not closed dates. There are no data in table bAccountStatments for these entries
-- View show calculated openingBalance based on the last closed balance and correction as a signed sum of entries from last closed date 
-- till the date of balance sheet row
-- Second view calculate turnovers for the given date. Closing balance for the given date could be calulated using selelct statement from the view
SELECT "bAccountTransaction"."accountId",
  "bAccounts"."accountNo",
  "bAccountTransaction"."dataTime"::date AS "dataTime",
  "bcAccountType_Ext"."xActTypeCode",
  COALESCE("IncomingBalances"."closingBalance", 0::numeric) AS "openingBalance",
  COALESCE("IncomingBalances"."closingBalance", 0::numeric) + 
  COALESCE(
	(SELECT 
	  SUM(
		CASE tr."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode"
		  WHEN 3 THEN tr."amountTransaction"
		  ELSE tr."amountTransaction" * '-1'::integer::numeric
		END) 
    AS "sCorr"
	FROM "bAccountTransaction" tr
	WHERE 
	  tr."accountId" = "bAccountTransaction"."accountId" AND 
	  tr."dataTime"::date < "bAccountTransaction"."dataTime"::date AND 
	  tr."dataTime"::date > $1::date), 
  0::numeric) 
  AS "corrOpeningBalance",
  SUM(
	CASE "bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode"
		WHEN 3 THEN "bAccountTransaction"."amountTransaction"
		ELSE "bAccountTransaction"."amountTransaction" * -1
	END) 
	AS "closingBalance",
    COALESCE(sum("bAccountTransaction"."amountTransaction") FILTER (WHERE "bAccountTransaction"."XactTypeCode" = 1)::money, '$0.00'::money) 
	AS "totalCredit",
    COALESCE(sum("bAccountTransaction"."amountTransaction") FILTER (WHERE "bAccountTransaction"."XactTypeCode" = 2)::money, '$0.00'::money) 
	AS "totalDebit"
FROM "bAccountTransaction" "bAccountTransaction"
  LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
  LEFT JOIN "bcAccountType_Ext" ON "bAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"
  LEFT JOIN 
  (SELECT DISTINCT ON ("bAccountStatement"."accountId") "bAccountStatement"."accountId",
	"bAccountStatement"."dateAcc",
	"bAccountStatement"."closingBalance",
	"bAccountStatement"."totalCredit",
	"bAccountStatement"."totalDebit"
  FROM "bAccountStatement"
  WHERE "bAccountStatement"."dateAcc" <= $1::date
  ORDER BY "bAccountStatement"."accountId", "bAccountStatement"."dateAcc" DESC) "IncomingBalances" 
  ON "bAccountTransaction"."accountId" = "IncomingBalances"."accountId"
WHERE "bAccountTransaction"."dataTime"::date > $1::date
GROUP BY "bAccountTransaction"."accountId", "bAccounts"."accountNo", "bAccountTransaction"."dataTime", "IncomingBalances"."closingBalance", "bcAccountType_Ext"."xActTypeCode"
ORDER BY ("bAccountTransaction"."dataTime"::date) DESC;

$_$;
 Y   DROP FUNCTION public.f_bcurrentturnoversandbalncesnotclosed(lastclosedbalancedate date);
       public          postgres    false            D           1255    51608 R   f_checkoverdraftbyaccountandbydate(date, numeric, numeric, numeric, numeric, date)    FUNCTION     �  CREATE FUNCTION public.f_checkoverdraftbyaccountandbydate(datetransation date, accountid numeric, transactionxacttypecode numeric, amounttransaction numeric, idtrasactionmodifying numeric, openedaccountingdate date) RETURNS TABLE("accountId" numeric, "openingBalance" money, "closingBalance" money)
    LANGUAGE sql
    AS $_$
SELECT 
"bAccountTransaction"."accountId", "IncomingBalances"."closingBalance" AS "openingBalance",
COALESCE(
	SUM 
		(CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
			WHEN 3 THEN "amountTransaction"
			ELSE         "amountTransaction"*-1
		END)  
	FILTER (WHERE 
		"id" !=$5 AND 
		"bAccountTransaction"."dataTime"::date <= $1::date AND 
		"bAccountTransaction"."dataTime"::date >= $6)
,0) 
+ "IncomingBalances"."closingBalance" + 
CASE ( $3 + "bcAccountType_Ext"."xActTypeCode")
	WHEN 3 THEN $4
	ELSE $4*-1
END  AS "closingBalance"
FROM f_getopeingbalancebyaccountid ($1,$2) AS "IncomingBalances"
left join "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "IncomingBalances"."accountTypeID"
left join "bAccountTransaction"	ON ("IncomingBalances"."accountId" = "bAccountTransaction"."accountId") 
LEFT JOIN "bAccounts" ON ("bAccounts"."accountId" = "IncomingBalances"."accountId")

WHERE  "IncomingBalances"."accountId" = $2
GROUP BY "bcAccountType_Ext"."xActTypeCode" ,"bAccountTransaction"."accountId", "IncomingBalances"."closingBalance";

$_$;
 �   DROP FUNCTION public.f_checkoverdraftbyaccountandbydate(datetransation date, accountid numeric, transactionxacttypecode numeric, amounttransaction numeric, idtrasactionmodifying numeric, openedaccountingdate date);
       public          postgres    false            C           1255    51607 Q   f_checkoverdraftbyledgerandbydate(date, numeric, numeric, numeric, numeric, date)    FUNCTION     �
  CREATE FUNCTION public.f_checkoverdraftbyledgerandbydate(datetransation date, ledgerid numeric, transactionxacttypecode numeric, amounttransaction numeric, idtrasactionmodifying numeric, openedaccountingdate date) RETURNS TABLE("accountId" numeric, "openingBalance" money, "accountTransaction" money, "CrSignAmount" money, "DbSignAmount" money, "signedTransactionAmount" money)
    LANGUAGE sql
    AS $_$

select 
MAX("IncomingBalances"."ledgerId" ), 
MAX("IncomingBalances"."closingBalance") ,
COALESCE(MAX("accountTransactionTotals"."sumAccountTransactions"), 0) AS "sumAccountTransactions" ,

CAST(COALESCE(
		(SUM (CASE ( "bcAccountType_Ext"."xActTypeCode")
				WHEN 1  THEN "amount" *-1
				WHEN 2 THEN "amount" 
			 END) 
		 FILTER (
			WHERE 
			"bLedgerTransactions"."ledgerID"=$2 AND
			"id" !=$5 AND 
			"bLedgerTransactions"."dateTime"::date <= $1::date AND 
			"bLedgerTransactions"."dateTime"::date >= $6::date)
		 )
	, 0) 
AS MONEY) AS "CrSignAmount",
	 
CAST(
	COALESCE(
		SUM (CASE ("bcAccountType_Ext"."xActTypeCode")
				WHEN 1  THEN "amount" 
				WHEN 2  THEN "amount" *-1 
			 END) 
		FILTER 
		 (WHERE 
			"bLedgerTransactions"."ledgerID_Debit"=$2 AND
			"id" !=$5 AND 
			"bLedgerTransactions"."dateTime"::date <= $1::date AND 
			"bLedgerTransactions"."dateTime"::date >= $6::date
		 )
	, 0)
AS MONEY) AS "DbSignAmount", 
	
CAST(CASE ($3 + "bcAccountType_Ext"."xActTypeCode")
		WHEN 3 THEN $4 * -1
		ELSE        $4
	END as money) 
  AS "signedTransactionAmount"
	
FROM f_getOpeingBalancebyLedgerId ($1,$2) AS "IncomingBalances"
left join "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "IncomingBalances"."accountTypeID"
left join "bLedgerTransactions"	on 
("IncomingBalances"."ledgerId" = "bLedgerTransactions"."ledgerID") OR ("IncomingBalances"."ledgerId"  = "bLedgerTransactions"."ledgerID_Debit")

left join LATERAL
(SELECT	"bLedger"."ledgerNoId", SUM (CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
			WHEN 3 THEN "amountTransaction" * -1
			ELSE         "amountTransaction" 
		END) 
	  AS "sumAccountTransactions"
FROM "bLedger"
LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID"
LEFT JOIN  public."bAccountTransaction"
ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId"
WHERE 
		("bLedger"."ledgerNoId" = $2 AND
		"id" !=$5 AND 
		"bAccountTransaction"."dataTime"::date <= $1 ::date AND 
		"bAccountTransaction"."dataTime"::date >= $6::date)
GROUP BY "bLedger"."ledgerNoId"
) AS "accountTransactionTotals"

ON "IncomingBalances"."ledgerId" = "accountTransactionTotals"."ledgerNoId"
where "IncomingBalances"."ledgerId" = $2 
GROUP BY "bcAccountType_Ext"."xActTypeCode"
$_$;
 �   DROP FUNCTION public.f_checkoverdraftbyledgerandbydate(datetransation date, ledgerid numeric, transactionxacttypecode numeric, amounttransaction numeric, idtrasactionmodifying numeric, openedaccountingdate date);
       public          postgres    false            A           1255    51597 ,   f_getopeingbalancebyaccountid(date, numeric)    FUNCTION     }  CREATE FUNCTION public.f_getopeingbalancebyaccountid(dateacc date, accountid numeric) RETURNS TABLE("accountId" numeric, "accountTypeID" numeric, "dateAcc" date, "closingBalance" numeric)
    LANGUAGE sql
    AS $_$
SELECT $2 AS "accountId", "bAccounts"."accountTypeExt", "IncomingBalances"."dateAcc",  coalesce ( "IncomingBalances"."closingBalance",0)
FROM "bAccounts"
LEFT JOIN LATERAL
	(SELECT DISTINCT ON ("bAccountStatement"."accountId") 
	"bAccountStatement"."accountId", "bAccountStatement"."dateAcc"::date, "bAccountStatement"."closingBalance",
	"bAccountStatement"."totalCredit", "bAccountStatement"."totalDebit"
	 FROM "bAccountStatement" 
	 WHERE "bAccountStatement"."dateAcc"::date < $1 
	 ORDER BY "bAccountStatement"."accountId","dateAcc"::date DESC ) 
	 AS "IncomingBalances"
ON ("bAccounts"."accountId" = "IncomingBalances"."accountId")
where "bAccounts"."accountId" = $2
$_$;
 U   DROP FUNCTION public.f_getopeingbalancebyaccountid(dateacc date, accountid numeric);
       public          postgres    false            =           1255    51528 +   f_getopeingbalancebyledgerid(date, numeric)    FUNCTION     c  CREATE FUNCTION public.f_getopeingbalancebyledgerid(dateacc date, ledgerid numeric) RETURNS TABLE("ledgerId" numeric, "accountTypeID" numeric, "dateAcc" date, "closingBalance" money)
    LANGUAGE sql
    AS $_$
SELECT $2 AS "ledgerID", "bLedger"."accountTypeID", "IncomingBalances"."dateAcc",  coalesce ( "IncomingBalances"."closingBalance",0)
FROM "bLedger"
LEFT JOIN LATERAL
	(SELECT DISTINCT ON ("bLedgerStatement"."ledgerID") 
	"bLedgerStatement"."ledgerID", "bLedgerStatement"."dateAcc"::date, "bLedgerStatement"."closingBalance",
	"bLedgerStatement"."totalCredit", "bLedgerStatement"."totalDebit"
	 FROM "bLedgerStatement" 
	 WHERE "bLedgerStatement"."dateAcc"::date < $1 
	 ORDER BY "bLedgerStatement"."ledgerID","dateAcc"::date DESC ) 
	 AS "IncomingBalances"
ON ("bLedger"."ledgerNoId" = "IncomingBalances"."ledgerID")
where "bLedger"."ledgerNoId" = $2
$_$;
 S   DROP FUNCTION public.f_getopeingbalancebyledgerid(dateacc date, ledgerid numeric);
       public          postgres    false            <           1255    51523 F   f_getopeingbalancebyledgerid(date, numeric, numeric, numeric, numeric)    FUNCTION     �  CREATE FUNCTION public.f_getopeingbalancebyledgerid(datetransation date, ledgerid numeric, transactionxacttypecode numeric, amounttransaction numeric, idtrasactionmodifying numeric) RETURNS TABLE("ledgerId" numeric, "dateAcc" date, "closingBalance" money)
    LANGUAGE sql
    AS $_$
SELECT $2 AS "ledgerID", "IncomingBalances"."dateAcc",  coalesce ( "IncomingBalances"."closingBalance",0)
FROM "bLedger"
LEFT JOIN LATERAL
	(SELECT DISTINCT ON ("bLedgerStatement"."ledgerID") 
	"bLedgerStatement"."ledgerID", "bLedgerStatement"."dateAcc"::date, "bLedgerStatement"."closingBalance",
	"bLedgerStatement"."totalCredit", "bLedgerStatement"."totalDebit"
	 FROM "bLedgerStatement" 
	 WHERE "bLedgerStatement"."dateAcc"::date < $1 
	 ORDER BY "bLedgerStatement"."ledgerID","dateAcc"::date DESC ) 
	 AS "IncomingBalances"
ON ("bLedger"."ledgerNoId" = "IncomingBalances"."ledgerID")
where "bLedger"."ledgerNoId" = $2
$_$;
 �   DROP FUNCTION public.f_getopeingbalancebyledgerid(datetransation date, ledgerid numeric, transactionxacttypecode numeric, amounttransaction numeric, idtrasactionmodifying numeric);
       public          postgres    false            >           1255    51294 *   f_ledger_balance_closure_select_data(date)    FUNCTION     �  CREATE FUNCTION public.f_ledger_balance_closure_select_data(dateb date) RETURNS TABLE("ledgerID" integer, "dateAcc" date, "openingBalance" money, "totalCredit" money, "totalDebit" money, "closingBalance" money, code integer)
    LANGUAGE sql
    AS $_$
SELECT 
"bAccountTransaction"."ledgerNoId", "dataTime"::date, "IncomingBalances"."closingBalance" AS "openingBalance",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 2) AS MONEY),'$0') AS "totalCredit",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 1) AS MONEY),'$0') AS "totalDebit",
CAST(SUM (
	CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
		WHEN 3 THEN "amountTransaction" * -1
		ELSE "amountTransaction"
	END 
) + "IncomingBalances"."closingBalance" AS MONEY)  AS "closingBalance", "bcAccountType_Ext"."xActTypeCode"
FROM public."bAccountTransaction" 
LEFT JOIN "bLedger"
ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId"
LEFT JOIN "bcAccountType_Ext" ON "bLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
LEFT JOIN (
	SELECT DISTINCT ON ("bLedgerStatement"."ledgerID") 
	"bLedgerStatement"."ledgerID", "bLedgerStatement"."dateAcc"::date, "bLedgerStatement"."closingBalance",
	"bLedgerStatement"."totalCredit", "bLedgerStatement"."totalDebit"
	 FROM "bLedgerStatement" 
	 WHERE "bLedgerStatement"."dateAcc" < $1 ORDER BY "bLedgerStatement"."ledgerID","dateAcc"::date DESC ) AS "IncomingBalances"
ON ("bAccountTransaction"."ledgerNoId" = "IncomingBalances"."ledgerID")
WHERE "bAccountTransaction"."dataTime"::date = $1::date
GROUP BY "bAccountTransaction"."ledgerNoId", "dataTime"::date, "IncomingBalances"."closingBalance", "bcAccountType_Ext"."xActTypeCode";

$_$;
 G   DROP FUNCTION public.f_ledger_balance_closure_select_data(dateb date);
       public          postgres    false            G           1255    59754    f_s_balancesheet_all()    FUNCTION     �  CREATE FUNCTION public.f_s_balancesheet_all() RETURNS TABLE("accountNo" text, "accountId" integer, "accountType" text, "datePreviousBalance" date, "dateBalance" date, "openingBalance" numeric, "totalCredit" numeric, "totalDebit" numeric, "OutGoingBalance" numeric, "checkClosing" numeric)
    LANGUAGE sql
    AS $$
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
$$;
 -   DROP FUNCTION public.f_s_balancesheet_all();
       public          postgres    false            �            1259    42137    aAccesRoles    TABLE     �   CREATE TABLE public."aAccesRoles" (
    id integer NOT NULL,
    "roleName" character varying NOT NULL,
    "roleDescription" character varying
);
 !   DROP TABLE public."aAccesRoles";
       public         heap    postgres    false            �            1259    42135    aAccesRoles_id_seq    SEQUENCE     �   CREATE SEQUENCE public."aAccesRoles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public."aAccesRoles_id_seq";
       public          postgres    false    226            �           0    0    aAccesRoles_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public."aAccesRoles_id_seq" OWNED BY public."aAccesRoles".id;
          public          postgres    false    225            �            1259    42126    aAccessConstraints    TABLE       CREATE TABLE public."aAccessConstraints" (
    id integer NOT NULL,
    elementid character varying NOT NULL,
    tsmodule character varying,
    htmltemplate character varying,
    elementtype character varying,
    elementvalue character varying,
    accessrole character varying
);
 (   DROP TABLE public."aAccessConstraints";
       public         heap    postgres    false            �            1259    42124    aAccessConstraints_id_seq    SEQUENCE     �   CREATE SEQUENCE public."aAccessConstraints_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public."aAccessConstraints_id_seq";
       public          postgres    false    224            �           0    0    aAccessConstraints_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public."aAccessConstraints_id_seq" OWNED BY public."aAccessConstraints".id;
          public          postgres    false    223            �            1259    42151    aMoexInstruments    TABLE       CREATE TABLE public."aMoexInstruments" (
    secid character varying(50),
    shortname character varying(150),
    name character varying(150),
    typename character varying(150),
    isin character varying(150),
    regnumber character varying(150),
    listlevel integer,
    facevalue numeric,
    faceunit character varying(150),
    issuesize numeric,
    is_collateral integer,
    is_external integer,
    primary_boardid character varying(150),
    primary_board_title character varying(150),
    matdate character varying(200),
    is_rii character varying(20),
    issuedate character varying(200),
    eveningsession integer,
    morningsession integer,
    is_qualified_investors integer,
    high_risk integer,
    yieldatwap numeric,
    registryclosedate character varying(200),
    dividendvalue numeric,
    dividendyield numeric,
    registryclosetype character varying(200),
    emitentname character varying(150),
    inn numeric,
    lotsize integer,
    price numeric,
    price_rub numeric,
    rtl1 numeric,
    rth1 numeric,
    rtl2 numeric,
    rth2 numeric,
    rtl3 numeric,
    rth3 numeric,
    discount1 numeric,
    limit1 numeric,
    discount2 numeric,
    limit2 numeric,
    discount3 numeric,
    discountl0 numeric,
    discounth0 numeric,
    fullcovered integer
);
 &   DROP TABLE public."aMoexInstruments";
       public         heap    postgres    false            �            1259    42856    bAccountStatement    TABLE     �   CREATE TABLE public."bAccountStatement" (
    id bigint NOT NULL,
    "dateAcc" date NOT NULL,
    "closingBalance" numeric NOT NULL,
    "totalCredit" numeric,
    "totalDebit" numeric,
    "accountId" bigint
);
 '   DROP TABLE public."bAccountStatement";
       public         heap    postgres    false            �            1259    42854    bAccountStatement_id_seq    SEQUENCE     �   CREATE SEQUENCE public."bAccountStatement_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public."bAccountStatement_id_seq";
       public          postgres    false    248            �           0    0    bAccountStatement_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public."bAccountStatement_id_seq" OWNED BY public."bAccountStatement".id;
          public          postgres    false    247            �            1259    42612    bAccountTransaction    TABLE     L  CREATE TABLE public."bAccountTransaction" (
    "ledgerNoId" bigint,
    "dataTime" timestamp without time zone,
    "XactTypeCode" bigint,
    "XactTypeCode_Ext" bigint,
    "accountId" bigint,
    id bigint NOT NULL,
    "amountTransaction" numeric NOT NULL,
    "entryDetails" character varying,
    "extTransactionId" bigint
);
 )   DROP TABLE public."bAccountTransaction";
       public         heap    postgres    false            �            1259    42618    bAccountTransaction_id_seq    SEQUENCE     �   CREATE SEQUENCE public."bAccountTransaction_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public."bAccountTransaction_id_seq";
       public          postgres    false    232            �           0    0    bAccountTransaction_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public."bAccountTransaction_id_seq" OWNED BY public."bAccountTransaction".id;
          public          postgres    false    233            �            1259    42791 	   bAccounts    TABLE     N  CREATE TABLE public."bAccounts" (
    "accountNo" character varying NOT NULL,
    "accountTypeExt" bigint NOT NULL,
    "Information" character varying NOT NULL,
    "clientId" bigint,
    "currencyCode" numeric,
    "entityTypeCode" bigint NOT NULL,
    "accountId" bigint NOT NULL,
    idportfolio bigint,
    "dateOpening" date
);
    DROP TABLE public."bAccounts";
       public         heap    postgres    false            �            1259    42876    bAccountsPortfoliosLink    TABLE     �   CREATE TABLE public."bAccountsPortfoliosLink" (
    "portfolioId" bigint NOT NULL,
    "accountNoId" bigint NOT NULL,
    id bigint NOT NULL
);
 -   DROP TABLE public."bAccountsPortfoliosLink";
       public         heap    postgres    false            �            1259    42874    bAccountsPortfoliosLink_id_seq    SEQUENCE     �   CREATE SEQUENCE public."bAccountsPortfoliosLink_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 7   DROP SEQUENCE public."bAccountsPortfoliosLink_id_seq";
       public          postgres    false    250            �           0    0    bAccountsPortfoliosLink_id_seq    SEQUENCE OWNED BY     e   ALTER SEQUENCE public."bAccountsPortfoliosLink_id_seq" OWNED BY public."bAccountsPortfoliosLink".id;
          public          postgres    false    249                       1259    43072    bAccounts_accountId_seq    SEQUENCE     �   CREATE SEQUENCE public."bAccounts_accountId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public."bAccounts_accountId_seq";
       public          postgres    false    245            �           0    0    bAccounts_accountId_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public."bAccounts_accountId_seq" OWNED BY public."bAccounts"."accountId";
          public          postgres    false    262            �            1259    42731    bcAccountType_Ext    TABLE     �   CREATE TABLE public."bcAccountType_Ext" (
    "accountType_Ext" bigint NOT NULL,
    "xActTypeCode" bigint NOT NULL,
    description name NOT NULL,
    "actCodeShort" character varying,
    "APTypeCode" character(1)
);
 '   DROP TABLE public."bcAccountType_Ext";
       public         heap    postgres    false                       1259    59790 $   bCurrentTurnOversAndBalncesNotClosed    VIEW     �
  CREATE VIEW public."bCurrentTurnOversAndBalncesNotClosed" AS
 SELECT "bAccountTransaction"."accountId",
    "bAccounts"."accountNo",
    ("bAccountTransaction"."dataTime")::date AS "dataTime",
    "bcAccountType_Ext"."xActTypeCode",
    COALESCE("IncomingBalances"."closingBalance", (0)::numeric) AS "openingBalance",
    ("IncomingBalances"."closingBalance" + COALESCE(( SELECT sum(
                CASE (tr."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
                    WHEN 3 THEN tr."amountTransaction"
                    ELSE (tr."amountTransaction" * ('-1'::integer)::numeric)
                END) AS "sCorr"
           FROM public."bAccountTransaction" tr
          WHERE ((tr."accountId" = "bAccountTransaction"."accountId") AND ((tr."dataTime")::date < ("bAccountTransaction"."dataTime")::date) AND ((tr."dataTime")::date > '2023-02-21'::date))), (0)::numeric)) AS "corrOpeningBalance",
    sum(
        CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
            WHEN 3 THEN "bAccountTransaction"."amountTransaction"
            ELSE ("bAccountTransaction"."amountTransaction" * ('-1'::integer)::numeric)
        END) AS "closingBalance",
    COALESCE((sum("bAccountTransaction"."amountTransaction") FILTER (WHERE ("bAccountTransaction"."XactTypeCode" = 1)))::money, '$0.00'::money) AS "totalCredit",
    COALESCE((sum("bAccountTransaction"."amountTransaction") FILTER (WHERE ("bAccountTransaction"."XactTypeCode" = 2)))::money, '$0.00'::money) AS "totalDebit"
   FROM (((public."bAccountTransaction" "bAccountTransaction"
     LEFT JOIN public."bAccounts" ON (("bAccounts"."accountId" = "bAccountTransaction"."accountId")))
     LEFT JOIN public."bcAccountType_Ext" ON (("bAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext")))
     LEFT JOIN ( SELECT DISTINCT ON ("bAccountStatement"."accountId") "bAccountStatement"."accountId",
            "bAccountStatement"."dateAcc",
            "bAccountStatement"."closingBalance",
            "bAccountStatement"."totalCredit",
            "bAccountStatement"."totalDebit"
           FROM public."bAccountStatement"
          WHERE ("bAccountStatement"."dateAcc" <= '2023-02-21'::date)
          ORDER BY "bAccountStatement"."accountId", "bAccountStatement"."dateAcc" DESC) "IncomingBalances" ON (("bAccountTransaction"."accountId" = "IncomingBalances"."accountId")))
  WHERE (("bAccountTransaction"."dataTime")::date > '2023-02-21'::date)
  GROUP BY "bAccountTransaction"."accountId", "bAccounts"."accountNo", "bAccountTransaction"."dataTime", "IncomingBalances"."closingBalance", "bcAccountType_Ext"."xActTypeCode"
  ORDER BY (("bAccountTransaction"."dataTime")::date) DESC;
 9   DROP VIEW public."bCurrentTurnOversAndBalncesNotClosed";
       public          postgres    false    232    232    248    245    232    232    245    245    244    244    248    248    248    248                        1259    42913    bSWIFTGlobalMsg    TABLE        CREATE TABLE public."bSWIFTGlobalMsg" (
    id bigint NOT NULL,
    "msgId" character varying NOT NULL,
    "senderBIC" character varying NOT NULL,
    "DateMsg" date NOT NULL,
    "typeMsg" character varying NOT NULL,
    "accountNo" character varying
);
 %   DROP TABLE public."bSWIFTGlobalMsg";
       public         heap    postgres    false            �            1259    42911    bGlobalMsgSwift_id_seq    SEQUENCE     �   CREATE SEQUENCE public."bGlobalMsgSwift_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public."bGlobalMsgSwift_id_seq";
       public          postgres    false    256            �           0    0    bGlobalMsgSwift_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public."bGlobalMsgSwift_id_seq" OWNED BY public."bSWIFTGlobalMsg".id;
          public          postgres    false    255            	           1259    51189    bLastClosedAccountingDate    VIEW     �   CREATE VIEW public."bLastClosedAccountingDate" AS
 SELECT max(("bAccountStatement"."dateAcc" + '1 day'::interval)) AS "FirstOpenedDate"
   FROM public."bAccountStatement";
 .   DROP VIEW public."bLastClosedAccountingDate";
       public          postgres    false    248            �            1259    42652    bLedger    TABLE     �  CREATE TABLE public."bLedger" (
    "accountTypeID" numeric NOT NULL,
    name character varying,
    "clientID" bigint,
    "entityTypeCode" bigint,
    "ledgerNo" character varying NOT NULL,
    "currecyCode" numeric(3,0),
    "ledgerNoCptyCode" character varying,
    "ledgerNoTrade" character varying,
    "externalAccountNo" character varying,
    "ledgerNoId" bigint NOT NULL,
    "dateOpening" date
);
    DROP TABLE public."bLedger";
       public         heap    postgres    false            �            1259    42629    bLedgerStatement    TABLE     �   CREATE TABLE public."bLedgerStatement" (
    id bigint NOT NULL,
    "ledgerID" bigint NOT NULL,
    "closingBalance" numeric NOT NULL,
    "totalDebit" numeric,
    "totalCredit" numeric,
    "dateAcc" date
);
 &   DROP TABLE public."bLedgerStatement";
       public         heap    postgres    false            �            1259    42627    bLedgerStatement_id_seq    SEQUENCE     �   CREATE SEQUENCE public."bLedgerStatement_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public."bLedgerStatement_id_seq";
       public          postgres    false    235            �           0    0    bLedgerStatement_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public."bLedgerStatement_id_seq" OWNED BY public."bLedgerStatement".id;
          public          postgres    false    234            �            1259    42640    bLedgerTransactions    TABLE     9  CREATE TABLE public."bLedgerTransactions" (
    id bigint NOT NULL,
    "ledgerID" bigint NOT NULL,
    "dateTime" timestamp without time zone NOT NULL,
    amount numeric NOT NULL,
    "ledgerID_Debit" bigint,
    "XactTypeCode_Ext" bigint,
    "entryDetails" character varying,
    "extTransactionId" bigint
);
 )   DROP TABLE public."bLedgerTransactions";
       public         heap    postgres    false            �            1259    42638    bLedgerTransactions_id_seq    SEQUENCE     �   CREATE SEQUENCE public."bLedgerTransactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public."bLedgerTransactions_id_seq";
       public          postgres    false    237            �           0    0    bLedgerTransactions_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public."bLedgerTransactions_id_seq" OWNED BY public."bLedgerTransactions".id;
          public          postgres    false    236                       1259    43083    bLedger_ledgerNoId_seq    SEQUENCE     �   CREATE SEQUENCE public."bLedger_ledgerNoId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public."bLedger_ledgerNoId_seq";
       public          postgres    false    238            �           0    0    bLedger_ledgerNoId_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public."bLedger_ledgerNoId_seq" OWNED BY public."bLedger"."ledgerNoId";
          public          postgres    false    263            �            1259    42902    bSWIFTStatement    TABLE     Y  CREATE TABLE public."bSWIFTStatement" (
    id bigint NOT NULL,
    "msgId" character varying NOT NULL,
    "amountTransaction" numeric NOT NULL,
    "typeTransaction" character varying NOT NULL,
    "valueDate" timestamp without time zone,
    comment character varying,
    "entryAllocatedId" bigint,
    "refTransaction" character varying
);
 %   DROP TABLE public."bSWIFTStatement";
       public         heap    postgres    false            �            1259    42900    bStatementSWIFT_id_seq    SEQUENCE     �   CREATE SEQUENCE public."bStatementSWIFT_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public."bStatementSWIFT_id_seq";
       public          postgres    false    254            �           0    0    bStatementSWIFT_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public."bStatementSWIFT_id_seq" OWNED BY public."bSWIFTStatement".id;
          public          postgres    false    253            �            1259    42663    bcAccountType    TABLE     �   CREATE TABLE public."bcAccountType" (
    id bigint NOT NULL,
    description character varying NOT NULL,
    "accountTypeCode" character varying,
    "APTypeCode" character(1)
);
 #   DROP TABLE public."bcAccountType";
       public         heap    postgres    false            �            1259    42729 %   bcAccountType_Ext_accountType_Ext_seq    SEQUENCE     �   CREATE SEQUENCE public."bcAccountType_Ext_accountType_Ext_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 >   DROP SEQUENCE public."bcAccountType_Ext_accountType_Ext_seq";
       public          postgres    false    244            �           0    0 %   bcAccountType_Ext_accountType_Ext_seq    SEQUENCE OWNED BY     u   ALTER SEQUENCE public."bcAccountType_Ext_accountType_Ext_seq" OWNED BY public."bcAccountType_Ext"."accountType_Ext";
          public          postgres    false    243            �            1259    42661    bcAccountType_id_seq    SEQUENCE        CREATE SEQUENCE public."bcAccountType_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public."bcAccountType_id_seq";
       public          postgres    false    240            �           0    0    bcAccountType_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public."bcAccountType_id_seq" OWNED BY public."bcAccountType".id;
          public          postgres    false    239            �            1259    42805    bcEnityType    TABLE     �   CREATE TABLE public."bcEnityType" (
    "entityType" bigint NOT NULL,
    name character varying NOT NULL,
    "entityTypeCode" character varying
);
 !   DROP TABLE public."bcEnityType";
       public         heap    postgres    false                       1259    43052    bcSchemeAccountTransaction    TABLE     �  CREATE TABLE public."bcSchemeAccountTransaction" (
    "ledgerNoId" character varying,
    "dataTime" character varying,
    "accountId" character varying,
    id bigint DEFAULT nextval('public."bAccountTransaction_id_seq"'::regclass) NOT NULL,
    "amountTransaction" character varying,
    "accountNo" character varying NOT NULL,
    "entryDetails" character varying,
    "cSchemeGroupId" character varying,
    "cDate" character varying,
    "cxActTypeCode_Ext" character varying,
    "cxActTypeCode" character varying,
    "cLedgerType" character varying,
    "XactTypeCode" bigint,
    "XactTypeCode_Ext" bigint,
    "extTransactionId" character varying
);
 0   DROP TABLE public."bcSchemeAccountTransaction";
       public         heap    postgres    false    233                       1259    42975    bcTransactionSchemes_Parameters    TABLE     �   CREATE TABLE public."bcTransactionSchemes_Parameters" (
    id integer NOT NULL,
    "pCode" character varying NOT NULL,
    "pPlace" integer NOT NULL,
    "pDescription" character varying NOT NULL
);
 5   DROP TABLE public."bcTransactionSchemes_Parameters";
       public         heap    postgres    false                       1259    42973 &   bcTransactionSchemes_Parameters_id_seq    SEQUENCE     �   CREATE SEQUENCE public."bcTransactionSchemes_Parameters_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ?   DROP SEQUENCE public."bcTransactionSchemes_Parameters_id_seq";
       public          postgres    false    260            �           0    0 &   bcTransactionSchemes_Parameters_id_seq    SEQUENCE OWNED BY     u   ALTER SEQUENCE public."bcTransactionSchemes_Parameters_id_seq" OWNED BY public."bcTransactionSchemes_Parameters".id;
          public          postgres    false    259            �            1259    42709    bcTransactionType_DE    TABLE     x   CREATE TABLE public."bcTransactionType_DE" (
    "xActTypeCode" bigint NOT NULL,
    name character varying NOT NULL
);
 *   DROP TABLE public."bcTransactionType_DE";
       public         heap    postgres    false            �            1259    42707 %   bcTransactionType_DE_xActTypeCode_seq    SEQUENCE     �   CREATE SEQUENCE public."bcTransactionType_DE_xActTypeCode_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 >   DROP SEQUENCE public."bcTransactionType_DE_xActTypeCode_seq";
       public          postgres    false    242            �           0    0 %   bcTransactionType_DE_xActTypeCode_seq    SEQUENCE OWNED BY     u   ALTER SEQUENCE public."bcTransactionType_DE_xActTypeCode_seq" OWNED BY public."bcTransactionType_DE"."xActTypeCode";
          public          postgres    false    241            �            1259    42889    bcTransactionType_Ext    TABLE     �   CREATE TABLE public."bcTransactionType_Ext" (
    id integer NOT NULL,
    "xActTypeCode_Ext" character(2) NOT NULL,
    description character varying NOT NULL,
    code2 character varying
);
 +   DROP TABLE public."bcTransactionType_Ext";
       public         heap    postgres    false            �            1259    42887    bcTransactionType_Ext_id_seq    SEQUENCE     �   CREATE SEQUENCE public."bcTransactionType_Ext_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public."bcTransactionType_Ext_id_seq";
       public          postgres    false    252            �           0    0    bcTransactionType_Ext_id_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE public."bcTransactionType_Ext_id_seq" OWNED BY public."bcTransactionType_Ext".id;
          public          postgres    false    251            �            1259    41951    dclients    TABLE     B  CREATE TABLE public.dclients (
    idclient numeric NOT NULL,
    clientname character varying(200) NOT NULL,
    idcountrydomicile numeric,
    isclientproffesional boolean,
    address character varying,
    contact_person character varying,
    email character varying,
    phone numeric,
    code character varying
);
    DROP TABLE public.dclients;
       public         heap    postgres    false            �            1259    41957    dClients_IdClient_seq    SEQUENCE     �   CREATE SEQUENCE public."dClients_IdClient_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public."dClients_IdClient_seq";
       public          postgres    false    201            �           0    0    dClients_IdClient_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public."dClients_IdClient_seq" OWNED BY public.dclients.idclient;
          public          postgres    false    202            �            1259    41959    dConstraints    TABLE     �   CREATE TABLE public."dConstraints" (
    "IdConstraint" bigint NOT NULL,
    "IdClient" numeric NOT NULL,
    "IdConstraintType" numeric NOT NULL,
    "IdInstrument" numeric,
    "IdInstrumentType" numeric
);
 "   DROP TABLE public."dConstraints";
       public         heap    postgres    false            �            1259    41965    dConstraints_IdConstraint_seq    SEQUENCE     �   CREATE SEQUENCE public."dConstraints_IdConstraint_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public."dConstraints_IdConstraint_seq";
       public          postgres    false    203            �           0    0    dConstraints_IdConstraint_seq    SEQUENCE OWNED BY     e   ALTER SEQUENCE public."dConstraints_IdConstraint_seq" OWNED BY public."dConstraints"."IdConstraint";
          public          postgres    false    204            �            1259    41967 
   dCountries    TABLE     �   CREATE TABLE public."dCountries" (
    "IdCountry" integer NOT NULL,
    "CountryName" character varying(200) NOT NULL,
    "IsOffshore" boolean NOT NULL
);
     DROP TABLE public."dCountries";
       public         heap    postgres    false            �            1259    41970    dCountries_IdCountry_seq    SEQUENCE     �   CREATE SEQUENCE public."dCountries_IdCountry_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public."dCountries_IdCountry_seq";
       public          postgres    false    205            �           0    0    dCountries_IdCountry_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public."dCountries_IdCountry_seq" OWNED BY public."dCountries"."IdCountry";
          public          postgres    false    206            �            1259    41972    dCurrencies    TABLE     �   CREATE TABLE public."dCurrencies" (
    "IdCurrency" integer NOT NULL,
    "CurrencyCodeNum" numeric NOT NULL,
    "CurrencyName" character varying NOT NULL,
    "CurrencyCode" character varying NOT NULL,
    "IdCountry" numeric NOT NULL
);
 !   DROP TABLE public."dCurrencies";
       public         heap    postgres    false            �            1259    41978    dCurrencies_IdCurrency_seq    SEQUENCE     �   CREATE SEQUENCE public."dCurrencies_IdCurrency_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public."dCurrencies_IdCurrency_seq";
       public          postgres    false    207            �           0    0    dCurrencies_IdCurrency_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public."dCurrencies_IdCurrency_seq" OWNED BY public."dCurrencies"."IdCurrency";
          public          postgres    false    208            �            1259    41980    dFInstruments    TABLE     5  CREATE TABLE public."dFInstruments" (
    "IdInstrument" integer NOT NULL,
    "InstrumentName" character varying(200) NOT NULL,
    "InstrumentType" numeric NOT NULL,
    "Nominal" numeric,
    "MaturityDate" date,
    "MinTradingLot" numeric,
    "CurrencyNominal" numeric,
    "TradingCurrency" numeric
);
 #   DROP TABLE public."dFInstruments";
       public         heap    postgres    false            �            1259    41986    dFInstruments_IdInstrument_seq    SEQUENCE     �   CREATE SEQUENCE public."dFInstruments_IdInstrument_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 7   DROP SEQUENCE public."dFInstruments_IdInstrument_seq";
       public          postgres    false    209            �           0    0    dFInstruments_IdInstrument_seq    SEQUENCE OWNED BY     g   ALTER SEQUENCE public."dFInstruments_IdInstrument_seq" OWNED BY public."dFInstruments"."IdInstrument";
          public          postgres    false    210            �            1259    42596    dGeneralTypes    TABLE     �   CREATE TABLE public."dGeneralTypes" (
    id integer NOT NULL,
    "typeCode" character varying NOT NULL,
    "typeValue" character varying NOT NULL,
    "typeDescription" character varying
);
 #   DROP TABLE public."dGeneralTypes";
       public         heap    postgres    false            �            1259    42594    dGeneralTypes_id_seq    SEQUENCE     �   CREATE SEQUENCE public."dGeneralTypes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public."dGeneralTypes_id_seq";
       public          postgres    false    231            �           0    0    dGeneralTypes_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public."dGeneralTypes_id_seq" OWNED BY public."dGeneralTypes".id;
          public          postgres    false    230            �            1259    41988    dInstrumentTypes    TABLE     �   CREATE TABLE public."dInstrumentTypes" (
    "IdInstrymentType" integer NOT NULL,
    "TypeName" character varying NOT NULL,
    "SubTypeName" character varying NOT NULL
);
 &   DROP TABLE public."dInstrumentTypes";
       public         heap    postgres    false            �            1259    41994 %   dInstrumentTypes_IdInstrymentType_seq    SEQUENCE     �   CREATE SEQUENCE public."dInstrumentTypes_IdInstrymentType_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 >   DROP SEQUENCE public."dInstrumentTypes_IdInstrymentType_seq";
       public          postgres    false    211            �           0    0 %   dInstrumentTypes_IdInstrymentType_seq    SEQUENCE OWNED BY     u   ALTER SEQUENCE public."dInstrumentTypes_IdInstrymentType_seq" OWNED BY public."dInstrumentTypes"."IdInstrymentType";
          public          postgres    false    212            �            1259    41996    dportfolios    TABLE     �   CREATE TABLE public.dportfolios (
    idportfolio integer NOT NULL,
    idclient numeric NOT NULL,
    idstategy integer,
    portfolioname character varying NOT NULL,
    portleverage numeric
);
    DROP TABLE public.dportfolios;
       public         heap    postgres    false            �            1259    42002    dPortfolios_IdPortfolio_seq    SEQUENCE     �   CREATE SEQUENCE public."dPortfolios_IdPortfolio_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public."dPortfolios_IdPortfolio_seq";
       public          postgres    false    213            �           0    0    dPortfolios_IdPortfolio_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public."dPortfolios_IdPortfolio_seq" OWNED BY public.dportfolios.idportfolio;
          public          postgres    false    214            �            1259    42010    dstrategiesglobal    TABLE     �   CREATE TABLE public.dstrategiesglobal (
    id integer NOT NULL,
    sname character varying(100) NOT NULL,
    s_level_id integer NOT NULL,
    s_parent_id integer,
    s_description character varying(300),
    s_benchmark_account integer
);
 %   DROP TABLE public.dstrategiesglobal;
       public         heap    postgres    false            �            1259    42013    dStrategiesGobal_id_seq    SEQUENCE     �   CREATE SEQUENCE public."dStrategiesGobal_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public."dStrategiesGobal_id_seq";
       public          postgres    false    215            �           0    0    dStrategiesGobal_id_seq    SEQUENCE OWNED BY     V   ALTER SEQUENCE public."dStrategiesGobal_id_seq" OWNED BY public.dstrategiesglobal.id;
          public          postgres    false    216            �            1259    42017 
   dpositions    TABLE     0  CREATE TABLE public.dpositions (
    idposition integer DEFAULT nextval('public."dFInstruments_IdInstrument_seq"'::regclass) NOT NULL,
    pidtrade numeric,
    pbuyidtrade numeric,
    qtyinitial numeric,
    qty_sold numeric,
    qty_rest numeric,
    ttype numeric,
    tdate date,
    pnl numeric
);
    DROP TABLE public.dpositions;
       public         heap    postgres    false    210            �            1259    42560    dstrategies_global_structure    TABLE     �   CREATE TABLE public.dstrategies_global_structure (
    id integer NOT NULL,
    id_strategy_parent integer NOT NULL,
    weight_of_child numeric NOT NULL,
    id_strategy_child character varying
);
 0   DROP TABLE public.dstrategies_global_structure;
       public         heap    postgres    false            �            1259    42558 #   dstrategies_global_structure_id_seq    SEQUENCE     �   CREATE SEQUENCE public.dstrategies_global_structure_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 :   DROP SEQUENCE public.dstrategies_global_structure_id_seq;
       public          postgres    false    229            �           0    0 #   dstrategies_global_structure_id_seq    SEQUENCE OWNED BY     k   ALTER SEQUENCE public.dstrategies_global_structure_id_seq OWNED BY public.dstrategies_global_structure.id;
          public          postgres    false    228            �            1259    42024    dtrades    TABLE     s  CREATE TABLE public.dtrades (
    idtrade numeric DEFAULT nextval('public."dFInstruments_IdInstrument_seq"'::regclass) NOT NULL,
    qty numeric,
    price numeric,
    cpty character varying(60),
    tdate date,
    vdate date,
    tidorder numeric,
    allocatedqty numeric,
    idportfolio integer,
    trtype character varying,
    tidinstrument character varying
);
    DROP TABLE public.dtrades;
       public         heap    postgres    false    210            �            1259    42112    dtree_menu_favorites    TABLE     �   CREATE TABLE public.dtree_menu_favorites (
    id integer NOT NULL,
    nodename character varying(200),
    nodeparent character varying(200),
    userid integer,
    idelement character varying
);
 (   DROP TABLE public.dtree_menu_favorites;
       public         heap    postgres    false            �            1259    42110    dtree_menu_favorites_id_seq    SEQUENCE     �   CREATE SEQUENCE public.dtree_menu_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.dtree_menu_favorites_id_seq;
       public          postgres    false    222            �           0    0    dtree_menu_favorites_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.dtree_menu_favorites_id_seq OWNED BY public.dtree_menu_favorites.id;
          public          postgres    false    221                       1259    42924    dtree_menu_items    TABLE     �   CREATE TABLE public.dtree_menu_items (
    id integer NOT NULL,
    name character varying NOT NULL,
    rootname character varying NOT NULL
);
 $   DROP TABLE public.dtree_menu_items;
       public         heap    postgres    false                       1259    42922    dtree_menu_items_id_seq    SEQUENCE     �   CREATE SEQUENCE public.dtree_menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.dtree_menu_items_id_seq;
       public          postgres    false    258            �           0    0    dtree_menu_items_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.dtree_menu_items_id_seq OWNED BY public.dtree_menu_items.id;
          public          postgres    false    257            �            1259    42098    dusers    TABLE     �   CREATE TABLE public.dusers (
    id integer NOT NULL,
    accessrole text NOT NULL,
    login text NOT NULL,
    hashed_password text NOT NULL
);
    DROP TABLE public.dusers;
       public         heap    postgres    false            �            1259    42096    dusers_id_seq    SEQUENCE     �   CREATE SEQUENCE public.dusers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.dusers_id_seq;
       public          postgres    false    220            �           0    0    dusers_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.dusers_id_seq OWNED BY public.dusers.id;
          public          postgres    false    219                       1259    43117    entriesAllocated    VIEW     �   CREATE VIEW public."entriesAllocated" AS
 SELECT sum("bAccountTransaction"."amountTransaction") AS "entriesAmount",
    "bAccountTransaction"."extTransactionId"
   FROM public."bAccountTransaction"
  GROUP BY "bAccountTransaction"."extTransactionId";
 %   DROP VIEW public."entriesAllocated";
       public          postgres    false    232    232            
           1259    59774    vbBalanceDateAccounts    VIEW     B  CREATE VIEW public."vbBalanceDateAccounts" AS
 SELECT "bAccounts"."accountNo",
    "bAccounts"."accountTypeExt",
    "bAccounts"."Information",
    "bAccounts"."clientId",
    "bAccounts"."currencyCode",
    "bAccounts"."entityTypeCode",
    "bAccounts"."accountId",
    "bAccounts"."dateOpening",
    "bAccounts".idportfolio,
    "balanceDate"."dateAcc"
   FROM (public."bAccounts"
     CROSS JOIN LATERAL ( SELECT DISTINCT "bAccountStatement"."dateAcc"
           FROM public."bAccountStatement") "balanceDate")
  WHERE ("bAccounts"."dateOpening" <= "balanceDate"."dateAcc");
 *   DROP VIEW public."vbBalanceDateAccounts";
       public          postgres    false    245    245    245    245    245    245    245    245    245    248                       1259    59779    vbBalanceDateLedger    VIEW     f  CREATE VIEW public."vbBalanceDateLedger" AS
 SELECT "bLedger"."accountTypeID",
    "bLedger".name,
    "bLedger"."clientID",
    "bLedger"."entityTypeCode",
    "bLedger"."ledgerNo",
    "bLedger"."currecyCode",
    "bLedger"."ledgerNoCptyCode",
    "bLedger"."ledgerNoTrade",
    "bLedger"."dateOpening",
    "bLedger"."externalAccountNo",
    "bLedger"."ledgerNoId",
    "balanceDate"."dateAcc"
   FROM (public."bLedger"
     CROSS JOIN LATERAL ( SELECT DISTINCT "bLedgerStatement"."dateAcc"
           FROM public."bLedgerStatement") "balanceDate")
  WHERE ("bLedger"."dateOpening" <= "balanceDate"."dateAcc");
 (   DROP VIEW public."vbBalanceDateLedger";
       public          postgres    false    238    238    235    238    238    238    238    238    238    238    238    238            O           2604    42140    aAccesRoles id    DEFAULT     t   ALTER TABLE ONLY public."aAccesRoles" ALTER COLUMN id SET DEFAULT nextval('public."aAccesRoles_id_seq"'::regclass);
 ?   ALTER TABLE public."aAccesRoles" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    226    225    226            N           2604    42129    aAccessConstraints id    DEFAULT     �   ALTER TABLE ONLY public."aAccessConstraints" ALTER COLUMN id SET DEFAULT nextval('public."aAccessConstraints_id_seq"'::regclass);
 F   ALTER TABLE public."aAccessConstraints" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    223    224    224            Z           2604    42859    bAccountStatement id    DEFAULT     �   ALTER TABLE ONLY public."bAccountStatement" ALTER COLUMN id SET DEFAULT nextval('public."bAccountStatement_id_seq"'::regclass);
 E   ALTER TABLE public."bAccountStatement" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    248    247    248            R           2604    42620    bAccountTransaction id    DEFAULT     �   ALTER TABLE ONLY public."bAccountTransaction" ALTER COLUMN id SET DEFAULT nextval('public."bAccountTransaction_id_seq"'::regclass);
 G   ALTER TABLE public."bAccountTransaction" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    233    232            Y           2604    43074    bAccounts accountId    DEFAULT     �   ALTER TABLE ONLY public."bAccounts" ALTER COLUMN "accountId" SET DEFAULT nextval('public."bAccounts_accountId_seq"'::regclass);
 F   ALTER TABLE public."bAccounts" ALTER COLUMN "accountId" DROP DEFAULT;
       public          postgres    false    262    245            [           2604    42879    bAccountsPortfoliosLink id    DEFAULT     �   ALTER TABLE ONLY public."bAccountsPortfoliosLink" ALTER COLUMN id SET DEFAULT nextval('public."bAccountsPortfoliosLink_id_seq"'::regclass);
 K   ALTER TABLE public."bAccountsPortfoliosLink" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    250    249    250            U           2604    43085    bLedger ledgerNoId    DEFAULT     ~   ALTER TABLE ONLY public."bLedger" ALTER COLUMN "ledgerNoId" SET DEFAULT nextval('public."bLedger_ledgerNoId_seq"'::regclass);
 E   ALTER TABLE public."bLedger" ALTER COLUMN "ledgerNoId" DROP DEFAULT;
       public          postgres    false    263    238            S           2604    42632    bLedgerStatement id    DEFAULT     ~   ALTER TABLE ONLY public."bLedgerStatement" ALTER COLUMN id SET DEFAULT nextval('public."bLedgerStatement_id_seq"'::regclass);
 D   ALTER TABLE public."bLedgerStatement" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    235    234    235            T           2604    42643    bLedgerTransactions id    DEFAULT     �   ALTER TABLE ONLY public."bLedgerTransactions" ALTER COLUMN id SET DEFAULT nextval('public."bLedgerTransactions_id_seq"'::regclass);
 G   ALTER TABLE public."bLedgerTransactions" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    236    237    237            ^           2604    42916    bSWIFTGlobalMsg id    DEFAULT     |   ALTER TABLE ONLY public."bSWIFTGlobalMsg" ALTER COLUMN id SET DEFAULT nextval('public."bGlobalMsgSwift_id_seq"'::regclass);
 C   ALTER TABLE public."bSWIFTGlobalMsg" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    256    255    256            ]           2604    42905    bSWIFTStatement id    DEFAULT     |   ALTER TABLE ONLY public."bSWIFTStatement" ALTER COLUMN id SET DEFAULT nextval('public."bStatementSWIFT_id_seq"'::regclass);
 C   ALTER TABLE public."bSWIFTStatement" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    254    253    254            V           2604    42666    bcAccountType id    DEFAULT     x   ALTER TABLE ONLY public."bcAccountType" ALTER COLUMN id SET DEFAULT nextval('public."bcAccountType_id_seq"'::regclass);
 A   ALTER TABLE public."bcAccountType" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    240    239    240            X           2604    42734 !   bcAccountType_Ext accountType_Ext    DEFAULT     �   ALTER TABLE ONLY public."bcAccountType_Ext" ALTER COLUMN "accountType_Ext" SET DEFAULT nextval('public."bcAccountType_Ext_accountType_Ext_seq"'::regclass);
 T   ALTER TABLE public."bcAccountType_Ext" ALTER COLUMN "accountType_Ext" DROP DEFAULT;
       public          postgres    false    244    243    244            `           2604    42978 "   bcTransactionSchemes_Parameters id    DEFAULT     �   ALTER TABLE ONLY public."bcTransactionSchemes_Parameters" ALTER COLUMN id SET DEFAULT nextval('public."bcTransactionSchemes_Parameters_id_seq"'::regclass);
 S   ALTER TABLE public."bcTransactionSchemes_Parameters" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    260    259    260            W           2604    42712 !   bcTransactionType_DE xActTypeCode    DEFAULT     �   ALTER TABLE ONLY public."bcTransactionType_DE" ALTER COLUMN "xActTypeCode" SET DEFAULT nextval('public."bcTransactionType_DE_xActTypeCode_seq"'::regclass);
 T   ALTER TABLE public."bcTransactionType_DE" ALTER COLUMN "xActTypeCode" DROP DEFAULT;
       public          postgres    false    241    242    242            \           2604    42892    bcTransactionType_Ext id    DEFAULT     �   ALTER TABLE ONLY public."bcTransactionType_Ext" ALTER COLUMN id SET DEFAULT nextval('public."bcTransactionType_Ext_id_seq"'::regclass);
 I   ALTER TABLE public."bcTransactionType_Ext" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    252    251    252            C           2604    42032    dConstraints IdConstraint    DEFAULT     �   ALTER TABLE ONLY public."dConstraints" ALTER COLUMN "IdConstraint" SET DEFAULT nextval('public."dConstraints_IdConstraint_seq"'::regclass);
 L   ALTER TABLE public."dConstraints" ALTER COLUMN "IdConstraint" DROP DEFAULT;
       public          postgres    false    204    203            D           2604    42033    dCountries IdCountry    DEFAULT     �   ALTER TABLE ONLY public."dCountries" ALTER COLUMN "IdCountry" SET DEFAULT nextval('public."dCountries_IdCountry_seq"'::regclass);
 G   ALTER TABLE public."dCountries" ALTER COLUMN "IdCountry" DROP DEFAULT;
       public          postgres    false    206    205            E           2604    42034    dCurrencies IdCurrency    DEFAULT     �   ALTER TABLE ONLY public."dCurrencies" ALTER COLUMN "IdCurrency" SET DEFAULT nextval('public."dCurrencies_IdCurrency_seq"'::regclass);
 I   ALTER TABLE public."dCurrencies" ALTER COLUMN "IdCurrency" DROP DEFAULT;
       public          postgres    false    208    207            F           2604    42035    dFInstruments IdInstrument    DEFAULT     �   ALTER TABLE ONLY public."dFInstruments" ALTER COLUMN "IdInstrument" SET DEFAULT nextval('public."dFInstruments_IdInstrument_seq"'::regclass);
 M   ALTER TABLE public."dFInstruments" ALTER COLUMN "IdInstrument" DROP DEFAULT;
       public          postgres    false    210    209            Q           2604    42599    dGeneralTypes id    DEFAULT     x   ALTER TABLE ONLY public."dGeneralTypes" ALTER COLUMN id SET DEFAULT nextval('public."dGeneralTypes_id_seq"'::regclass);
 A   ALTER TABLE public."dGeneralTypes" ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    231    230    231            G           2604    42036 !   dInstrumentTypes IdInstrymentType    DEFAULT     �   ALTER TABLE ONLY public."dInstrumentTypes" ALTER COLUMN "IdInstrymentType" SET DEFAULT nextval('public."dInstrumentTypes_IdInstrymentType_seq"'::regclass);
 T   ALTER TABLE public."dInstrumentTypes" ALTER COLUMN "IdInstrymentType" DROP DEFAULT;
       public          postgres    false    212    211            B           2604    42343    dclients idclient    DEFAULT     x   ALTER TABLE ONLY public.dclients ALTER COLUMN idclient SET DEFAULT nextval('public."dClients_IdClient_seq"'::regclass);
 @   ALTER TABLE public.dclients ALTER COLUMN idclient DROP DEFAULT;
       public          postgres    false    202    201            H           2604    42037    dportfolios idportfolio    DEFAULT     �   ALTER TABLE ONLY public.dportfolios ALTER COLUMN idportfolio SET DEFAULT nextval('public."dPortfolios_IdPortfolio_seq"'::regclass);
 F   ALTER TABLE public.dportfolios ALTER COLUMN idportfolio DROP DEFAULT;
       public          postgres    false    214    213            P           2604    42563    dstrategies_global_structure id    DEFAULT     �   ALTER TABLE ONLY public.dstrategies_global_structure ALTER COLUMN id SET DEFAULT nextval('public.dstrategies_global_structure_id_seq'::regclass);
 N   ALTER TABLE public.dstrategies_global_structure ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    228    229    229            I           2604    42039    dstrategiesglobal id    DEFAULT     }   ALTER TABLE ONLY public.dstrategiesglobal ALTER COLUMN id SET DEFAULT nextval('public."dStrategiesGobal_id_seq"'::regclass);
 C   ALTER TABLE public.dstrategiesglobal ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    216    215            M           2604    42115    dtree_menu_favorites id    DEFAULT     �   ALTER TABLE ONLY public.dtree_menu_favorites ALTER COLUMN id SET DEFAULT nextval('public.dtree_menu_favorites_id_seq'::regclass);
 F   ALTER TABLE public.dtree_menu_favorites ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    221    222    222            _           2604    42927    dtree_menu_items id    DEFAULT     z   ALTER TABLE ONLY public.dtree_menu_items ALTER COLUMN id SET DEFAULT nextval('public.dtree_menu_items_id_seq'::regclass);
 B   ALTER TABLE public.dtree_menu_items ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    257    258    258            L           2604    42101 	   dusers id    DEFAULT     f   ALTER TABLE ONLY public.dusers ALTER COLUMN id SET DEFAULT nextval('public.dusers_id_seq'::regclass);
 8   ALTER TABLE public.dusers ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    220    219    220            �          0    42137    aAccesRoles 
   TABLE DATA           J   COPY public."aAccesRoles" (id, "roleName", "roleDescription") FROM stdin;
    public          postgres    false    226   f�      �          0    42126    aAccessConstraints 
   TABLE DATA           |   COPY public."aAccessConstraints" (id, elementid, tsmodule, htmltemplate, elementtype, elementvalue, accessrole) FROM stdin;
    public          postgres    false    224   ��      �          0    42151    aMoexInstruments 
   TABLE DATA           "  COPY public."aMoexInstruments" (secid, shortname, name, typename, isin, regnumber, listlevel, facevalue, faceunit, issuesize, is_collateral, is_external, primary_boardid, primary_board_title, matdate, is_rii, issuedate, eveningsession, morningsession, is_qualified_investors, high_risk, yieldatwap, registryclosedate, dividendvalue, dividendyield, registryclosetype, emitentname, inn, lotsize, price, price_rub, rtl1, rth1, rtl2, rth2, rtl3, rth3, discount1, limit1, discount2, limit2, discount3, discountl0, discounth0, fullcovered) FROM stdin;
    public          postgres    false    227   ��      �          0    42856    bAccountStatement 
   TABLE DATA           x   COPY public."bAccountStatement" (id, "dateAcc", "closingBalance", "totalCredit", "totalDebit", "accountId") FROM stdin;
    public          postgres    false    248   4�      �          0    42612    bAccountTransaction 
   TABLE DATA           �   COPY public."bAccountTransaction" ("ledgerNoId", "dataTime", "XactTypeCode", "XactTypeCode_Ext", "accountId", id, "amountTransaction", "entryDetails", "extTransactionId") FROM stdin;
    public          postgres    false    232   ��      �          0    42791 	   bAccounts 
   TABLE DATA           �   COPY public."bAccounts" ("accountNo", "accountTypeExt", "Information", "clientId", "currencyCode", "entityTypeCode", "accountId", idportfolio, "dateOpening") FROM stdin;
    public          postgres    false    245   �w      �          0    42876    bAccountsPortfoliosLink 
   TABLE DATA           U   COPY public."bAccountsPortfoliosLink" ("portfolioId", "accountNoId", id) FROM stdin;
    public          postgres    false    250   �x      �          0    42652    bLedger 
   TABLE DATA           �   COPY public."bLedger" ("accountTypeID", name, "clientID", "entityTypeCode", "ledgerNo", "currecyCode", "ledgerNoCptyCode", "ledgerNoTrade", "externalAccountNo", "ledgerNoId", "dateOpening") FROM stdin;
    public          postgres    false    238   �x      �          0    42629    bLedgerStatement 
   TABLE DATA           v   COPY public."bLedgerStatement" (id, "ledgerID", "closingBalance", "totalDebit", "totalCredit", "dateAcc") FROM stdin;
    public          postgres    false    235   �y      �          0    42640    bLedgerTransactions 
   TABLE DATA           �   COPY public."bLedgerTransactions" (id, "ledgerID", "dateTime", amount, "ledgerID_Debit", "XactTypeCode_Ext", "entryDetails", "extTransactionId") FROM stdin;
    public          postgres    false    237   z      �          0    42913    bSWIFTGlobalMsg 
   TABLE DATA           h   COPY public."bSWIFTGlobalMsg" (id, "msgId", "senderBIC", "DateMsg", "typeMsg", "accountNo") FROM stdin;
    public          postgres    false    256   �z      �          0    42902    bSWIFTStatement 
   TABLE DATA           �   COPY public."bSWIFTStatement" (id, "msgId", "amountTransaction", "typeTransaction", "valueDate", comment, "entryAllocatedId", "refTransaction") FROM stdin;
    public          postgres    false    254   :{      �          0    42663    bcAccountType 
   TABLE DATA           [   COPY public."bcAccountType" (id, description, "accountTypeCode", "APTypeCode") FROM stdin;
    public          postgres    false    240   C|      �          0    42731    bcAccountType_Ext 
   TABLE DATA           {   COPY public."bcAccountType_Ext" ("accountType_Ext", "xActTypeCode", description, "actCodeShort", "APTypeCode") FROM stdin;
    public          postgres    false    244   �|      �          0    42805    bcEnityType 
   TABLE DATA           M   COPY public."bcEnityType" ("entityType", name, "entityTypeCode") FROM stdin;
    public          postgres    false    246   �}      �          0    43052    bcSchemeAccountTransaction 
   TABLE DATA             COPY public."bcSchemeAccountTransaction" ("ledgerNoId", "dataTime", "accountId", id, "amountTransaction", "accountNo", "entryDetails", "cSchemeGroupId", "cDate", "cxActTypeCode_Ext", "cxActTypeCode", "cLedgerType", "XactTypeCode", "XactTypeCode_Ext", "extTransactionId") FROM stdin;
    public          postgres    false    261   �}      �          0    42975    bcTransactionSchemes_Parameters 
   TABLE DATA           b   COPY public."bcTransactionSchemes_Parameters" (id, "pCode", "pPlace", "pDescription") FROM stdin;
    public          postgres    false    260   �~      �          0    42709    bcTransactionType_DE 
   TABLE DATA           F   COPY public."bcTransactionType_DE" ("xActTypeCode", name) FROM stdin;
    public          postgres    false    242   q      �          0    42889    bcTransactionType_Ext 
   TABLE DATA           ]   COPY public."bcTransactionType_Ext" (id, "xActTypeCode_Ext", description, code2) FROM stdin;
    public          postgres    false    252   �      z          0    41959    dConstraints 
   TABLE DATA           |   COPY public."dConstraints" ("IdConstraint", "IdClient", "IdConstraintType", "IdInstrument", "IdInstrumentType") FROM stdin;
    public          postgres    false    203   _�      |          0    41967 
   dCountries 
   TABLE DATA           P   COPY public."dCountries" ("IdCountry", "CountryName", "IsOffshore") FROM stdin;
    public          postgres    false    205   |�      ~          0    41972    dCurrencies 
   TABLE DATA           u   COPY public."dCurrencies" ("IdCurrency", "CurrencyCodeNum", "CurrencyName", "CurrencyCode", "IdCountry") FROM stdin;
    public          postgres    false    207   ��      �          0    41980    dFInstruments 
   TABLE DATA           �   COPY public."dFInstruments" ("IdInstrument", "InstrumentName", "InstrumentType", "Nominal", "MaturityDate", "MinTradingLot", "CurrencyNominal", "TradingCurrency") FROM stdin;
    public          postgres    false    209   �      �          0    42596    dGeneralTypes 
   TABLE DATA           Y   COPY public."dGeneralTypes" (id, "typeCode", "typeValue", "typeDescription") FROM stdin;
    public          postgres    false    231   e�      �          0    41988    dInstrumentTypes 
   TABLE DATA           [   COPY public."dInstrumentTypes" ("IdInstrymentType", "TypeName", "SubTypeName") FROM stdin;
    public          postgres    false    211   ہ      x          0    41951    dclients 
   TABLE DATA           �   COPY public.dclients (idclient, clientname, idcountrydomicile, isclientproffesional, address, contact_person, email, phone, code) FROM stdin;
    public          postgres    false    201   �      �          0    41996    dportfolios 
   TABLE DATA           d   COPY public.dportfolios (idportfolio, idclient, idstategy, portfolioname, portleverage) FROM stdin;
    public          postgres    false    213   ׃      �          0    42017 
   dpositions 
   TABLE DATA           z   COPY public.dpositions (idposition, pidtrade, pbuyidtrade, qtyinitial, qty_sold, qty_rest, ttype, tdate, pnl) FROM stdin;
    public          postgres    false    217   ��      �          0    42560    dstrategies_global_structure 
   TABLE DATA           r   COPY public.dstrategies_global_structure (id, id_strategy_parent, weight_of_child, id_strategy_child) FROM stdin;
    public          postgres    false    229   ��      �          0    42010    dstrategiesglobal 
   TABLE DATA           s   COPY public.dstrategiesglobal (id, sname, s_level_id, s_parent_id, s_description, s_benchmark_account) FROM stdin;
    public          postgres    false    215   r�      �          0    42024    dtrades 
   TABLE DATA           �   COPY public.dtrades (idtrade, qty, price, cpty, tdate, vdate, tidorder, allocatedqty, idportfolio, trtype, tidinstrument) FROM stdin;
    public          postgres    false    218   (�      �          0    42112    dtree_menu_favorites 
   TABLE DATA           [   COPY public.dtree_menu_favorites (id, nodename, nodeparent, userid, idelement) FROM stdin;
    public          postgres    false    222   R�      �          0    42924    dtree_menu_items 
   TABLE DATA           >   COPY public.dtree_menu_items (id, name, rootname) FROM stdin;
    public          postgres    false    258   Y�      �          0    42098    dusers 
   TABLE DATA           H   COPY public.dusers (id, accessrole, login, hashed_password) FROM stdin;
    public          postgres    false    220   ��      �           0    0    aAccesRoles_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public."aAccesRoles_id_seq"', 4, true);
          public          postgres    false    225            �           0    0    aAccessConstraints_id_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public."aAccessConstraints_id_seq"', 6, true);
          public          postgres    false    223            �           0    0    bAccountStatement_id_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public."bAccountStatement_id_seq"', 32, true);
          public          postgres    false    247            �           0    0    bAccountTransaction_id_seq    SEQUENCE SET     N   SELECT pg_catalog.setval('public."bAccountTransaction_id_seq"', 10307, true);
          public          postgres    false    233            �           0    0    bAccountsPortfoliosLink_id_seq    SEQUENCE SET     N   SELECT pg_catalog.setval('public."bAccountsPortfoliosLink_id_seq"', 3, true);
          public          postgres    false    249            �           0    0    bAccounts_accountId_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public."bAccounts_accountId_seq"', 9, true);
          public          postgres    false    262            �           0    0    bGlobalMsgSwift_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public."bGlobalMsgSwift_id_seq"', 1, true);
          public          postgres    false    255            �           0    0    bLedgerStatement_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public."bLedgerStatement_id_seq"', 17, true);
          public          postgres    false    234            �           0    0    bLedgerTransactions_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public."bLedgerTransactions_id_seq"', 8, true);
          public          postgres    false    236            �           0    0    bLedger_ledgerNoId_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public."bLedger_ledgerNoId_seq"', 7, true);
          public          postgres    false    263            �           0    0    bStatementSWIFT_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public."bStatementSWIFT_id_seq"', 6, true);
          public          postgres    false    253            �           0    0 %   bcAccountType_Ext_accountType_Ext_seq    SEQUENCE SET     V   SELECT pg_catalog.setval('public."bcAccountType_Ext_accountType_Ext_seq"', 12, true);
          public          postgres    false    243            �           0    0    bcAccountType_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public."bcAccountType_id_seq"', 8, true);
          public          postgres    false    239            �           0    0 &   bcTransactionSchemes_Parameters_id_seq    SEQUENCE SET     V   SELECT pg_catalog.setval('public."bcTransactionSchemes_Parameters_id_seq"', 7, true);
          public          postgres    false    259            �           0    0 %   bcTransactionType_DE_xActTypeCode_seq    SEQUENCE SET     V   SELECT pg_catalog.setval('public."bcTransactionType_DE_xActTypeCode_seq"', 1, false);
          public          postgres    false    241            �           0    0    bcTransactionType_Ext_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public."bcTransactionType_Ext_id_seq"', 11, true);
          public          postgres    false    251            �           0    0    dClients_IdClient_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public."dClients_IdClient_seq"', 36, true);
          public          postgres    false    202            �           0    0    dConstraints_IdConstraint_seq    SEQUENCE SET     N   SELECT pg_catalog.setval('public."dConstraints_IdConstraint_seq"', 1, false);
          public          postgres    false    204            �           0    0    dCountries_IdCountry_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public."dCountries_IdCountry_seq"', 1, false);
          public          postgres    false    206            �           0    0    dCurrencies_IdCurrency_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public."dCurrencies_IdCurrency_seq"', 3, true);
          public          postgres    false    208            �           0    0    dFInstruments_IdInstrument_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public."dFInstruments_IdInstrument_seq"', 104, true);
          public          postgres    false    210            �           0    0    dGeneralTypes_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public."dGeneralTypes_id_seq"', 4, true);
          public          postgres    false    230            �           0    0 %   dInstrumentTypes_IdInstrymentType_seq    SEQUENCE SET     V   SELECT pg_catalog.setval('public."dInstrumentTypes_IdInstrymentType_seq"', 1, false);
          public          postgres    false    212            �           0    0    dPortfolios_IdPortfolio_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public."dPortfolios_IdPortfolio_seq"', 28, true);
          public          postgres    false    214            �           0    0    dStrategiesGobal_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public."dStrategiesGobal_id_seq"', 15, true);
          public          postgres    false    216            �           0    0 #   dstrategies_global_structure_id_seq    SEQUENCE SET     S   SELECT pg_catalog.setval('public.dstrategies_global_structure_id_seq', 120, true);
          public          postgres    false    228            �           0    0    dtree_menu_favorites_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.dtree_menu_favorites_id_seq', 137, true);
          public          postgres    false    221            �           0    0    dtree_menu_items_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.dtree_menu_items_id_seq', 4, true);
          public          postgres    false    257            �           0    0    dusers_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.dusers_id_seq', 23, true);
          public          postgres    false    219            �           2606    42145    aAccesRoles aAccesRoles_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public."aAccesRoles"
    ADD CONSTRAINT "aAccesRoles_pkey" PRIMARY KEY (id);
 J   ALTER TABLE ONLY public."aAccesRoles" DROP CONSTRAINT "aAccesRoles_pkey";
       public            postgres    false    226            �           2606    42134 *   aAccessConstraints aAccessConstraints_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public."aAccessConstraints"
    ADD CONSTRAINT "aAccessConstraints_pkey" PRIMARY KEY (id);
 X   ALTER TABLE ONLY public."aAccessConstraints" DROP CONSTRAINT "aAccessConstraints_pkey";
       public            postgres    false    224            �           2606    42864 (   bAccountStatement bAccountStatement_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public."bAccountStatement"
    ADD CONSTRAINT "bAccountStatement_pkey" PRIMARY KEY (id);
 V   ALTER TABLE ONLY public."bAccountStatement" DROP CONSTRAINT "bAccountStatement_pkey";
       public            postgres    false    248            �           2606    42772 ,   bAccountTransaction bAccountTransaction_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public."bAccountTransaction"
    ADD CONSTRAINT "bAccountTransaction_pkey" PRIMARY KEY (id);
 Z   ALTER TABLE ONLY public."bAccountTransaction" DROP CONSTRAINT "bAccountTransaction_pkey";
       public            postgres    false    232            �           2606    42881 4   bAccountsPortfoliosLink bAccountsPortfoliosLink_pkey 
   CONSTRAINT     v   ALTER TABLE ONLY public."bAccountsPortfoliosLink"
    ADD CONSTRAINT "bAccountsPortfoliosLink_pkey" PRIMARY KEY (id);
 b   ALTER TABLE ONLY public."bAccountsPortfoliosLink" DROP CONSTRAINT "bAccountsPortfoliosLink_pkey";
       public            postgres    false    250            �           2606    42921 $   bSWIFTGlobalMsg bGlobalMsgSwift_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public."bSWIFTGlobalMsg"
    ADD CONSTRAINT "bGlobalMsgSwift_pkey" PRIMARY KEY (id);
 R   ALTER TABLE ONLY public."bSWIFTGlobalMsg" DROP CONSTRAINT "bGlobalMsgSwift_pkey";
       public            postgres    false    256            �           2606    42637 &   bLedgerStatement bLedgerStatement_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public."bLedgerStatement"
    ADD CONSTRAINT "bLedgerStatement_pkey" PRIMARY KEY (id);
 T   ALTER TABLE ONLY public."bLedgerStatement" DROP CONSTRAINT "bLedgerStatement_pkey";
       public            postgres    false    235            �           2606    42648 ,   bLedgerTransactions bLedgerTransactions_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public."bLedgerTransactions"
    ADD CONSTRAINT "bLedgerTransactions_pkey" PRIMARY KEY (id);
 Z   ALTER TABLE ONLY public."bLedgerTransactions" DROP CONSTRAINT "bLedgerTransactions_pkey";
       public            postgres    false    237            �           2606    42899    bLedger bLedger_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public."bLedger"
    ADD CONSTRAINT "bLedger_pkey" PRIMARY KEY ("ledgerNo");
 B   ALTER TABLE ONLY public."bLedger" DROP CONSTRAINT "bLedger_pkey";
       public            postgres    false    238            �           2606    42910 $   bSWIFTStatement bStatementSWIFT_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public."bSWIFTStatement"
    ADD CONSTRAINT "bStatementSWIFT_pkey" PRIMARY KEY (id);
 R   ALTER TABLE ONLY public."bSWIFTStatement" DROP CONSTRAINT "bStatementSWIFT_pkey";
       public            postgres    false    254            �           2606    42736 (   bcAccountType_Ext bcAccountType_Ext_pkey 
   CONSTRAINT     y   ALTER TABLE ONLY public."bcAccountType_Ext"
    ADD CONSTRAINT "bcAccountType_Ext_pkey" PRIMARY KEY ("accountType_Ext");
 V   ALTER TABLE ONLY public."bcAccountType_Ext" DROP CONSTRAINT "bcAccountType_Ext_pkey";
       public            postgres    false    244            �           2606    42671     bcAccountType bcAccountType_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public."bcAccountType"
    ADD CONSTRAINT "bcAccountType_pkey" PRIMARY KEY (id);
 N   ALTER TABLE ONLY public."bcAccountType" DROP CONSTRAINT "bcAccountType_pkey";
       public            postgres    false    240            �           2606    42812    bcEnityType bcEnittyType_pkey 
   CONSTRAINT     i   ALTER TABLE ONLY public."bcEnityType"
    ADD CONSTRAINT "bcEnittyType_pkey" PRIMARY KEY ("entityType");
 K   ALTER TABLE ONLY public."bcEnityType" DROP CONSTRAINT "bcEnittyType_pkey";
       public            postgres    false    246            �           2606    43114 :   bcSchemeAccountTransaction bcSchemeAccountTransaction_pkey 
   CONSTRAINT     |   ALTER TABLE ONLY public."bcSchemeAccountTransaction"
    ADD CONSTRAINT "bcSchemeAccountTransaction_pkey" PRIMARY KEY (id);
 h   ALTER TABLE ONLY public."bcSchemeAccountTransaction" DROP CONSTRAINT "bcSchemeAccountTransaction_pkey";
       public            postgres    false    261            �           2606    42983 D   bcTransactionSchemes_Parameters bcTransactionSchemes_Parameters_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."bcTransactionSchemes_Parameters"
    ADD CONSTRAINT "bcTransactionSchemes_Parameters_pkey" PRIMARY KEY (id);
 r   ALTER TABLE ONLY public."bcTransactionSchemes_Parameters" DROP CONSTRAINT "bcTransactionSchemes_Parameters_pkey";
       public            postgres    false    260            �           2606    42717 .   bcTransactionType_DE bcTransactionType_DE_pkey 
   CONSTRAINT     |   ALTER TABLE ONLY public."bcTransactionType_DE"
    ADD CONSTRAINT "bcTransactionType_DE_pkey" PRIMARY KEY ("xActTypeCode");
 \   ALTER TABLE ONLY public."bcTransactionType_DE" DROP CONSTRAINT "bcTransactionType_DE_pkey";
       public            postgres    false    242            �           2606    42897 0   bcTransactionType_Ext bcTransactionType_Ext_pkey 
   CONSTRAINT     r   ALTER TABLE ONLY public."bcTransactionType_Ext"
    ADD CONSTRAINT "bcTransactionType_Ext_pkey" PRIMARY KEY (id);
 ^   ALTER TABLE ONLY public."bcTransactionType_Ext" DROP CONSTRAINT "bcTransactionType_Ext_pkey";
       public            postgres    false    252            �           2606    42798    bAccounts cPrimaryCode 
   CONSTRAINT     a   ALTER TABLE ONLY public."bAccounts"
    ADD CONSTRAINT "cPrimaryCode" PRIMARY KEY ("accountNo");
 D   ALTER TABLE ONLY public."bAccounts" DROP CONSTRAINT "cPrimaryCode";
       public            postgres    false    245            �           2606    42396    aAccesRoles cUaccessRole 
   CONSTRAINT     ]   ALTER TABLE ONLY public."aAccesRoles"
    ADD CONSTRAINT "cUaccessRole" UNIQUE ("roleName");
 F   ALTER TABLE ONLY public."aAccesRoles" DROP CONSTRAINT "cUaccessRole";
       public            postgres    false    226            �           2606    51314 3   bAccountStatement cUniqueAccStatementClosureBalance 
   CONSTRAINT     �   ALTER TABLE ONLY public."bAccountStatement"
    ADD CONSTRAINT "cUniqueAccStatementClosureBalance" UNIQUE ("dateAcc", "accountId");
 a   ALTER TABLE ONLY public."bAccountStatement" DROP CONSTRAINT "cUniqueAccStatementClosureBalance";
       public            postgres    false    248    248            �           2606    42394    aAccesRoles cUniqueAccessRole 
   CONSTRAINT     Z   ALTER TABLE ONLY public."aAccesRoles"
    ADD CONSTRAINT "cUniqueAccessRole" UNIQUE (id);
 K   ALTER TABLE ONLY public."aAccesRoles" DROP CONSTRAINT "cUniqueAccessRole";
       public            postgres    false    226            �           2606    51320    bAccounts cUniqueAccountId 
   CONSTRAINT     `   ALTER TABLE ONLY public."bAccounts"
    ADD CONSTRAINT "cUniqueAccountId" UNIQUE ("accountId");
 H   ALTER TABLE ONLY public."bAccounts" DROP CONSTRAINT "cUniqueAccountId";
       public            postgres    false    245            c           2606    42354    dclients cUniqueClient 
   CONSTRAINT     W   ALTER TABLE ONLY public.dclients
    ADD CONSTRAINT "cUniqueClient" UNIQUE (idclient);
 B   ALTER TABLE ONLY public.dclients DROP CONSTRAINT "cUniqueClient";
       public            postgres    false    201            r           2606    42360    dportfolios cUniqueClientP 
   CONSTRAINT     h   ALTER TABLE ONLY public.dportfolios
    ADD CONSTRAINT "cUniqueClientP" UNIQUE (idclient, idportfolio);
 F   ALTER TABLE ONLY public.dportfolios DROP CONSTRAINT "cUniqueClientP";
       public            postgres    false    213    213            �           2606    42423    aMoexInstruments cUniqueIns 
   CONSTRAINT     [   ALTER TABLE ONLY public."aMoexInstruments"
    ADD CONSTRAINT "cUniqueIns" UNIQUE (secid);
 I   ALTER TABLE ONLY public."aMoexInstruments" DROP CONSTRAINT "cUniqueIns";
       public            postgres    false    227            �           2606    51328    bLedger cUniqueLedgerIDLedger 
   CONSTRAINT     d   ALTER TABLE ONLY public."bLedger"
    ADD CONSTRAINT "cUniqueLedgerIDLedger" UNIQUE ("ledgerNoId");
 K   ALTER TABLE ONLY public."bLedger" DROP CONSTRAINT "cUniqueLedgerIDLedger";
       public            postgres    false    238            �           2606    51316 5   bLedgerStatement cUniqueLedgerStatementClosureBalance 
   CONSTRAINT     �   ALTER TABLE ONLY public."bLedgerStatement"
    ADD CONSTRAINT "cUniqueLedgerStatementClosureBalance" UNIQUE ("ledgerID", "dateAcc");
 c   ALTER TABLE ONLY public."bLedgerStatement" DROP CONSTRAINT "cUniqueLedgerStatementClosureBalance";
       public            postgres    false    235    235            �           2606    42611 ?   dstrategies_global_structure cUniqueParentStrategyChildStrategy 
   CONSTRAINT     �   ALTER TABLE ONLY public.dstrategies_global_structure
    ADD CONSTRAINT "cUniqueParentStrategyChildStrategy" UNIQUE (id_strategy_child, id_strategy_parent);
 k   ALTER TABLE ONLY public.dstrategies_global_structure DROP CONSTRAINT "cUniqueParentStrategyChildStrategy";
       public            postgres    false    229    229            t           2606    42356    dportfolios cUniquePortfolio_ 
   CONSTRAINT     a   ALTER TABLE ONLY public.dportfolios
    ADD CONSTRAINT "cUniquePortfolio_" UNIQUE (idportfolio);
 I   ALTER TABLE ONLY public.dportfolios DROP CONSTRAINT "cUniquePortfolio_";
       public            postgres    false    213            {           2606    42386 !   dstrategiesglobal cUniqueStrategy 
   CONSTRAINT     \   ALTER TABLE ONLY public.dstrategiesglobal
    ADD CONSTRAINT "cUniqueStrategy" UNIQUE (id);
 M   ALTER TABLE ONLY public.dstrategiesglobal DROP CONSTRAINT "cUniqueStrategy";
       public            postgres    false    215            g           2606    42041    dConstraints dConstraints_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public."dConstraints"
    ADD CONSTRAINT "dConstraints_pkey" PRIMARY KEY ("IdConstraintType");
 L   ALTER TABLE ONLY public."dConstraints" DROP CONSTRAINT "dConstraints_pkey";
       public            postgres    false    203            j           2606    42043    dCountries dCountries_pkey 
   CONSTRAINT     e   ALTER TABLE ONLY public."dCountries"
    ADD CONSTRAINT "dCountries_pkey" PRIMARY KEY ("IdCountry");
 H   ALTER TABLE ONLY public."dCountries" DROP CONSTRAINT "dCountries_pkey";
       public            postgres    false    205            l           2606    42045    dCurrencies dCurrencies_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public."dCurrencies"
    ADD CONSTRAINT "dCurrencies_pkey" PRIMARY KEY ("IdCurrency");
 J   ALTER TABLE ONLY public."dCurrencies" DROP CONSTRAINT "dCurrencies_pkey";
       public            postgres    false    207            n           2606    42047     dFInstruments dFInstruments_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public."dFInstruments"
    ADD CONSTRAINT "dFInstruments_pkey" PRIMARY KEY ("IdInstrument");
 N   ALTER TABLE ONLY public."dFInstruments" DROP CONSTRAINT "dFInstruments_pkey";
       public            postgres    false    209            �           2606    42604     dGeneralTypes dGeneralTypes_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public."dGeneralTypes"
    ADD CONSTRAINT "dGeneralTypes_pkey" PRIMARY KEY (id);
 N   ALTER TABLE ONLY public."dGeneralTypes" DROP CONSTRAINT "dGeneralTypes_pkey";
       public            postgres    false    231            p           2606    42049 &   dInstrumentTypes dInstrumentTypes_pkey 
   CONSTRAINT     x   ALTER TABLE ONLY public."dInstrumentTypes"
    ADD CONSTRAINT "dInstrumentTypes_pkey" PRIMARY KEY ("IdInstrymentType");
 T   ALTER TABLE ONLY public."dInstrumentTypes" DROP CONSTRAINT "dInstrumentTypes_pkey";
       public            postgres    false    211            v           2606    42051    dportfolios dPortfolios_pkey 
   CONSTRAINT     e   ALTER TABLE ONLY public.dportfolios
    ADD CONSTRAINT "dPortfolios_pkey" PRIMARY KEY (idportfolio);
 H   ALTER TABLE ONLY public.dportfolios DROP CONSTRAINT "dPortfolios_pkey";
       public            postgres    false    213            }           2606    42053 '   dstrategiesglobal dStrategiesGobal_pkey 
   CONSTRAINT     g   ALTER TABLE ONLY public.dstrategiesglobal
    ADD CONSTRAINT "dStrategiesGobal_pkey" PRIMARY KEY (id);
 S   ALTER TABLE ONLY public.dstrategiesglobal DROP CONSTRAINT "dStrategiesGobal_pkey";
       public            postgres    false    215            e           2606    42351    dclients dclients_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.dclients
    ADD CONSTRAINT dclients_pkey PRIMARY KEY (idclient);
 @   ALTER TABLE ONLY public.dclients DROP CONSTRAINT dclients_pkey;
       public            postgres    false    201            �           2606    42570 >   dstrategies_global_structure dstrategies_global_structure_pkey 
   CONSTRAINT     |   ALTER TABLE ONLY public.dstrategies_global_structure
    ADD CONSTRAINT dstrategies_global_structure_pkey PRIMARY KEY (id);
 h   ALTER TABLE ONLY public.dstrategies_global_structure DROP CONSTRAINT dstrategies_global_structure_pkey;
       public            postgres    false    229            �           2606    42486    dtrades dtrades_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public.dtrades
    ADD CONSTRAINT dtrades_pkey PRIMARY KEY (idtrade);
 >   ALTER TABLE ONLY public.dtrades DROP CONSTRAINT dtrades_pkey;
       public            postgres    false    218            �           2606    42120 .   dtree_menu_favorites dtree_menu_favorites_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.dtree_menu_favorites
    ADD CONSTRAINT dtree_menu_favorites_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY public.dtree_menu_favorites DROP CONSTRAINT dtree_menu_favorites_pkey;
       public            postgres    false    222            �           2606    42932 &   dtree_menu_items dtree_menu_items_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.dtree_menu_items
    ADD CONSTRAINT dtree_menu_items_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.dtree_menu_items DROP CONSTRAINT dtree_menu_items_pkey;
       public            postgres    false    258            �           2606    42108    dusers dusers_login_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.dusers
    ADD CONSTRAINT dusers_login_key UNIQUE (login);
 A   ALTER TABLE ONLY public.dusers DROP CONSTRAINT dusers_login_key;
       public            postgres    false    220            �           2606    42106    dusers dusers_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.dusers
    ADD CONSTRAINT dusers_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.dusers DROP CONSTRAINT dusers_pkey;
       public            postgres    false    220            �           1259    43121    AT_ExtID    INDEX     Z   CREATE INDEX "AT_ExtID" ON public."bAccountTransaction" USING btree ("extTransactionId");
    DROP INDEX public."AT_ExtID";
       public            postgres    false    232            �           1259    51371    IdateAccountStatement    INDEX     \   CREATE INDEX "IdateAccountStatement" ON public."bAccountStatement" USING btree ("dateAcc");
 +   DROP INDEX public."IdateAccountStatement";
       public            postgres    false    248            �           1259    51370    IdateAccountTranaction    INDEX     `   CREATE INDEX "IdateAccountTranaction" ON public."bAccountTransaction" USING btree ("dataTime");
 ,   DROP INDEX public."IdateAccountTranaction";
       public            postgres    false    232            �           1259    51369    IdateLedgerStatement    INDEX     Z   CREATE INDEX "IdateLedgerStatement" ON public."bLedgerStatement" USING btree ("dateAcc");
 *   DROP INDEX public."IdateLedgerStatement";
       public            postgres    false    235            �           1259    51368    IdateLedgerTranaction    INDEX     _   CREATE INDEX "IdateLedgerTranaction" ON public."bLedgerTransactions" USING btree ("dateTime");
 +   DROP INDEX public."IdateLedgerTranaction";
       public            postgres    false    237            �           1259    42342 
   accessRole    INDEX     S   CREATE INDEX "accessRole" ON public."aAccessConstraints" USING btree (accessrole);
     DROP INDEX public."accessRole";
       public            postgres    false    224            �           1259    51195    bAccountTransaction_AccountId    INDEX     h   CREATE INDEX "bAccountTransaction_AccountId" ON public."bAccountTransaction" USING btree ("accountId");
 3   DROP INDEX public."bAccountTransaction_AccountId";
       public            postgres    false    232            �           1259    51194    bAccountTransaction_EntryDate    INDEX     g   CREATE INDEX "bAccountTransaction_EntryDate" ON public."bAccountTransaction" USING btree ("dataTime");
 3   DROP INDEX public."bAccountTransaction_EntryDate";
       public            postgres    false    232            �           1259    59784 !   bAccountTransactiondateTrancation    INDEX     k   CREATE INDEX "bAccountTransactiondateTrancation" ON public."bAccountTransaction" USING btree ("dataTime");
 7   DROP INDEX public."bAccountTransactiondateTrancation";
       public            postgres    false    232            �           1259    42425    dtradesPortfolioId    INDEX     O   CREATE INDEX "dtradesPortfolioId" ON public.dtrades USING btree (idportfolio);
 (   DROP INDEX public."dtradesPortfolioId";
       public            postgres    false    218            w           1259    42366    fki_Client_Link    INDEX     M   CREATE INDEX "fki_Client_Link" ON public.dportfolios USING btree (idclient);
 %   DROP INDEX public."fki_Client_Link";
       public            postgres    false    213                       1259    42533    fki_R    INDEX     B   CREATE INDEX "fki_R" ON public.dpositions USING btree (pidtrade);
    DROP INDEX public."fki_R";
       public            postgres    false    217            �           1259    42421 #   fki_cForeignAccessRoleConstraintKey    INDEX     l   CREATE INDEX "fki_cForeignAccessRoleConstraintKey" ON public."aAccessConstraints" USING btree (accessrole);
 9   DROP INDEX public."fki_cForeignAccessRoleConstraintKey";
       public            postgres    false    224            �           1259    42402    fki_cForeignAccessRoleKey    INDEX     T   CREATE INDEX "fki_cForeignAccessRoleKey" ON public.dusers USING btree (accessrole);
 /   DROP INDEX public."fki_cForeignAccessRoleKey";
       public            postgres    false    220            ~           1259    42557 "   fki_cForeignAccountIdKeyStrategies    INDEX     q   CREATE INDEX "fki_cForeignAccountIdKeyStrategies" ON public.dstrategiesglobal USING btree (s_benchmark_account);
 8   DROP INDEX public."fki_cForeignAccountIdKeyStrategies";
       public            postgres    false    215            �           1259    42841    fki_cForeignAccountType    INDEX     Z   CREATE INDEX "fki_cForeignAccountType" ON public."bLedger" USING btree ("accountTypeID");
 -   DROP INDEX public."fki_cForeignAccountType";
       public            postgres    false    238            �           1259    51326 &   fki_cForeignAcountIdAccountTransaction    INDEX     q   CREATE INDEX "fki_cForeignAcountIdAccountTransaction" ON public."bAccountTransaction" USING btree ("accountId");
 <   DROP INDEX public."fki_cForeignAcountIdAccountTransaction";
       public            postgres    false    232            x           1259    42372    fki_cForeignClientKey    INDEX     S   CREATE INDEX "fki_cForeignClientKey" ON public.dportfolios USING btree (idclient);
 +   DROP INDEX public."fki_cForeignClientKey";
       public            postgres    false    213            �           1259    42818    fki_cForeignEntityType    INDEX     \   CREATE INDEX "fki_cForeignEntityType" ON public."bAccounts" USING btree ("accountTypeExt");
 ,   DROP INDEX public."fki_cForeignEntityType";
       public            postgres    false    245            h           1259    42459 "   fki_cForeignKeyCilentIdConstrintss    INDEX     e   CREATE INDEX "fki_cForeignKeyCilentIdConstrintss" ON public."dConstraints" USING btree ("IdClient");
 8   DROP INDEX public."fki_cForeignKeyCilentIdConstrintss";
       public            postgres    false    203            �           1259    42438 !   fki_cForeignKeyDTradesPortfolioId    INDEX     ^   CREATE INDEX "fki_cForeignKeyDTradesPortfolioId" ON public.dtrades USING btree (idportfolio);
 7   DROP INDEX public."fki_cForeignKeyDTradesPortfolioId";
       public            postgres    false    218            �           1259    42475    fki_cForeignKeyInstrumentdTrade    INDEX     ^   CREATE INDEX "fki_cForeignKeyInstrumentdTrade" ON public.dtrades USING btree (tidinstrument);
 5   DROP INDEX public."fki_cForeignKeyInstrumentdTrade";
       public            postgres    false    218            �           1259    42505    fki_cForeignKeySecIdPositions    INDEX     Z   CREATE INDEX "fki_cForeignKeySecIdPositions" ON public.dpositions USING btree (pidtrade);
 3   DROP INDEX public."fki_cForeignKeySecIdPositions";
       public            postgres    false    217            y           1259    42522 !   fki_cForeignKeyStrategyPortfolios    INDEX     `   CREATE INDEX "fki_cForeignKeyStrategyPortfolios" ON public.dportfolios USING btree (idstategy);
 7   DROP INDEX public."fki_cForeignKeyStrategyPortfolios";
       public            postgres    false    213            �           1259    51350    fki_cForeignLedgerId    INDEX     `   CREATE INDEX "fki_cForeignLedgerId" ON public."bAccountTransaction" USING btree ("ledgerNoId");
 *   DROP INDEX public."fki_cForeignLedgerId";
       public            postgres    false    232            �           1259    42831    fki_cForeignLedgerNo    INDEX     [   CREATE INDEX "fki_cForeignLedgerNo" ON public."bLedgerStatement" USING btree ("ledgerID");
 *   DROP INDEX public."fki_cForeignLedgerNo";
       public            postgres    false    235            �           1259    42415    fki_cForeignUserIdFavoretiesKey    INDEX     d   CREATE INDEX "fki_cForeignUserIdFavoretiesKey" ON public.dtree_menu_favorites USING btree (userid);
 5   DROP INDEX public."fki_cForeignUserIdFavoretiesKey";
       public            postgres    false    222            �           1259    42588     fki_cParentid_StrategiesGolbalID    INDEX     y   CREATE INDEX "fki_cParentid_StrategiesGolbalID" ON public.dstrategies_global_structure USING btree (id_strategy_parent);
 6   DROP INDEX public."fki_cParentid_StrategiesGolbalID";
       public            postgres    false    229            �           1259    51329    fki_cUniqueLedgerID    INDEX     _   CREATE INDEX "fki_cUniqueLedgerID" ON public."bAccountTransaction" USING btree ("ledgerNoId");
 )   DROP INDEX public."fki_cUniqueLedgerID";
       public            postgres    false    232            �           1259    42782    fki_cUniqueXactTypeCode    INDEX     e   CREATE INDEX "fki_cUniqueXactTypeCode" ON public."bAccountTransaction" USING btree ("XactTypeCode");
 -   DROP INDEX public."fki_cUniqueXactTypeCode";
       public            postgres    false    232            �           1259    42790    fki_cUniqueXactTypeCodeExt    INDEX     l   CREATE INDEX "fki_cUniqueXactTypeCodeExt" ON public."bAccountTransaction" USING btree ("XactTypeCode_Ext");
 0   DROP INDEX public."fki_cUniqueXactTypeCodeExt";
       public            postgres    false    232            �           1259    42576    fki_с    INDEX     _   CREATE INDEX "fki_с" ON public.dstrategies_global_structure USING btree (id_strategy_parent);
    DROP INDEX public."fki_с";
       public            postgres    false    229            �           1259    42487 	   iTradesId    INDEX     I   CREATE UNIQUE INDEX "iTradesId" ON public.dtrades USING btree (idtrade);
    DROP INDEX public."iTradesId";
       public            postgres    false    218            �           1259    43115    id    INDEX     I   CREATE INDEX id ON public."bcSchemeAccountTransaction" USING btree (id);
    DROP INDEX public.id;
       public            postgres    false    261            �           1259    43116    idAT    INDEX     F   CREATE INDEX "idAT" ON public."bAccountTransaction" USING btree (id);
    DROP INDEX public."idAT";
       public            postgres    false    232            �           1259    42329    secid    INDEX     E   CREATE INDEX secid ON public."aMoexInstruments" USING btree (secid);
    DROP INDEX public.secid;
       public            postgres    false    227            �           2606    42465 2   aAccessConstraints cForeignAccessRoleConstraintKey    FK CONSTRAINT     �   ALTER TABLE ONLY public."aAccessConstraints"
    ADD CONSTRAINT "cForeignAccessRoleConstraintKey" FOREIGN KEY (accessrole) REFERENCES public."aAccesRoles"("roleName") ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 `   ALTER TABLE ONLY public."aAccessConstraints" DROP CONSTRAINT "cForeignAccessRoleConstraintKey";
       public          postgres    false    3222    226    224            �           2606    42444    dusers cForeignAccessRoleKey    FK CONSTRAINT     �   ALTER TABLE ONLY public.dusers
    ADD CONSTRAINT "cForeignAccessRoleKey" FOREIGN KEY (accessrole) REFERENCES public."aAccesRoles"("roleName") ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 H   ALTER TABLE ONLY public.dusers DROP CONSTRAINT "cForeignAccessRoleKey";
       public          postgres    false    220    3222    226            �           2606    42552 0   dstrategiesglobal cForeignAccountIdKeyStrategies    FK CONSTRAINT     �   ALTER TABLE ONLY public.dstrategiesglobal
    ADD CONSTRAINT "cForeignAccountIdKeyStrategies" FOREIGN KEY (s_benchmark_account) REFERENCES public.dportfolios(idportfolio) NOT VALID;
 \   ALTER TABLE ONLY public.dstrategiesglobal DROP CONSTRAINT "cForeignAccountIdKeyStrategies";
       public          postgres    false    3190    213    215            �           2606    51321 6   bAccountTransaction cForeignAcountIdAccountTransaction    FK CONSTRAINT     �   ALTER TABLE ONLY public."bAccountTransaction"
    ADD CONSTRAINT "cForeignAcountIdAccountTransaction" FOREIGN KEY ("accountId") REFERENCES public."bAccounts"("accountId") NOT VALID;
 d   ALTER TABLE ONLY public."bAccountTransaction" DROP CONSTRAINT "cForeignAcountIdAccountTransaction";
       public          postgres    false    232    3272    245            �           2606    42367    dportfolios cForeignClientKey    FK CONSTRAINT     �   ALTER TABLE ONLY public.dportfolios
    ADD CONSTRAINT "cForeignClientKey" FOREIGN KEY (idclient) REFERENCES public.dclients(idclient) ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 I   ALTER TABLE ONLY public.dportfolios DROP CONSTRAINT "cForeignClientKey";
       public          postgres    false    3173    201    213            �           2606    42882    bAccounts cForeignEntityType    FK CONSTRAINT     �   ALTER TABLE ONLY public."bAccounts"
    ADD CONSTRAINT "cForeignEntityType" FOREIGN KEY ("entityTypeCode") REFERENCES public."bcEnityType"("entityType") ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 J   ALTER TABLE ONLY public."bAccounts" DROP CONSTRAINT "cForeignEntityType";
       public          postgres    false    245    3275    246            �           2606    42460 +   dConstraints cForeignKeyCilentIdConstrintss    FK CONSTRAINT     �   ALTER TABLE ONLY public."dConstraints"
    ADD CONSTRAINT "cForeignKeyCilentIdConstrintss" FOREIGN KEY ("IdClient") REFERENCES public.dclients(idclient) ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 Y   ALTER TABLE ONLY public."dConstraints" DROP CONSTRAINT "cForeignKeyCilentIdConstrintss";
       public          postgres    false    3173    201    203            �           2606    42433 %   dtrades cForeignKeyDTradesPortfolioId    FK CONSTRAINT     �   ALTER TABLE ONLY public.dtrades
    ADD CONSTRAINT "cForeignKeyDTradesPortfolioId" FOREIGN KEY (idportfolio) REFERENCES public.dportfolios(idportfolio) ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 Q   ALTER TABLE ONLY public.dtrades DROP CONSTRAINT "cForeignKeyDTradesPortfolioId";
       public          postgres    false    213    218    3190            �           2606    42476 #   dtrades cForeignKeyInstrumentdTrade    FK CONSTRAINT     �   ALTER TABLE ONLY public.dtrades
    ADD CONSTRAINT "cForeignKeyInstrumentdTrade" FOREIGN KEY (tidinstrument) REFERENCES public."aMoexInstruments"(secid) ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 O   ALTER TABLE ONLY public.dtrades DROP CONSTRAINT "cForeignKeyInstrumentdTrade";
       public          postgres    false    218    3226    227            �           2606    42500 $   dpositions cForeignKeySecIdPositions    FK CONSTRAINT     �   ALTER TABLE ONLY public.dpositions
    ADD CONSTRAINT "cForeignKeySecIdPositions" FOREIGN KEY (pidtrade) REFERENCES public.dtrades(idtrade) ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 P   ALTER TABLE ONLY public.dpositions DROP CONSTRAINT "cForeignKeySecIdPositions";
       public          postgres    false    217    3203    218            �           2606    42523 )   dportfolios cForeignKeyStrategyPortfolios    FK CONSTRAINT     �   ALTER TABLE ONLY public.dportfolios
    ADD CONSTRAINT "cForeignKeyStrategyPortfolios" FOREIGN KEY (idstategy) REFERENCES public.dstrategiesglobal(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 U   ALTER TABLE ONLY public.dportfolios DROP CONSTRAINT "cForeignKeyStrategyPortfolios";
       public          postgres    false    213    3197    215            �           2606    42528 %   dpositions cForeignKeyTradesPositions    FK CONSTRAINT     �   ALTER TABLE ONLY public.dpositions
    ADD CONSTRAINT "cForeignKeyTradesPositions" FOREIGN KEY (pidtrade) REFERENCES public.dtrades(idtrade) ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 Q   ALTER TABLE ONLY public.dpositions DROP CONSTRAINT "cForeignKeyTradesPositions";
       public          postgres    false    217    218    3203            �           2606    51345 $   bAccountTransaction cForeignLedgerId    FK CONSTRAINT     �   ALTER TABLE ONLY public."bAccountTransaction"
    ADD CONSTRAINT "cForeignLedgerId" FOREIGN KEY ("ledgerNoId") REFERENCES public."bLedger"("ledgerNoId") NOT VALID;
 R   ALTER TABLE ONLY public."bAccountTransaction" DROP CONSTRAINT "cForeignLedgerId";
       public          postgres    false    3261    238    232            �           2606    42439 0   dtree_menu_favorites cForeignUserIdFavoretiesKey    FK CONSTRAINT     �   ALTER TABLE ONLY public.dtree_menu_favorites
    ADD CONSTRAINT "cForeignUserIdFavoretiesKey" FOREIGN KEY (userid) REFERENCES public.dusers(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
 \   ALTER TABLE ONLY public.dtree_menu_favorites DROP CONSTRAINT "cForeignUserIdFavoretiesKey";
       public          postgres    false    220    222    3210            �           2606    42583 9   dstrategies_global_structure cParentid_StrategiesGolbalID    FK CONSTRAINT     �   ALTER TABLE ONLY public.dstrategies_global_structure
    ADD CONSTRAINT "cParentid_StrategiesGolbalID" FOREIGN KEY (id_strategy_parent) REFERENCES public.dstrategiesglobal(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 e   ALTER TABLE ONLY public.dstrategies_global_structure DROP CONSTRAINT "cParentid_StrategiesGolbalID";
       public          postgres    false    215    3197    229            �           2606    42777 '   bAccountTransaction cUniqueXactTypeCode    FK CONSTRAINT     �   ALTER TABLE ONLY public."bAccountTransaction"
    ADD CONSTRAINT "cUniqueXactTypeCode" FOREIGN KEY ("XactTypeCode") REFERENCES public."bcTransactionType_DE"("xActTypeCode") ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
 U   ALTER TABLE ONLY public."bAccountTransaction" DROP CONSTRAINT "cUniqueXactTypeCode";
       public          postgres    false    3266    242    232            �           2606    42737    bcAccountType_Ext cxActTypeCode    FK CONSTRAINT     �   ALTER TABLE ONLY public."bcAccountType_Ext"
    ADD CONSTRAINT "cxActTypeCode" FOREIGN KEY ("xActTypeCode") REFERENCES public."bcTransactionType_DE"("xActTypeCode") ON UPDATE RESTRICT ON DELETE RESTRICT;
 M   ALTER TABLE ONLY public."bcAccountType_Ext" DROP CONSTRAINT "cxActTypeCode";
       public          postgres    false    242    3266    244            �   r   x�m�K�@C��)r�J|�Q�ʖM�f "4���_���`e���	�ז��{��)���PIʦ���&1�p�*y�A���/-������IK����>:�&k����"� v;U      �   �   x��P=O�@��_���BaG $$� ѱR��9����n$�=Ga�b�������02��cb�������\&9{�xHD���L��BlO>%�����>�q�@����g��cL�kr*⯴P�$���+jQ�w���y���qe'�D}��bû+:��/ي�T�6��d��{��6<|����8t��˺�g*d�l�߮�맸��]5�o����l��      �      x�ԽYs��(���~8w&&�S؁��%Q�(y�1AK��k��%)w���L �U�hy�|稉D�["��ܗ���e��y�8�,�������q�y<�_���A���t6����4^���ݠ,��w�d���~K��v���QK��p��m�-�:~}xӺ����8�9������]�̋�b:{�f��	��)Y��6/9������^��o�"�k7����b�����G��p1�ǚK����v)� ��gR�vi6�ĭ���˶��eKٶ��t����aѝξOg��x:I<I��	k8+��@��j͔�m�~
m�����hS���T� x�".X)�LoH\B�ns�vAX�6���3�=�'�yq2�>}/�&����.�0�����K-�T�
�'.=	��_\n�H���-�+Q/�hx-��/_�F4�v6���u���������Uqݹ����~���Iw��8ym�b��d��2b�߽��������
%����ms�o�t��l�&����[�)\	�!�\��*^W��>�{��3S�/fW�����_��Z�D޶\�R�R-�nr�������ɲmu������Ǐo�Y+p���5@Y�mr6�3J	�r�%��C"�=5DYª�5K�ӏ�0�a�IY�݊�ͧO����h�y4!aP����$��F�X�6E�;k�OT�IX�<&wIXC7�1��B.���mm6���Bǳ���m"�"`��^���$e�Dk��-�'��\�\������Cki�L�ɸҝ̩6��s����������i6����;��m:	�us�a��c�n�B�ȢAJt 5�����E���>�mDK�e-���-�*�hX��u���q|_�1�:�?������g�j��jÍ�FB����U��1�ʶa5�6R\D�k먬��7],���GT�3��Գf�%��Hr��Fʌ����@o/��e��m'��(N1���6l2on�sD��>���������~�� ��q^\�������$B%�@�v[oa���X�Ai�v��ґa��kBʶ�s1v~��ί�ކ5}a�@��:���������b��<�Ƃ,(�X�AR%��Fqn���{@���n,|�����W"��h+ �� rL�))k��@�VѰ(#������x}��������h���zey(���E��^�����J��yR��{ӻ�*�/���u� 5?���?j�t5�C�$�)����AǔmP�* z��m-6	̩�$���\��G�{�~�*�L�\3��wPe#����Ww�3hqq7>���*5܈��қLaztF(�����я��h��f4&�8��@�J1��R�?@�`�m�g�2/m�F��ZT9�w�4��`��攌2 ��E�%!tv�e4+��������q8yXʃ��$R�i������}�O	aP�ƻ�ؒtce�D_@\I�2tDG@z�)-��[�i1�6�	([��M����gDَ�2і��NT��p��(�n��'U�LPV�+w!Ӓ+O���R�*'�����M.:�ϻ۫���|ͷ�x�������mZí���_�m+m˴�d����.���� 3t�&��zѸ6kpo��m�Q�k_.�x6�� ��s4��|�CEs��Hc\�u\�zr.]P�Rp��-ˀBo  
�<
����㨸zZ|/��@v����8�J��C�7Qɴ���~�G��JEy���=�<.��(Y���.���g�����'��8�_�����O�ؚ�����p5����mE�m	!����D4���G߁�h��5��hKްɥ�B�h�~/N�� (�E����_2��Pٿ�����:Z�+L�����@�,��}��P���J궫�3��� �v�eT �d}MgI嚉��Ŧ]Q(g^���}v���H�X+��V�M[g��9P��y1�??�6\��F���=�F�:@��;��B8�"�>f0������<12��t�P���
o�H���Ǔ��~<|\�S��*�(�6���z
�
�����-�<P.��ʵ��-O����kK��d�9v#G*��QZ�� �nk�]\%1K����_t�K5|m�&RPAv�uEQ��H��W�VQ���"j{-i]�"F�b��{̼���������%� MWjέ����K"�����7��G���;�ݭP&s$�U���`�۳]��#�<���{EG+�k5E���AX�]i�[�G
����^r�Nci3�C�Dh���q�6P qW��=m2h���urtS�\
��݊w���y�i:�6	�H`����;���^�<��<�Ln�Fr'?��ŴMxU��-+ ���O`m$ࠊ	4�1��P;���u*��m�[�0�ڞ�U ���dMS:��N9!��hKSJ'5%�80�eU<hJ16���zg�N. (B.  q���1c��mQfr������i6�;T���)dI���1�x6亲6�o��Q�w��h�2��@$��W")S�-�bz���?<��_�f�����q��˪�^�@� %�F.0��ގ�f���2yI�7���������Vٰ�D�y�{о���̭��t4԰�D�Xޠ����xK�B$��H��M���{�����Oâ�ڨ���'�A����p6��O���/���Q��i�,����!*���[yd�F�#"����1��RZ��T$o����0���ӗ�������E�}1�6^�`~?�?�	�H-�\�51v�y�0�%P�粍�`�f�R�u�$	�R
	�C͒���$�z5>���a_����P��fӏSDY�Q.�Ň.�wM�k�f��|q��yr�J8�*�F��6E���%���C$��G���\]�
���\���%(4H�W�`�Wa��`U��C��ߌUЀD��j�(��@j� ��C-��5�� ����:S`��
�t�&��듣�Ї?�>>l�r�+U��ab��w���ni���0�$r�4�G�%a���;o������8<5�m|Ԁ9�s�����Ο��s\yqy��n�a�Ŀ��r)�]��5�H�ϧ���I,4����u �B.�"���F�{�u��e��H0?QW�CV؀���l;��C
�m�P����E���	r]��;�V}zU��X����@�1��iE��>�pA���L'��ŷ���hQ�4[`�+-�l?�R�<�����a��Q	�r����ה�����q���c�&8��Z�B_�m�{ڿ��:9�
F�[�I��>ܾ�-�[�f-��QE-�t����iU3�dqe�PfSie[��U(L.A���$p�L�mq�������V��kԖ_{�x�X^?'�ƳlӿQ-�l�D�.�-S���#c4|��U��r��m�&�Ҿ�;�}+	�u����s.l����M�����ϰ��^�>~n5V`K	�tZ����_e|�3S0�J��S�?�"n����B	�ک�����e�T+�2�4y�)8Em�C�<��t�n1�k�۝οM�͇ٗ��j�t��+!�3}_��I���lvm͓P�=tS�l�}x?��g+�����ฅ/�M3���?�����l%�{r¸��D*���[HĴa��y���M([��>su�s%�~m�L�Ԛ�f����lW��rщ�]��,�J�6f	���D�2�������=Q��P�}m<����7���(] ����k��kI�bJ
�=	�]c����H\
�bA�.�e�椅/��ߌF���oX,�x���=r������"�r����	���7'����Wx쥟>��W��=����=~������m=I�c�+�fA7c�I��KK3j�K���}��[�F���iz�Yq��X%U$��f�A�q��c��J�/�lk�b��*�Y�P�(�rB�1�)� f���6l2�A/|
�Egp�):g7�����uL��xk:Lb��Y��&!�L���)�E�F��jELhe���Z8_>���bp۹�ݫ��ޞ������d&�N    �0�V.�Sxd��M@(�A�J��ؐ��$�7t�zO��e��Jo2����u}���߷qW��jP��k�U�����3á>�;�1�a�嶘��\�jT�y-���$���A��+(a|�Bj���7�C��ɥH��1ǋ�)�e~s積���OV��f��u�g���'z�'u�a��@��Q���ZJ ;1���J	8`)iX�aUەpF�RK߂�<�R`nf<���]�6�A����ƦcPg.�πC�Z��`9�ul�B]���v_�,k�?���fF�r#%uu����[W5tHo2m�K���[�0En1OHU���MG�$Z�� ��#V�����l��8�Ѵ��h��D����m0S�\���������z�d�a���a���4O���p۹ݫX(�}e�G:"-���S�"*�����KW���w�;��=�J'�%o$v.`��!~��lo��WJ�f*;k\��j�9F�Xa��dv��}hu�_Ɠ���ŷ�����Cqݹ�{�,&8��D��8s��*c���������X�FU��yx���ǧ�g�P�9�}Ŝl�_w)��E�.��V��%��[���]�]�2�8$߰SMh�U�5��}Y.�W������6���Ib�� U���Y��
�����l�Z8��-�Ѿ����ה>}w״�� &���@[u��x��ݍ���t��Rl4P��H�Q�h�dj��7����U��E	�OS�':|���޽�/Q��gG0θ���������0�	��J���T���k�n,����G�7�u�I�зq���w1X�A�^�`���_�ZW5Pڀ��<����È�ӟ���",$u�8�vo����^(ܩ�e��D��D(���	���v���jo7
!w�Y"7����R�^W��z 唔���=�J�z	��(�¼��M�js�?;<�G��B��?/��t���M��o��`%�z�� �o�\
"6ȸ}}�����
�!-��5�ҕ��M(n��%��k̼Jn�C^���2�{:i�G=e}��A�(��l�V�	�������2,����}�q%p'f��o2-�~�_@�7â?Z����Ln<M�2���d�P�-/���L9�dP���[LT������m�&mǾ��h�鷏�Q����_�����N������X��AmJK'�޻���(�V��c~�Z����@]g*���0	֍�[[OҮ+.@�X�N��s)�0l��ݨ��$��hՇ� E���LB����|��Ul�I)V��Q�j�K�(�`'���h
��b�#�ĪԖ�* ���RlSX�E)8S�]���ם����t�^)^3|���4���X��j��	�s���2ܒ�Q[��c�[\��U$���8��(4H��NO��y���_Fߪ^����ŁLYlڲN{4@U{�x�
�������<s�NN�
 ���8Xz���>����/��t�UC�a��[�Բ�̒�)0���r����;�a�S�7Pi��T��x�J�P��s��u0\L�}�QP�3�.�2��5h  ~�XpP�N6.^=��#&�L�p��������h��T�����߂-��Z�h��g%��[
��kiI,�JN2�0S���&�y4�L�9�O����hͧ	lq\芛-l92C��@6YZQ#/q�E\ɴ�X��k�\��=�Y�����zN��mi�ѱ[�BQ&s��<��jQJ!,n2s,�+U���`���A5~��ҭp��Tș��A����,O�M\�����T����h�AY:�!>��/�'e�a�jO��l���`��M���|J��}};�Rj�e��X����{&"�y�e��}[i���� ^-�����$ؘV��ۜ�C�L��,�d�<���#�7��s]�=��d\����l
O�KZܞz\&/3�����+a�k�gH��3��7�>Ci6Ċ��{}����߁³��
lq�wS�� ����j{!���N+��J\��ۢ�d�7�N������ϣ�pN_���	�O J��-�b�����v]��5�ċ��[��w[t���b%�.�,]��`و�\V�W����¦7�x�m�[*e�K��kLF��}�'M}���)�ð^DL{-w�~"��5�E����5��m�l��*v�}�Y@�K��i�0���U4��8ݭ������ŔK�^R-˵����J1�>�$UY�ק�̛;�:�_�`hi2�}���?5O�����M�U��A/���#����{HS���Tm�L���-D��Q%O�`��2�)�@$P����+`��\;A'�m̛�����-Rs����p3�4�G��p8��M���I��p��/�W�x���RN� o ѩZU��Zw�K2&|�NÍ�r��T�E��n�}�o;G��Vx��p1}Z,�q�YkD��;��VX���7חW�.A����b�K�� ��[���j�ǎ��K2 ih�rʈtՊ���=�Sp>�<�\|������tf�&����#/�fwaJ��3s:�9*�r����c��*��d��n��q1�w�Nr�Q�i2tŔ>_3���2R	�^���L�8B����te�o����H�_���>|���p�skO�d���A+��8��[q/G\�жR�LE���e(�nIQ�^o�PѰ���`���g��A���O��|�֣�^��3O�ܬ���J:	�:&�4����O:7G���2~��&���§�G����������ܦu�Ks����wH�/�	I�3\����������:ſ�F��&G������o}͜��?fr ��mW	:��JV�5�ۑ�B@����]��	ɀ��t�P��w��jcXL`T�+՞��䬘\%X:�q2f"@ꮵ�pLz�{OnP��N����OS��]�c[ڤy�hC���s5�hچ�i��+Z��U��m��.��M'w�iz0��Xw���\*n�~��,a�[�3И���+yK�'�δ����# ӣ�d2�O�C$�gil��g[�c���Pv_=�a���|ђ�D)-\D�;р��.��db�m�Pٻ=�<)ng��G*����ڧЎ�c�ʰ�U��3�����I��&�R/�DA���V�ߞ�%����-�� U~���t�D���*е�|������!;��5sطM-�$_�Vg���6F���}6��+S�� =f�2�ZZ�Gˁ��f�d Sa�Q�8e�2�V�Z���b�o�d��߿�0���R���3w��UP]Z�?�%�yS9U 		����mc��F�up����*N��p��m� %��پ�6?[U@����?O)')��
i�Eݖq- u.c�^�.��v⼕��]��%�p�K���-��b���!ˌ�A���dg�!�"��p��d�&9=������aq2�>U�z��ۣ��FE�� ^���<y�I�)t����/�6S�b�"���~*�^K�i:KQ�2��I.��*�3��ۿ�݆4�5��A�r��"���|��c懡�����q3s���ڃ$��ٵ�b�O���n����QŸ+�sru�\����A�Thٺ�H��{�`h���͘�?�n�S%���YΘkC�����>;��V���H��W����?S�	�D��	ް	�wXR�:f�(�H$�8���A�Ҵ���Pv�r����Y�}
�����t~��_�F�F���a�Z�x��k�W�,��`�@�*w���G�%�/cXA��@�X�5���d-0�8 �� �<���� �I���1��)N`�q��v��4Z��9�p@߾��aL�t�9py,��+Q$���SK��"���C�>\|)�Q�~N'�ޑ�Id*��ZEnU�R��, �R����aƮ_(�$+#����3OxӇ��tm����q��4h�D|�<r��0��kĚӸ<�QО	6���:��\<��/��'lo�no�\�Q
}�5��(X!R9
��k�a*���q���9����ر6Z��M&�    ���P������=Մ.{�&��4��vp�e��~�OUUE�ҷ�S�����d�[���p6�:�uAp���x����a`�QcD�	���R$6��zR@�)b��zO9�5�����l1o>�o9x,��`�ðGwG.v��z1<���fX�o�0�2�:�������r���K�?F�n:���[*��j�3�߈q+�i�%�j��m���>���~������x����RQ{P#��px�Jf�v��7PllP�/j�H1 #Чϗ ��$VhZٰ�dý�;�������@�jc����^�KVe�)~�kŻBF���D�y�ɲ4)�lc���� ��BJtl㷨��U\)�+�6Ƥx��GoZ�my-���
oF	����i�	bm�*�mYn�j��g�����ͧO���J7ᆣ��>%5j�lcr�*�U��Y{�H�;��ҧʒ;ŕ�!岩S
�t������pL'���>����0Vr0�٭���hK9���D�%R*��VD��XL)k�<D���&ρ�FA��ؾa�,G���8�!?��FQ꘮�k!?����	��8�4e��l0�b-Y
Ζ"'�mv������f9��;N��fY��K�'���k2�����CxXHԺek��)<Ύ�I9~x�D\�Ysr�6���#�����h�W��,[��6y��ó3���Ӫ�*������o��γ*&])@���O& m�H���;g�%@+B����&�l.�'b�8���{��!���p\I5P+�>�rz�+oM2�j�r�j�퐍�����Y��%K쌹v�v����,�ʄ���+%����9e���V�ą.g��p�}�
���f�P\?be=7��0�0J�4+	y1P,� m���iT�`�ڲZ��
.k@^
ν��7��6���m��������x���;�Cp������i�ͳ� QS�Iud�)�Mu���������^���Ya|e�m+|7,D~�-'�T$��u�!\Łۆ1?�U�1/�~�>��T	����8˿���i�C��&R�"���"����8F|?��'��]�Rp&a�Wy!��_\�C>_�Q2�,K�ϱ�i� �Z��Q�L��0|G��3�_�c}ʎ:��0����+�-D����$��\�f�ҡ�ƌd����I7m���q���
"�
7 ��].��xU��hV�>}��P�8��x��F�I�j��8a���M�Jk؞)�u]]�ڐb�o	��\T+Y���6up^���ő�������8���9����0e����*��t�1��ww󒙩RL�WA3��gg�BϦ�����8|��AQ���6y'�Ď�l+F����}۾�Ր<���@�bԨČ���,NI��ߚ]&_���{�M��Ɠ�p6�l�M�I��|��n��Z@�c��Щ��qD�Ύ��K5 A,W�n\ۈ����.�'�6�齾H�9��'T`�P�0�I��eT��|/���v��[��-%}��M�)r��kXc�L������k[�� ٪���pMǠpt�g�}��*��%�M(�^�Q5dE*W��QR_+��-�҂�;j&�\�v��z}����i;r��GI��ҭK��E3�X%����-���ϟ0������-!��m�9���nַ[9�9`�!�>д��ݴ4pG^�ث�D^�'�)-�T����6�r�p.b|B�U�>\�D�` ����ꍇIw�p�ʒ��'��y�gO��W1�\@:o3Y�(O�R�z*k�L�O��c2�LA;��������i��rD�]G��c������rP!�����o�A�D�U���/%?�:�:*��5�=X����n�q�`�p��#?Κk2+�$�� C1�%�,���(w�W2��}������@��o˵��W�S6#_�^J�����CT��kȌ��c��(��xο������Kt�]�OC�������'�ӏ@���nY�sF���#e���=$�=�%o6��`����qP{��q\���8)8۝}�s5���5�<N�ulUu�j��W�ki9����Lk���'�ĕ�n�LcI���뛪`|6~�F����Ӳ�y�qMI�F��j<(�T�|1^����9&�� =�-��#���H���<��������x6*N��/�?A�>b�@��d~�Ԧ4k���~V�������]|�+�@�P�eeXz�iQ�|�h>�~O��v��O���c�0y�Le�0]������҅���ijո��_�E��/�ʁR�|��_I��"6H���)�c�)���5P����Ia	s���/Υ��.�Rس�٥��V�=~P�ޔ[����C�\��Q|�}~�Ԕ�X
�Ԃ��☪V,�Ì�4g�p�"5��P�PV��F��b|]�-��J��m)�m�9�\҄O�"��*	��[�K�%����w��i�"z��d{��D���v<c�Nݞa��6��ɶ���Q)X�:*�� ��9��&��'xCk�|��I�RƤ��@�Vq-��4O=�M�&���3��cƙj,cδ�v<�f��g*�Y5�j�'�)g�\�ً��1��TgWўo�ړ��qE�(Ш�h����w���j��M?O��uy��c��?d��2������< ��H[��^\�������{�M��~�?�1]�0u��t�~��d��e������r�+�3eF�6�bmVoMrv��<���.|�ϔ����K�,Ý6���Q��ap�"ۻ�KmX8#H�ib�%:�����.��Y)8����
w�����0 i<L5�/}�<��'@��3v��I�F�� �������J�K���Τ��$�gc��<W&��=Oѡdҽgع4�a(�-���i�6=�S׽�f��ջ�1�Y�WNmrx�	�_F�����"�%���|��g	j�j����	V�L���s�P[xC���B���\�&�l����<͞�nLGh:K��v]*T���J�gg̼9[4��~=���sS��)8� ��	���A=���`MgI|��L�!�2%n�ĎngoyFCEDiM�,W��RF�m
��u;��`�|?>���� �0ǰ���UJi��;��O�P���>�R���{&�%@>;���R���L�^]�.��y�th���1���U���Y��y"ܧr�.����UC�#F�%D),uozGg���y\\^�Wo���m�Dm�`�q	� �=2^�_"0���ǝj�6��-P�cԆB������-���E���1�ON�t),�9r�FDʌ��~b��>ͪFb�;^w��W�*[�w��F�c_p�`Uо�]*��2�薲�J�>	�t �������Q�o��hr?*�FsD���|1�6_ᕍ���-#P3��~n@���R�)]���L���H��l!^��3���aI6��{�ēb�d���J�5��|q'=��]T'��)��k��<�(�0��6l2qH	#���p2����(�y�B�*+k�z�yW�ő��(}�����qyNG38�ɼ�4���e�O�p��zEH�a������{hv��W�a��*漟Ł�d�5xSlYU�%7�B��$z�M�>�v?�ЗCS?�]�I_��&���?�
�;ڤ�L0�%�Ƞ�Sl)�d
k�!���3]�%�V	��zs{�ӫ�n;Š�i\������!k���5�K���3���������;�e���3�]^z`�u4T����n�h��&72�M��t����Ӏ��n�a������dAn7�0��Dn���oKO�)e�R;2��憼8��76Ϋ�=A+֘���aI+����*�?�?Fv�!l�K��T�t��z���M$���@�ލ���i���{p���|�2R`Q!���a�1�,��4CL�x@�����,��J_yT҉ǠZC%6�d{#�
�B���lQ����m>^Ge�K����8O{��㎹ݴ�жh	%1�|x �KL&������p�Tl�D�����	Tƃ���ƒ���gcI�!���'�I0�+�q�.K����s�Mf��sS��    �n�V��򋶰�q+�\k���a�!LX.�J5m46���jv�A��1*�:�T�Qq�xJ�B��,�?A�i>]GS�+��W�O؀��0o��kZY__�W���":��X\XP�,]�KҖ�&�+1�^h�����I���jJI�["#�1�� ���tO�N��8z{vrz[t��g���y�qR3c�c���*)x��bV�F5���*��p��7�^�-��=|p����$8L>ތ�$���$%N8t+yQ1�/�4�w����&j0G��V��e�l����к��ͱJ1��C�ߥ��r~J��Ŗ��**��<t��h���]-#!1j���,Z %�&��*�q!�)���5`��}g�fќ:=���_Ǘ���?�-S�@�RY�DʫNR��p�\�'&���(q��lv��ǟÏ���+6�<:N�i@���p�h�Xn ��ԌT�>��3�����t՜��f�.����D�^����%���6I�R+F��H��zG��$�0��^
<#e/���3�[�{��Z@�|&�����Y����[n�����/�;��ūA�M�f ��+j��[Q#k-j�a�Z�p��V�4�ēi��p`�o8�)��6)��*G�T����ո��^.ذ%���Ս�$zJk��)��Ҷ\�{@���MS���*q^���~|�}ߣJ��Y\w���3Pu���̀����4No��p�f{���x㝟��6&��&{������(��Oӎ'���t��ƚ����C��~m�9�����V��`���%��d��N��',!���HrO�f�q\9��2�1w�0�fSFmJ��~�M�?�Sw3���V-r#��ga�u
����}��?�e����ILi�.�F�1������
h�w�7��J�@�2�Rp.�������]:T�x���[�/qp���|�0YV����`��;�j%�7�t����{�ß'�.���9��@x�YbN�Q{N��~�fk�5È����QS�
 �0��/y�&S�>�	���k���_����q|0X����>�\�r����fk,���jj�=�RcA)B/���O&�ܒ��Y��lƓ��{�������t>#��e�ƃ%�b���}od}�K��F��JT�}��J��U�2�Ɍ2\�|����G���ߦ��*���$�C'�Pl�R�R(&���ú�-e�5�/��v���KŅ�Tb�bYg^�O��`<��Ptǟ>-�����g�ő��Ӌ�(�����,-#Ř�ɓ�V��H�Ji`�1�.gFY/��xLM`+ ���;�cK�y�IW��c,
Z*gU1 W����ig�Y�2�(�_}ܙ/{to���qp�i8|ξn����8��Ƒ���pq$؞c�2�=��6?�T/ǘ����-0S��xi6�k墭m�$Sbד��Ȝ�ʵ8~�⑆D�9"�J۝�
G�Ǖ��qWVS���Lu��a��Zvp�a2C��jV�m1C�	���Ӑ�k`I��ZR����%έ��J��W�;����k����;��`�O���ʖ`�X�wө�l���� 5Y��ͪ��ے��ƌ��i<]����^������6���z99q��+�P��O6�1���8`���d��)aa%I��:�v��s	�GNϮ�n/z�e��Y��/Nn�..� M�a�2wZi�4��HdyJ�{�[�n?�)钕�H�W"E�PSJ�L��^���pް|��m<�o����������?���&�l�y�q�]s���cmJ�����,ٰ�E�O]���h���F~��������
��1�i�?ؐ����i���%%Nl�Պ���ak�Le��s�AOMFi�P�Y�57�a�І֦�(���{�T����C��m�jf�21\��3�����|�tح<˚�is]�7l��Dl��47l�߬fg�Ҷ8�Ŀ��ֵ`.~�+r�]S�,ܾ5jJ��ɺ[�no�I��P)��WW[��� �J~ƒҡ�����D��{'o/O����qq;z}�?%�Ħ��!U�ڸY�w�A���ٽ�b������7>|�o����6�� ���� =����JA�+IXЄx�昀�8�i� �=<<��X��5�O�µx�J	랏p�G}�Wr��oD��6.� �I���'�mۆ�-t`�no��߭L?Z��GIy���NVn�Ѓ�s��= ����Ah�z��2�����[.d�]MF�N���4]+�ӄ6��B�2ۻ�_ôΝ������\\������dZ&W�>�:�2���:���Kz��4'�ޗ"ڳ��4��A�ŕ(ilXɀ��	qlN��g�Wg}������_�՘��4�t�zC�+E�1{�|3ݘdvڒ�V�D&^���UDНN���;�L,��׬�0e�� �V���Z�
:P�˽#���s�IB#�4J � �\��*&�7����uh<1��^?>���7�IǓ�*Uq��;8+�oӱ�Z����v�B[\�s}��e"N�Բa�+��z:_�OW������S��+���ޔ ̂��fC�k�c��^§̬ �%��d��M.���t���g�rJ"�cۿ�I\Q��Z�7�2�3�P:��N�i�)8w�&>}��ş�u_ZS�O���E�((�ږroTVF�oލNW�7�h��7l2]�WwA�x��G��VϜ��:D���,e&�qf�VL�����*�4
�����+g����[�}�8z|z���'���
���ֺ�'v2oi�1xi��6�*@�T!h���VD�a���M
�E^�����ϩ��Gu�v����v�[�Z�f��Ӈ/�|a����Xμ��7AB~��I�_��2ɧ����{��̴Hr�rlrrڂ�A�m0SY���)��7cLF�9w8ѵ��i>N���Հ0�Y����K�~gxA-���P��-�M死�D�@{����cv�փn�� �DU=�t�b?ǐ����mjiɷwq�G0E��#��Gu�&7�uww6ݚ�z��A�����J!e�4b�N�V4�6��Է'�^�FVބ�&Co���|,f�#t�op���4�,v�R���Uȯ�8�rφy�/Xć:U�����M���;��dr�A���Q�`��F2Ue�Y:~b�%��St@A�@����Q��:�t��,�ڑ�j%{�'�	8s'A{,�3�������Y�}�6�:{N:���	fR�6JAI�q�ʹ5UInz�y?}�cXұ͚�iw�,-+�F'3��S��ެ��y��ͥ/��9}�Z�=�EՓ!g��)��8N�����+,�z��P%ͯ�q������P��ּ�x��YC�}�8X�~6ZHݔ%fuˆMv��mg"Ë�|5�{u[ӆ�j�'��ރ�{�U�e�e��a�Ll4�������bحB����"v%k��d`��ɀ����W�g��ASk~!e#����BI�9�B�0��s�z�N��lX��k`�-3֣;�rZ���wucDgg|\��_f��Ts��2�g���|������o,|���L���m��㚀�|�F�6��_�o��,*�巤�v\O��Ak���(n�b�-F?��Z��I=�T���r�L4X��~����"/�7�-��k0�u���3/�~lb�cH5`��x�If�-6]�[�SVa���;�;�R��j?��9��ZԶ����7�X��H?N�_'����q�4r?QYWA��K�&o������7���UT(��E`����M'��K<��oENY���7�9!cnO�յ��bl��ퟱ�>q��K��Mo2eŇ�z4��E����sV��Ӵ��ns�w�}�}{5{�\���ʨ"]0��3�Jj_&���<�#��NPF��g�mH��Ӕ|�+���|ў�acN#��s�F��l�M���
��ΰ�P,vn�ytwԡ������h�:�5�(=�Մ^N���%������(O��W��A_*_�Ŀ��~��M&�u�e}4z\��xV\�'�M�b�i�Ҥ�ծy�������3���A�q4�JW���&R���sqv�	k��3?�&�g��Ӵ��    �:N�����ڗ�Uc��s�N��A�)R�ݡT�zU��"�s68||�C��Ȯ��?����P�M���8)}��J'zq6����湠�8����pF͂��x�]܌�_k3m�Tt0�6V��@=x����g����f�a!v��+J��վ-`\ф4"�L�	��̔R,y�ah?�bd:;ο�B�MgIbK���R�l�L`�������TՏ��tueՂ2�bG��>-��_F��t��s���Nj��7OE_O%?���vo�QM��1Wַ_�$�B���`^��ȏ;�M�L�m8J���w��t�)�g���mLa5��Vr�`iAƛ�3�ʫsO�SPjFE�OC����I<i&�,t!]s��Ri�y]��n8�
����ռZ=11Q��Mo�J����N��]��䋆������X���e��N���v�=J0o��+��i
�$��gd�٨�G�<K.�|���$�vj�5'6�A���v�Ű3��}���ơ_��9��d��&/�Bܻ�����ku�nz���m�j��5MG�v�k�,�k�+�<ђ�m��3�jv�]F�k��`�Ԗ��������"��K��JN5^���UP���hz���Y&�l-W7:2�}� �ύ@u�Z�d����3o�1�ގ0���>�*��h��R�/�]�IM��R�7�Im���ޝi�L��4�J�E\���̮���3�/�4��-�0.,������v%�g�O�A�����Fo殹
�RE8C���ae5A7��4�NH}{}̫8:����g�Aq��3�v����(U˭.~�k#͞u�atw<��2lk�h H�K�Ƽ��&����Ծi���b:���֓�6�Y���f�Y���j]�Ԝ�����_�0&��{n�KȆM�>����U�l��4�%1�hxؖ�l� )����489w��2ĬBa� �\S�jfXz�I�gWG��ӇA�?��K�~~���B�2X"t�݈���QJvk?��m&p����7{9�
���Sѻ��ƣ���Ϣ��w
`/���b6&jhjm����?��r)\\�^q����6�M[ẏVۈ�A,Q{;|\ �'��T�<-�q�v�7e:��`��ۋzq���b$����ꩴ%�r�kp)�2�jH�	�������NUh��(X��]�9�}]+0f\�q�&t	�s�A��Jb���s5��d���-���zt�Ɯ���=��9�ܭ����n���]�Ӑwg����������xm���"���o�8�z���cB���{����ugg>-�o��?��~�y��m�oc0m������q��Y�{��*AbK_��Q���*-J���bG�^1?����Eq2�>���5�&�Q'�z���V��=��֙8^�G���)/Ey�e�ƅ0f4��Δ;�qvP�og�Q��ه)���9Mi۶i8�'f�o���T~P��r%t8l��y�&SW]Orӿ������gi ��ؼ��X�7�gn?�e�������T+"BJ�b�|
��}W�;����|��w�q��  V�:aU��{���M���3�Bƕ�٥�1��s���c	�1�u}�$����U�,A3ҥ{��ZgdR�~ v�d��_4�WYݺ�&ӯw��#��`�E �"�0�s�P�H���_6Sg�e��9�k����uqŏn�f+)8��~���<�΋�����"��(�s�d�oǴ�8���:�m?U bgEG��"@,�p��ELo2���wtn�z����w7���w�T±�8�$�-�W�|�:V�0�����.y�'u7m�j�ڮp*p&.��[G�������x�
����kW�;V�8b��WF,+�Հ����YͶcԱB�B��d.����P������N(�9��õ��q�-�' ʮ�8:�S�c�G�^��}}y�������p�S{��X�ZЗƷ�w/|{�;�������b6�u�˻_�<�=-�\Q�l�X�e8�;,��l?�����+!�sٯgΔ�w�>��u�lmY{�D����W���> ���S�kn������I��i�/q�>{�++��d��������b�Ag�gI^�=��(�8��o�o+���9j/H���ض=7��Nn2�ޛ^�u�Is�k���,(neAU}Ǟ�Ɩ�N�N�����obe���}deǝ��^gpۻ�E�߻9yG����7�O�q�􆕤Cg�Z8eⷥ���k��o�>���ʑ]�ǩ�I��w	̶2�ueL�+��4�cg�,vbl�Y��ފ+
�.g��wԏ�ex���v֞�CJ�7��Y8�=P��;G�-P�@V�j%ߺ+z�p�x׽�$����Y�$I�3�֚9T�\Y�o��d�q�G�^��j�q��[a�n�d"���Q_0�׺��:q �� ?�ŗ��[��9Ӂ����������}q���^ݼ/�������2��~5��I2��0�Y͚Z�r�n�/�d;0S��K�	��c��`�J���G����S{L�E%sj���1Ü��C�h���_]f"1��m۶vA������z���G���t�3i�釩�m�b<��</��<㺞Yn�dl�a�L���s9#��7��)��5vC;�%��Z���;A�*L��p�g1�hF�*)� �0د<���5(VmSfb�����O�=��i$Y�k��^�g-*v/'$����+���-�i��[ޢw��۰ɋ��B����q����=�qxiU��p�l_�� �f�3�Bn��:�ro7^��sw}62����4��
��a���q��3��A���r�0�O�����$sM���>\�ҵΪ���2�z`�hq�����Z^(�3og���5�����q���>�¼}���W��N���W��<��>a<m1�M[e�}��s#���&r2��S��[�?ބRr�c�/"�r�e��{V�.����>���6��/Ӝ�3%v>}�8y.����߇��)87��;�d;L_�4�kݩ�|��wηc�u7�&UL�+��������R��`3�%@L�a�p([Jo2���)�1���p:n?I2,@�ĥ6V����Jv�A9�b��ݵA�9�2`�̳�z���M3����\ߥ�!�5(�[-��f���C��nۓ�9a?E���B�	�cb�6�I$gC]�k�'�m�Ҍ��Fԡ�cV���05Δ���t�j�oJ�ӢZ�9�2aRp�����b4*.�O�w�L��i;��T�J��I��T��6��ڍK�%�>u%)� �QI��̿�&�0/:}oQ'�Ӣ3��[�8�q��N��)(b|�:��r9�gs��"L�!9����B��m�N��\��~@[�+�ڋ�x��G���.v���~��"�ru`�E��?��n���;�?�+�7����ߐG˨"�9�p��GW�6����m�{o����ҨX��	����h*��>�%�JJ���e��]M��ɪ��ɗ �4Ϊ�7���D�]�{:�/�����2�6���o��]�i҈7۞g���e����K�>�'!`X9�tS��jVBr��Eһ���޷�e��$p5��v�aR��1֫B�k����a~'���|D�Ǝi��"���F �@'l��e(���'�^�?����������AwI�5�S�~�9z�(�Ck��Y����.��ֆ��gpE��r=�Y,#h��������+�ă�p"�d�Fy�������"���-���֠8&Y`9v��>�Ԧ��8ԏ��۬�<�@�7@�uo��N�و�<NR�P��69o�x(��8f��O�r��4���bfCH���T��қL������ ѱ�-;�]_�`5Р!���=J�:�,�xx��$�C&7�tI����z�]��]���y�
t�)ߖ����Ť�"���5Hl��0qk9��3��8őD��,�ņ���s�W0��X/�aH��|�;,��l�o�Y:;�(�٦`RV���a��9a9'T�l-#IW�F�c6�����]_������8~�<��VR��
��V�TR�<��&or�6ߞ]�7�c��jSbt�Re��m+«�    wx��$��a�S%Z�[�%�S�1$i@T�2z�*�$�<��*l�~�M����	��?g�/�-�-iv �?�����!��6YMX�<}},ֹ���|�I���[�޸�U�2�AO��$,��-j-��3��.�~���\fstl�I���d�v�~�Btt%�]�ڻJ�޹�3&�-�Me����&h
�7lrqxW^�#�<��c��#^~��,�!��ޒ��fH�T��K1$0s���ǪRK��<�zI����D4���ړ�A�hpr�o������7�������v�i���!FO���SD(歟�������K�FH��*�J����RZ���P`�~��-`��ҵp6��^�['G����U?X�Ké���ŧ�����.Obq�G+2��T���렔�]���2?l�-UxeTae���Q3�[�Z��߲-��XV��D���D�2e䛈>��GoΣ�2������Q�0��$QY���)���U!���ݍ�՛by":���m-���oo�1
��'��r� oc4��H�;�ӑAFeɖ��`��%��M�Pp�v7u�"=N�YR31�Rր�xP�Qo1��x�x�ė���Vc_�(������rqC�s���z;�8[��'7���77'QQ�j
�|�Vτ�L�D|�C�����~�l�"|ڳ�ď�P�����f�[=�s8{����4�ߏG?=�`�q�� �%7`1�piT΍�3F����qrLA5�J�j��R����@�;?n��m1����ޠ�^�\Wܬ�(MtZ\�ؐ
�p���{�{�(���X�	sX�710�e��'J���5z\o����GI41��X��𝁋ɵ�7��i�î��S�9��q�����p�}"Ӱ��;�"�%�m?�C�kf�&�LgĞ��,�'W9��\-��e4��������b:[�:J<J"�3��z��y�����Ϗܝ��KCʘ]�q�j�բ��%7���w׽%�+��V.f�Q"��X��.�
+�B���������-�����jRW��yZ�1b
>�Cq9�Zmb�x���(��6HL8,�Bј��iI�ݥ�^���DD��w)�;~���x�m:y�8����k8J�.1"���2��^�F�#pw�(jd�I��7�AՍmӛ<�����x8_�&!��
W�	2d�K�!�����/����B"/)%D��O��+Ņ@l,'TnÙ�xx��w�4�`]R�����Gۗ�i�]�bHS����8H:��\��2ޅO�� '@^ŕ��B託���B�pa�*��w)��x6a/�������p�h�O�Sڰ#�Lu��x�py��ٻ�JU���Q�xW�ђ�u�}i@��+Z�uB���9>�=��Zoɺ�$ug%GƧ�:��V�b��p��@(M��Nn �M��`�A�&O=9&��x<�/V	�X��'	,
�0iYs���%;��+[�T���e��l��2)z����[�\�۳5�����w>?S���9vU�b��Jp���zf��a��n�)́gH�����A��c.��Wpk����l�P	����^���Ë�n���Y��`p{�=����0D��q�9�!�w�� ��?7�)�RSJS:1c���N����KB1_��1M�!Klg�Z�����G�I,���\��<8/`���|��X%c��-�G��]�Z=���7X9$l�j�e_�w�m�<A} 踇��\^S�tX$j�COHh�
�tZ�J��N1�Bj�s��6e�է���t��]_��O"Ya̤V�@ 0F!�s1H
~!�a�D�M(��+r��(���3�p=V1}U��
�=�Xɗ��/�*�\�`w�-;��U��φ�+�p�b�Zδ�Nz^��MOF[��j'd�k�|C�s8������Y�K�`�d\��0[C�d
��x}?���È����b��~+)j�q
e��_&_���J�w!i���]Y�]�De9mX�I�i��Lj;�+7��f?�m[�$u#�ZS��&�9r������#� V�j����Uo��&'��'�_��/��Cq���]��Β�(c+�A���k^�,�iY�}6v w�Z�1���|{`�^�S��h1?����ߴWU���&m�YaM���5���mknlw��X?]�sL[�X���ׁ�F��
�{[`D�z��p��y�9%[�=�E�[ {TA����ŏ��b}�g��lN�d[�@ѓ��/Es*'-�Y�6˕V~���{��]{s���l|?�>ޭܐ��FeP�Nxe-��_�g�v1k�rp;�"���i \�0,�i)��1��KL��M�ri+0q�2DD	&��a��]�!r|�}L�Eqi4�"�����IZ�傛T�[�J��4�m��u�h�C\4lj��YJ��x-���\\
��f����o���,�FA��l+ˆJ��}�xj�P틹pt�Ǖ��8|��`6o[����O���*�6����l��)��^+H��H��]ɞiM�-�%�vJ�#4�%�;W�ʛ6 R�'����ڰ�p�S�8X��k��-�����-2hH&8�=����X_ �b��:70���M��t�4�%ӹj�������X����3�rŎo�%r�nXHM�
��3]s>&�8-09+��[�6�$�+%���e��YI�;Y����&��F�{-�����M�ݼ�4X҉uϓqV�b�'#�`I;a_<y0�0�ؚ�	�g\Ir�Z�o2��a������������ g���x�iv��>�-)�3/M�eg�]� j���W��y!���x2���T����,K /J-�Xw�"۫@n���˻A@�� ���g�SWN޹����2�]�������XO�Y��߄�1�?^����Ox'	�L��+s#֚ɭ4����h�sv�(��A�⪕�B�+��'�L����ŧ��iL�)����{p��&��=��Z�ݲ��+8~��S�X���C:,�� �b�)8S�\]PbT����i^�~͆�GO��}5���,�����֎�b1��c�2'#AY.��SX)`����\L��t3�;:��0��b!p`�3�]_�_���H�ƈ�R�y�+iy��1�5g�nN�1�a��8�>> g݈�6�&���(ed-KPa`����T�U0�U9\%�[���":�Q6"*g�A�+0l6����S�R*2��a�Y���/�s���>^��W,:B+�� �:�Aӛ̐���}�vz��Ϳk'3��}�V簖؄��=��{��!� �4���J\��K����3�Ɠ�b�R�8�ɤ\�9�$(��*���/aJl��s)�����RPT�B"]
��қ
I?Fu�U�Y]$;BY�\n��3�9�q
�
QJ�fWr�5��i�;�����*/������Y�����ue��s���O�͇;?�}]�g9�U�"Z�p��7������yCT����I����Kl��U�w�~����{WtO���UD%�F��Ǉ�h;Z��2�!J����P�5v���JZ:G��k�|L�NNz7��F���������C=�zw7����1��R���_	#�MB���e������LHɇv.����b%���&R��_F�:�zcFTss��|�.�`+�wx��ζ�]�iţ���y�A�ˣLm�_��em�ë�jDU�>g�H@4�u��η�W��n���N��I���%^N=��#_6_���t܉u��8������6��N��c_�D⟅3�(����!�HW�u�C��:�|�L�V���B�}wh�و�qfRl|�����/?�ج,�������&B�v�Zp��n�j��W��r���qq��n�����#���ڭE�o�*T�;�G=�j����J�4^<��g��:�E�(�����z�u��gCw��a�f_��t)7�/_:Gs �[6�p����3�u�*������)Rf3K#���.=�Y��WW��x5�)�������������8�0vRvŹ]a�����,PV�h�,�ő�T\H�t1л	�#�2j����5���޻]    ��.���wb�>Y�5���P�*�qŷ�������іV�9U�Ұq\1����[���E#�8?ɶ��n['�g �W1�⦷ʥVԇ�Y���{z}s��R�jC߿�`��`����q��6�|]D�w;H�j�yu_��Z��z��!�j����C�(�Ƿ%/_��mB���]��Ӽ��0���+�h��R:��S�VM?_�-�ˊG�����,Z+k�g���Zurquع(z���n����u%�+��s./}n�>���/�����gl��c���5Q��O:*���)��M�����\5�k��-���FL���-��ԥp������n��@�ue�l)�5��<�����j[��"�X|�)�.�M0Ow��=�ŧU������#_(�^��J�`@Q��G�۫�����j�ט�w�H�Ϥ0�:V���Yr�u���i���Rʰ$r�])$�!�ܭH�0 ��#>��׋��K�Is;��l+^�Gz�RQ/K�s�A�4p�㊸1J�J�k�m�>3I,�wMx�w�/��`ݨ��O�U˓�6&��م�X+,���߁H�J0U�d7��x�mp�.�k�a%,vs_��<�f�	�yO�Κ��/r|�Z�X��Lbm�KѢ�٘������8��`+���L�V�Jd�����4�$�k�Wp|1�{!N�w楄��Xn��9��m1�����#"3�����坙Y�̪Զ��Ȍ�'�0�`Z-y�H��}1���	bB��Gb�-e��HB��P�;��GĐ��3#���a�l�	&ر�� >:�3�@	�D�E��3��Z�!����3C�b��9|�*HWk,S�Ss��p�q"��}b1�.g��d yϰ�s�,�qUĶƮٖ��m��\N���籭���w%#�)�/����ye����l8�Z�$��e��j�G�)�9(I+b������f��֪�ݣ� �j�,g�S��`�w��P0��݉y���>�W��V��4^|��9�1zH�Խ$}۲�a��=ì"/�X�̏�.fi�=,_1��eeefe"k���Π��Lc�F�Ͱ�Ca)êz<���	�5���hc�G����a@<��{�g�3ߎ�!��:� �;e�^�gCr�2}��ِ�W���>v
A��n�k�V��i	Ei�A��;��Z#�:G��m�P:V�	0yQ-������旣�Ǘ�L5�E�x%EGOg��7�2GG'��?:U����{l{��>�(��K^T�e������5��3��.7k��de�I�q�����u�y����?��"0��p�ŁD�w��UK�jmnύ&k��p!�=5vMd���,s�jqkOk_����v��a�� m����S
���wf��vs׼�c���YA����	���pj���h��q ���}*�7i�j�e�o�[�QOwF�m�M��̿�/.&���[���%���f����e�m1�2��c�Ռ�)��x�¶�"��C��|�%��Dj�iH���&߿��[�����M�4TX-���~N��~K:�*��� ��U�b����ua�l�g���{� ����ɗ����m��H�x��A'���	z�PΞX2^�����DR1j���J���a$���35OK��
���ļ�z����$�'n��I0����@�0ΙWl�'F��ݕ���@��JooZ����P]M���p�> ���&����l�\w�pA����N�NDWU؀�K�a�D�[V�@�%E���"�n2���6��%i	��5B��g�)��T���u�;��O}Sٴ!���%��Ѕ�4l�q���1�(���w�F���x>OĒ�="���o9tDO�����P��C�r���SSK���p�ƽ�?ݧ�R-�|��^?�)^M矁�z���[sm۔,�ۀe������(�;?�����/o���a��xD�M�1A���痮����>X-�%z�.: ,%z�k܁b�L>�oPؚp[��&�p�;4�� [�B؞����i�&G00z�K$FP,���KQ�I��{ݽ������S�9�h��j�*y��#��k`W5Ŭ\l�Fe�����'�ڍ�q�4���͈��#)A�h`Y��>�����X��y��U�z�4�~ɛY�����7S���	t�����wжJfXNzj���
]|'o�ֻ�4A��	/�yE��nK�Ω�Ů�s;-h��.��;9`;{Z1n��{<	�.I�6 5��G
J1�7�J�+
ۻ�N�3_t&_��:\�\�b.�Zɘ7�e����%{EI����Nj�Ɖ�K������<͎�����̢�{7�h��������n��=��wn��������NMA'6p�����s�bV p�F=��!��fXM�p��9+hq�o)J#��7O1έb!BJ0��?�N����-O׮JY��t�X�8{m��GP�S��*E��85�$C'uC��y�O�������3Y�Z��<���Fvk{F{k8����FJxvnD�p���0�g�*��Լ���m_���/U�P��ĭ�MI;�@�n9'd�`�E�n��u�£{>ąx�b�F%k��� �9[
�z�Ax�/Ю�'Ѯ�)�Sɷ�M��y����!C��5���2E���ΟO�?�>�ʄI�]o&��Rxf�-��}��%�钝A�B�bf7eh�ɨ�'��ƑN���A��c@�v�<�;����I,k�p�%1�{yЁ�}H�X��E��� Y�����H��E�����O���V$@�Je+�R2�ܵ*ai�C����p~~^o���u��y�;�RsO��D4����*��;�֝�BI_P�����G�e�ZUZf�-撱�Zbr�~��5h��V���z6��?(J.*��{���#�\�<#�/�~h[}��Ug�aF��^�
�6M�O]��urv5�k(�bN����+��oΫ	�qx�VI�.�������p��Fl	؈��7ۈ�)��n=���8�^�=���>���w����jYx��|�p��=�aɾ��^����Ϊ��h">�\��F�c�������q���9
�11�I���4�-A!Gg1}��f=��Z<�MT�������������c`�-&��d�+�k_Rh�#�Dd�׳�+�SrIЋ\l�GڸR�Wb'/���G�F�C�0N�.i���:�Ļ*���A��3��1^v <_e���jl4�?�
�#��޴"e�]G:L����Y�h�Z��X=X��H(t��sG���#DOkU��I�+��ΰք?�Z�@��`=J-_M&��+�".R�fg����7٨,�����I:,�ُF�?Y~-�� I�����=K�&���"��OY�|�7�22)��䣄?�����Àwdh���&���������Mt��$�u�� /?��7�C���ͽ�I)O���I�~?�镵x���Gƍ��Լ2���;|�o	�j}0zxZn��nXM&K2ɮ����?TWA���&� g�B�pŨ�GŮ
U>�q#ex��L_TL�4o�$����h:E��x��!=xH���f�4~������+�^b�Lj^�c�1�ͥ�p����6������t�/嗳�.�������y%��v~�ϊ1�gG��G/�ފ�i³�hp5���\�w�:g�w[`��)��ʀ�q���ҵG��g�?��ݘ�`�;��Z������K��O/y��V��P�Fa{!ƣ�\�!�:���9���R��BE*���7o�w���]�3|Ss�e�Ј�h��L��hdL��R�^�
#&�~��@6�����S���)4�Z��R�WlÙ' ��[
����v=!N�J��8}Q���)4p�`��y�.��T�^�r�M�LY ��1w�eؕ��X�)�١܍̠V�-��|�4#]�U؟V�6�>x�-?/B�m��S�R$c6S@2÷����]���RP�@Oh��� 3&�'�O+���9�*��g+؈�O�kr�Վ�)�WST���̔뢘��b��W�_�#D�8��4��q
�o��c).��R�j��ō��8mD��N�    $fB*2$7�d�b&{�^�>����)�����5D���
�ٰyN�k�ׯ��˛�� �5j�H�+��<�$�M��=|q�e�p�G�!q�I/gX�*
�I#�]NCڒ��4���5>.���;m�f�x�&�����9��F�L1qr1e��8d�a2H̌i�|$L�U8�H����2��S��� ���f�	7��1A��Wέ�x�Y⾌ v=�6�P2oӖ��(y���k����x��t:_8���)[,K���6�V$s?ϧ�~ݣ��ʖ�T�[�*���¨1T�ϖaa��Mx9�$+\3�,�QM�P���h���|+T�!��늲�����w�h��<�J�L
l�	Bx�(�T��~F��C��T-������ C�钋����fG���}���`��J�d��z�f�`�b�V.� iA�dJ:K�Pㄘ���P�j���7w�^�z�c�����i����@Ep[)P���k��Lf�b"��K�!q��)c���>�/������VY*n[x�pF3r`;l�j������9���|��&x��{���o�y=�"�}�/��Lǔh����դ����������'tU�PӅ�1M���0B�� �/*����\�<.F��f��6 ٲU�S�X*u2�կr3��_;��U���K�� D�y	�v|$v�+�V��^��L'��������q���[p;)k��|±6�v�r�i�c!�5�I�_"S ��dWzZ��m�(���0�Vo��X0qk�`��,c@/�����W��oC�����D�8��������{�))M�M�JZb��+iVBZ#N/
�?�v~43�gH���^��v�?�����d>��1�b-�&j�W��IjY��:��c�G8�_!{��#\��a�b�oL�@p�
O�5�n�L����d�4�?�Ĭ�I�y�Z���X�a��Hj��ֲ���ѹ�\��X���Ǝ���j	�׽��U���W�zo��u�h!�}_L�㲥���e3ь���"�܉�I%`��%`��Ŋf�8k!��+�V%�;"a/l�^�̤���v�8�=�'�I��-D�Y&:Х3�dᄡ�a$���!u25�H����o���e��/���NpB��v�>��(͝<1rZ�R�p����Q���ő��Xh��W�}��/�����pbm��S7��f&�
ɲ�/�2R��R��z��I�p�^\gT9*�Ƥ�|$�I�,���yU��*������~ʑ��K�������t8��J��Tgp�^�$:��f&��̡����4�iz:��%�Ɠ��.-^J��f�+��^�F8�M�_�i�K'���Ɯ��!�`xޟ-yQ�^sg�x�|�-��Ҍd50�eۺ(D��>-Sܡ�R<A��}�`�n=�.�P��"���y_����1O^N��De�5�c�X�I�O�)J���xU�7����zBǔΒ%]�<��|���pX-��ƻ�S�j����\�m���1�?�Z%ΝCy����pF��H�R�š������Z�yy5y\�דt&m��: ���g�� )bf�Jw,| �Zlf��'���L:�,DR�K�����$�E5?�U�+����B����S�_q�Ȅd�ƨ��AE�m�$P�{��STn#C�@#�`{�c
!��Q�Mz�
%���rx йB`�:>0���V�g�f��� Ư�!D�ۑH@� J����p�2���L�t�|l{'��t�Q�*C���|9���Gm��8���?Rԛ�Q�]?��0y�����0�����f��6��K��]�A�@ջ�0VS�R�g[��<$9�����]߼ c���$�*^k9bZ���
b�뒋j��7�V �x�0�X�x�Ub-�����M�-�SmGTZ0��;9�$�}(��(i��c�}����1?,V�'/���Γ�r
����hւc��5?9�����D��\n��oNظ&o�۫dh|�Y����v)�*�%5�-�����l��M�5�]��[�n��.���{p�U&��GRqr��	�/��]앿l�����(`�	�a �G��	JZ�'�n6NLZL_$�4���("�%+�������E�>��oZ[�O��}ʹ��G}��Bg?]�M�׸����]��1(��W+��^�4�*�>Pi7�4,<p��]��	� ���1~���G�"�Ϋ��7o�撤�v:�񷷋їM��ҵ�HV��s��}/6Ӡ��
oT"D��Y3O0VR?�8�U�fy3��E������	r3�}1�o�HI���M��M�f�5��0B�\��NI�#�i�x$5�,?���͟OK�D�h�5OH	
w�w� n5�g����E�8W;��¦2I6�����]x�hr×`��!�tZ�S�S�u�s����M/�ã��t�R��B�p�;�
�t�p��%F2��Q��]j�J�1T;�y^�ys�������t��[+��7����棉�����	�XLq�3~���y�mվ#��f:}�6��B���e����ޑvLR������,?P��/Mp���	��@Dd9�B�j�i~����e5�TR�����H9]%\��ٯX�#���l�,��3��-b�%/��ԁ���}�/���SnQK�����������d�]��˼@����}��͟M�/Y]c����6��l�Ϸ�bBSw��x(��[ ����y�=�yۮ��iA!�-_�\l�u�a~PvH�U�Sq!រ>
l,��Uq���U*I�����GU���,$���7�M�[Ï=N��-n����{�\�&����v�1j�bDW���t�Gz��/�to\��.�{4=���7$ê'�T�b/ӽ��˴�*+�OB�Bh�jؾ�Y4��@v%B��i�C[��l���鿯�G��[.'����[ެtb�?���T���j��lÉ�ܽ�ߝiun�Ok��E��:���^�+��-��/��H�nRK3�_l�O��q-�i~�J�Ş�.|z�An�O�%b�t��蘙�讻wҎ|Fh�l�(2S^�?I�OC���ID� �&���!$���i�>�젍y�N�����]�r�b3�'�NQd�~8�i��`���L>N�r\Ʀ~�yEJu;T�x3�M����F�R����-X���&v<�?��A�!7���\��d�� �F�����ӊ�R�����h�0�Fx��<���/_. ��e����3��Oh�c���E|��V2���>��`�S�����N�<���@��m�r�r�X�	�uTR80�a�����U�p^$��s�2��G�`L5L���K�w��W�|���w�A<_ZNR�-��C$�+��?\���{��G���+�V<�zW�%{Wp��Wp�=`ZA΋���87�f�SBd֪W�	�ۮ��H'������
(�%/*���=Q���Mx�x%}�i�Ml���}�Tvr0�JviF��L*l��O�n�@�NJ�+�s}�=����tZ�c7�������ަ�����e�і6�	�~�^1���4�:�0R� �<�Լb��Qƾof�uQ��׹��A�Lؑ���+s��:�L�,���Կ�	C{�s�Cġ��@2��,���RC;���������iER�&@��:��tM6@��+.@�Ɇ�@��+g�%� ��&MMP�5�I�I�}�@�ɼ%�l0�W�j7��ϫ���l�ek���u��n`)>�wiDv3���=6܄�����6c2E�.��K>��N�9c��p���տ�&K��A�q�
P�ɰ�6��"��i��R�	[��a>��D>&�����P5���D��eX&;PKh��L�ڒ��`�2Ť!݊��ed��@1!�{���|D"8���p�<�@�	�q@���/��A��~�g@��B������ٔ�Ǒ}�W�i�6��Q(|;��o(m�s���#��t�\MVϫ�w�)����[��B�'	oLW�ӄ�H�`��\��Wk��{�UYc�FN,�-��<�    �"� ܉~��;?X!KPJJP�F>�Pe:��H_T�FI��?����M�VSk��70�, )Y�j�?Q=$�).2Nɏ���e��SƖ�ɋ�J��C8Of�ɲ>�ϧy!V�nA�9�]�3���'s% q��D�*�&h�!k���C-��J_Td����t�ƠQ�1=w��/��ΐZ���ýR:CvD����K�Hg�Ƅ��������6�/�����ΰ>�w�nX���q�XN�n�|�F�Z[#X"�I���`5����;0�'�eH�tޔ>yQ��~�*�_.�o�tߺ(EC1�����1ZI��L��\dK�\�N�a$��.	�敹�Ey|���}�@����h�0�M�s`9�| Ňu�}�^q��fL���/�^L/%ӎk���w(�,F.R�j������h�s,$=��t��n�Ík����{]�O�9dUI��=�-��*���n�`Z��n�)!�膾H�|��?`Y�گ^���O�G��pӖ3'��iUPk��q�A�?�V뒋j��_:�9�O�%��Y�Nr;Z��w���A���g��-���~��.}�!3�R]o�u���7}QM������я�����/�˄����*� �s[> '�Vx�k�J"�q`ʋ�JL��q>��e��_���?k�+�j}���+��G�	3>�{H͓)Aܲ�5kZ�v�[������Sp� WQ�ew��!��2�H�c�+5|�M)���>�Ά0��h�Yá����ޅ�j0��ӡGz�/ϳ	��:����׍��h!uX�� �KCr���nl����
z2�Q�3�d�	�B�sZ�|�Q�&��F�z�i;�t��>��5C3x��u�b�:9*\�gr�Q_x[��8�Y�~���ɋ������=2�w��sЈ�I�n�z�v�H�;�ߘrX|b�V	�;����`!
�0zQ�)ںp^MB�"�n����K^�w�ܦ�b#z�;_B�����{e��
�5d�X�ЇFr�j�w�H�+��Ӱv�<��8�s�Bo��E�uz�.�y���fK�p8$�q��Қ�V��ee�HY���e�4��O�`��(q���R���C����]c�{ޟ�{�{�!ܚ�="����}�FZZ�?dQZ�Xh�����f�\>9�9!�����3'uȅ ��bpQvu��2��>���.�~a,"�p��@jݡޘ�N�c#S�����̧SF��'�(`����z �O�+�~�
�n����y���Uð@�f�]�}@D�_M:$6/����O�Iv�5Q�b�T�`C谡ە���`���ok;:�tݪݎ�=<�V˯��{��Ƌ}Yaڂ�
�uE��uD5=�6�l����|�75�!J����!�9��	�{�\$=�<2�u��K�h��N~DaJ�)�,0.�Ա�e�Ǌ}1��W�	���(�K.���S�T�C���/����4�فg;���xT�����X�&��h���d$T�-zWm�����u�j���e�k�ϋɗ���Gsm�`��)�hv��M���iP�ON",��?h��Q�7��G2�@��q�Լ�����i���s[m�:I/��AW�ݜ�[Ƚ"�ne��0�sQ1���HV��G����6�� �k9��
�n�����d���\]��� �����q��K�����[��]8�Z���m�b������?FuB2k���;�Ǩt� ��'F��k������N60G��\�҅$vl)�F短��6Z�I8��:F��g����
ڔ
l�?M�s|�f��2�z��t��~�W l���
�?����Й�_�����k@���iJ���o@E���Eo��W���d���h�~R�gF�N�w�8< ���j8b��= ��2��p����G
��;z���R���Z(m�ӞXP.Y�m4���&z����Ζ�=�Q���`/��I��S��yEu���h��e��Q|~Y5�-��\�J�B��ӭ�'�V�2����6h�����n�З�{�?@S����{'���D�}�7�>���F�W��+x�<�����"�bv{w��v{��L&��K�$��u��q��Ig2�RǺΐv�n�;��(�L��8}��G8�#��^ AF�����0��
����21O����@8���|�<^�WhNG�������T���v��'zo�6`2�W����d�	VC��8�h �9�F��)x����X���@�l�?�~�S�
����P`����s��;;�����+������pMG38|J63����ְ*Z��"�C���yҵ(��KEK��Ƴ���T�c0�rY�XM3���v����؍ڽ:wfg�P�/�^�7�����M�uw��<!u�o���W7HƄ1)Q�߲v��3x�j;� V��ܱY�@��Ǜ)RO�N���/G/�������Z��%��f<�ާ��?L���O�9��޴ZI��6G���?w�;ɛ	^����7�S��	~b�h5c��d$%^�|$�?fY����W<;D���g�?&�<�H�mw�;��ܾ��<�l�)D�<u���#9�5JM�U����Mc���n4L���Ys>m�%�wS|��z�89d�?��5��,�W�����$�1�zD�X���M�+�`����b��<��X~�L�W�ԝ�B�祮��s����9��ю��B�7}��
���I��F�s<갨+�<���	�����j�"������G#�ۣ<�����,��Z����5A~�H:���ivr5�_PʐW����{���k�H��J���e���I�ZLD�9�� ��<��^ï�-�5u��7�|�#9����L�+���m�6��^|�wz�P-I�*HcĤ�������T:�M%Q3��f��˲���Ի�i�?�}2/^��0�t0p�	���1�`�q]r�Ң��}�Pk*��i�=u�0e1Ôj��4'P��J�OF�����[r���\t�ʜ��^mx�	݅Ktj�W�����i�	\�R؅�2��!�E�"�os&�^���&a�:.��(+��Sn83N���|2��{7��r�sP���]?��0,3�M�����m���mF����ě�dX���R��t�5��'݇����b�2�&bª,&���Εƾ=��Li��D�t��e��O�zx*H�`�sMnse�L��#������-}��zpDe!(n6��۠'��3��������u����\�mZc'%�Ne+��������a �h��xw����*� �il}��_}��c�����/���i����1ϰ���̻���`�룥&1DA�����Wh<�~.꟤�6�y�wf���!c���<Apx ��ڜXӻ�&msf�kE�8���<�G� QBp��EΈ�4:K����<��I=�����v���C������Ĕ6 �i��H6��H���_�o�םn�~~ۼ�vZ}�w/׭��$�R������y}p�qؽ�Y�{�;�ܜ��Q�mxM��$�d=f�M7*(ܩyRꨩdlM��b�~(b�K�;בm�(��B����+J#��������*"ޖ\$���M{Ѫ��@:�)�;W)'��R�ڇ� �1" �2�h��f
4l�T��Ҿwr��2bAz1�(�@��J���`�0^8O�4���܊|��v1�}��?g��g���H��QCm�]D'Y5\e�k�vv���Fu�e|M�w���R��_�	Z��D\��/��xWm>�M*YfK.�ǅ�˘J��;��P]��L��d7�-���$k[g���ʷ��ʞ�`��LU�[H߻�9�����x���/�{�~g��՜4?�� )A�����Dǯ�@�YĄ��a� -�*��!ВIUs8w`�Ƥ!�~#��/_+��U�g�&�
���bo��_
��B�8 �����ߟ�BM�K=��Cx���0 ���a/D���p!�����װ!"�1m_-�g�T�-A�`��8��qݰ�p^-7�}��<�m�n�����ɺH�~~h9    EM婩6+<#=�#��K���TjJi��A(��\���g������}٥l��x�8_n���~��������1�F��ԯҊٓCCE�W�U$Y` É��@���;�p^-�ݺ���e�Z���acFK��$������\�Y�3����̨�XXװ�8c\L�K�+2b���7Ý���}�l��-_NSg
c����[j'��%u��a\߽Gkl3��ѳ6W��29�H�ը~��2��^޿�Rca�X�s m�b��o�1J/������?x�︅ �}Cm=�V[�A��v28�����9Ӓ�m�4��7��Z� W���߂�ĕ
���7*J:
�X1׾&n�M6?nI�\^�/'#v ���E��թ��t��� ����m�0�s�	�H�x��"�^����y����~�}�4�-G�����/]ݣ�e��\p���Wi��פ�J����z׿�R����S����<�KY�)L�� �F�{Z3�7���(|x�*�(�-�G���:��T��d@.c����XRhs2�p��Xښ��6U��q�@,N(�f�����j!�6��'����ܣ�m]�A��2~��
�@�q��*G������;�����m�* U��m��v����m���������%��;���k	33�������E���C��S�r�˗��	�8c�PxL����߃�xSΓ��ޫ��HT$�
��e���p�L����w��x�{�X�hg�8%?Z��Z��ثj�W����|$BP�6����b��˳�V�vW��m����M�[e[P;!E�]�K�����4ǜ&7i���9��P�#<=�a �U����?=�F�5O�8$]_����v�5~H����PF�Qq�,8��ܹ'������m1�"������'z��I�N�ٞ���.�U�*t�T��r�l5.�A8G�p������7%�s���|�R�b���	��wIL�v:��Z��5�m�q����?��rP�����fk�e �b��ܟVTF�TDܚN�0�N_Q=&�令&�DkͮqcA������5��y8c���kxZ8�	ٸ�x��/*���E�i<~�ߍ����ҵ$)�Ey��&g�cZ�SK�}�����2�w'��,)��P�X�"�r�/*jr��W�f��މ�-��Ĕ̚51#_�M��9���Un��}Dw��^�x���poS������t:�|aj���{g�B�d-AE<����ula�2�7NљX�H�S�+�Z�q��O�ܞMͫɴ;�����s>�������N�j/3)�Yg+T"3q|�K�39�g_f}���J���YL/������v�E�̀���|BֈU�F/���dF������5YC���uI%{����>��<�k����K�������b��mȂi:S�x�#�l r��O�����t�/���JY��3��d�dں������{�2v�a]b)fŉ�E,��䢢|�.j����8d ��M^|����Υ�̩��2Y~�sKQ�ۓ�cꥳ_���>��˲-�����e���H�0�8�DM���8�;0���͟'KE����;�䲈����$�j���dQwio�G�ZI�� ��@.�;1�|${Rc�iE���将��n>����u���}�=�-U���dM)l;0*�����a{>�������f�e�+Q�D0&��谢��kDx �Td1�6P54�%�ʊ:.ӕ��.#��<��hUǮ˥k;U�~9�3�����~�o�ѷz��O�t�Bj;1n3�	��v
��_�����5�������Z�7���W���V��q}0�6y�����&��&�i%|W���NtX;�;���B]�]�	�{G$�#-��M̫��s�g0��C�v���/!ak��_b+��*z�����@���t�*)��Dp�A��\�L`&[�@%@M��դ�a�Y��oo�����vaGxq��8��a�?��`"	0�\>Z��h�h���Ԭa���p�����9�#{2
�Q 0	Ő�@� ��oDĠU��W`��e9�Ծ�ʫ}�J������Z1;ĥ�S���!|[a ���)��{��8�b��DG=�9����1���!�S��l����=v��'$F�.�W�/����a<f�x�d�ۑ1�
b��K6yO����;��W��o�}��iYP���ܕ�X>�ɒd?�hW�0�{�i��"��2��S�j@����H��3����h�4�^����g�!;XNg£m7x�\�x2�A��ˏYĩ[O�sO8]�EES��]'$Q�u��#����4��r����R��!N�V�!�����)Jp���X�@6�}|�ӊ�{�=�?��� ˣ~>YL'��j�n'�f�4H�]dU��{8Os����ÙQ*����H�0�!�������������$����Q�����xl+�dv|b9v�b�@��u,���v ���z��.�9tх�{���/�� �B+\��ɶ�}
�hY����,o2$w�v|_��pG-�uF��曷�`��Bc�$���l6	y��ӊ|�!X���`��gy&�V��$���3,��>�@7��5���8ei��(�^Q���vv���(�	�<�%uQ����0����\�zs���ӂ����R�$.0gO(���6w%�@���0��ŁbQ;���R��}T�B����l��h2��f���ʖ��P>B ������g3�ilx�É�]L�8���W�{j^��H��=��=�[I�L��]"Î�V��9�8�}0[ 3^�%Ww>���(5�H�sO�%����{�mMx^x?E=8��;��؀!��X˭=)� T2������-���+�_O�6
��cV@�����;�j���G�#�*�ލ4���HF��Qr��!5��`�[m�1�J���[_�:�]ڙ���KL�
fY����,1O��=D�fk�vi�}�FaQ��t��#�`
~\��O���s$@��߄���i���łK%s*vjww��/]�*�/��Y��[g0#E�g:N��!+@����- o��5�
��t
!g����|���A4��1O=fOLx~,���&gt�i0���x`��|EF��{`q���������w��P��m��������b2_���d���ϋ��'s��w����Z��zr�آ¢
������jd�����ʃ[ɋ�����T2d�B��R9�@g�֣Ѹ�ܩW�*͓$���S���#�\ig;t��y�`����s�j5�z�&�|�{I�l���C � �i�i��@����J	��'�U���u�zW�nno.����Xt�jZꏢ&h<;5�b��}��n�?����x�������
��9�H����1�'I�[+�*j��]��ia�͢���WM G���0��ӭ���ǟ��<��ʯ�<qy�� ������.�.j���������K���'�d��ߐe�4<����r�b�Լ:�\]�0����x1���iX��o�*M�v�p����_n�+�N�6�/�n�6��ӊ�
��J)���B��|Bv�܂�SrQ�Ln^Sq�$l��A��|��FT�Tp�/I��B���L���x��	i�8�O¨|O���G���M���u<�%�#�-���)`����eJ��?'+�%�epn��o�*3���bd����yEs�y�7��x��oU6�Q�Zr��Ƈb�)ثXb��D�Ў�+��p�Q?�8�+\pn��Uw*����/�$WR�ř�s���o�	o�]�~�ġh
����b=�p�d�֒��t�l�=���?���{�l1E��q̂S��}ޖ3�������C������s2�H'"íj�U)ywE�w����#5��Y7��z��<�Z����qM�u���A���n��(��EiM�m�'G\PU� T(����kd3�7|+k�áLRA������.b!�Pˀ�}J˼/F��/߶�x�7�e8���    �~i"�%Ov]T�`P�|+�"�:)���j�f���H���v7^L'�yt7�� �;�s�w���^���B�-z7Dot�'ȡ���k��mV�0�RLP:P��4;)���7�7�4d�=͌��`�i �Ub=��4��'#:0��ɖ�S�W����x�m]%��t?�;f��4�S}����ؠ�")ve��4�8��4zaj^�T����V��hO�!��e�s�/�Izq��904Mvl^_u�2	PV_4��~�ƿ�������`�a�8GCL�j��8�?s~��'5Oe5h���o����@͘��}U��
T���I*c�1}< 翖���EH�A�S]0M�|�S)|�c�Ww��?_��۪L�J2�AC�g�K�e�\�U���&�z��\�%v��GR����85Ol|ՐP���I��|�#i9s��}�3�^�:�yu%4��<K��Q1�SN3��a������6�Ѽ�(@���Ip58���Y�B[K������0��Fz2EfI�AxoL���6Nd>f#��*��et�gD}�S|�����ݹU�+w�#F�m�Q)�� $R��	L��(���N����?$���Χ����+�k,�����N�)�Ro��D���g�j
�|
T8��������7P����/�
����,#�7őh�}�ٔ���<|w5qg*����wg�|C4����3�|tD��qG5�؍�Η�?�M���j��4����
i�$#LmI�C;[p��q��{G&�)>]w���H˞���C�ڂ!
G�Lіa��Lͱ�j�Z'0k*Ě��0����x�ʼ������}�M'#�T����h�Y��A��I��[�y� �����@�Ű�pl�G#R���#��a��]��W�l�������L�}|�o���kgZ�r�d���{�����	���lf��G�4�t��I_T���.j�Π��F��K�5E��vA�����@�z�(g�Yi�=:��� >�������嶎��\�Xo�+��9#B-�c��
#�#�L��<y�2v}�'��%I,�����2�K?�`K]F�/�=��Ł$�kc�%m0�(���5���o�y����ɏF݇������ů��e 'U���n*����Y�s�e�$��,��o6(�M�^&HPR�j�+���M ��m��o��������,c;��L�q�Q�hS�-���Z�0ڇ��:��H��5�pđh�p�;h���1|;�5��}���9^.����m����$-3�]bB�Z>�H����ű�R�7�&&Lr��b7�|B��)���H�v�L'�5<hƫ�&��b��%�Iz
l{D��8�����VH�
�I���t`�n>!�+X��K_T�~�kr.�`#�=��l���t����L�ʤEX�S=N�U8쌗���%���yㄤ�@'I̗K^T�7���^���m����C|J��_���K��!X�Uzk�<�\#��&敝"w�s�ݺ��z���� 1>"B�Ξ�8�䎽z=�a�k�'��,?���A9hĶWɋ�[��F�����)���L���[��%���&��%&��&��8/��P��ɨ 5��s;��l�2�uÐ4�E8�������l���d��_S��[`X�N��J�����-fߋ|�kmU:�/*J׮ǘ�yB�� y3�F��s9����'��h����C��w0i
�1*Fk�8���9ܼ�Ӫdk�Z�~�V0"v/���y�Xi���F1	�FK�eh�e�!7Q+�]�h}!�C�(�a��݈�w��Ǫ��4[�����k��հ�-���Yj�fD���p�S�@"st���")���[%��Š���`9m�#�M?�?%����l{=�N�y��Cc�F١(����*_��^9�W�^��?$�A�Lm\�7���X�v�.��R�ʇ�o3�ݼፎ���ĭ�9�j�&�M+ɧ��_$ڎ�'��Y��4v��G��Am=}R�q�^ԕG�'�˽�j1����m����ެ�U������!,Ü�R���q��䪀�O�@q�nH�f/�����}�	=�bǅ�j��\m�u�VӉ}V`�䆓<��aI��<�
��Ș�V[��	Ÿ�&/�/*&\������h��M�ȅKi{N�8��\�׆�W������0wC�.�`Z�N}O/�����S��I&3;!�.Q�vU5ԥv��f�풽��
u�h�����C�pLǼ��EE%���Q���j�sU ��k�T8���܁-9�nN2yt�v,��C�~h:z����b GX����V*�1�A���T5�҆���ܯ+%] ��Jg�;@�qlb��:�ԣ=�,�KG�����2{y�ߎ~|Q㟒��W�.@Lq�V�98#p7��#_sg{7�@��X�~w0ho��]=��՛����y��P�3L�j{����u��YBG����Qr$zo���z�x>���x�����w|�8��h���뽀���y�Iq$��E�S7�
��O���J�{S�f���	o���@�S�����`��h���Nh�i��/�3�� ���m��Sƀ���}�ʃ�Æ�a���`�&�'������6�/d��ۍ��e���Z�|'*�xF��KR�����]����)���^[K�2��]�%t��d���-�>����������h:��""C�� u��]n�)2iA�8:9��0㿡J�ɣi�a�������-�ٖo�
ۅ2`��{ ��=��]����%��G�j�+ܚ��9W�nܹ*"GF`6N'���c�ȌSֈcx�/�R�\���J��'z�U
��ʙ5�g8�nM�4�K���öeF�N+��}3f�%�cT8e�7r�1��Z��rj�4v!�L/���XA �-o��+�S�o�п��ю|�sM*�O�����*��
^|?�Z��_��w���qiK.R��H�D��	�i[���}}=�o�"�	�u���-nm�h���}��.͂�����!�#�7䘷����&�Kۈx��H=�P�֓��h5���n�*ir�݂���lnJ���"�}�h�lJ����&0�	�|�8�K�U�������n�݅��D���^`Nbg��WV��p� �upv=�f���Լ���?� FZ<�,��^F�I�|����)4�әi������i�Ҕ�T�C`�̱�[�4�eHQ~yVFK��Ql���F�Z�0��ud]��A�0�ٓO� ;d�E���ot�NP�߷;�O��������t�q��o$�p_h�~H,zE��W�E��w��HN�8�g�#��yEG��^�/��f�g2��_v/��s#��r�(�Y.A�"��k��+u^�Fs�c	s���1��ӟ�%M�� l�CܺH&=�Ft`�>�%9?�sbQ,�(��J�:���	`f�%����]ޕP+���W�'y7Y
�Ʈ�q�hW�+�u^C{]l����~#l{MH�qB����O_T%���j���}:�O��[n�
�R;�5h��֝���3Ҟ��V[8��ՠ�"%&H�����Y�xn^���+hS×8&D�+�j�7~�jQ �� C.;V U���岣��;huZ��.F�AP����s5�0�
F|^�@���+)�J�\�*�,؎ţ#�3gD��V>J�Eo4쯽S!������I��54�vt��`���1i���*<Χd:E�R��^��{�� ���^u'�X�P��pM��Jz[~�� MX�^�E�,��F�zz��K�E���u���s쑀�Q:~,[*8d������8��}�����RqB6������E�`8č���`�nN����Be=Z<�-H��bAm��Ʊ\*Rp�(���:�g��W��Q��F����a�5R�s���W{3x��?���Qymz�ƚ%���c����X�o���h��f-���5ޚ��LY��O���޿�
�5�AT6I'�<���@�ɋ�z�y@    ;�|�Oc7��h%���M;�k�[B�T�E�87eB�JaQ3���N�G�M��[w���Z�a��?vۭ�n��3l�;��%�|9y�axa+�"Ќ;��:5;�R� J����3Y�/1�V�9��b.�u[�*�i{���
L₻U����[P&���kla�U�&�қ�"*!V�ߴF˕�-�ۓogZ������1D��HT��畳ΆW�⦹Q��b�t1}Z,:a���\)��9�K�aZ��Qq�C�5d-�'���U�v�v�6��!����^�ޱLQۺ�|Gڢ<x%*��}��Ń���{礊���yaa��Ӏ�����|�$֘�� Z�M�3K��l�̺��t�	̠*�߄ș�X]@�^����EqK�{����L�s���/oO�+e#� $K-siU���X�)��S��ù�Џ����f@X+�����	D��'��`]{*���Y6��T��	�3�x;k4�[�y��a3i0P��VaΌ�/w�i�^ܷ�'������tL� �A8��,��4%6���<f����F*j0)��F{O��5E���G ��!�$=c!��L)���b,[S9���|��c�,�Y��F�O�Ȳ޷x�}���<06ۣw�	��t3�	�}'s����y���~pf&���o�8�{�9��o��r�F������^9.�M�_q��2�踼�2����F{���+����ets����X#L��hLs C^:���""��G�؞,�8������A������[k+��I�6(U�ʔ��aY���+J��I�I�#`y>�T5Xs*�c�7���Ə��x����sJ��/"ǻsak|���ἢV����P!=��z�7�q�g�iT�@g,�K����a�'6����y�2F��P� 7��Nv��z����,6�ɻ����~?Y�����+,��P���~V��g���3�(�B�?�G-e(�ڝU3�:��ok�^��=�ܴ�����ޯ��"eq�B����H�U!��(MtGu�%ݑ�Q�г �! ��J�8"�I���f6��۟�Ѣ����yO�����$�e��]�Z�(��7�"�� 0,��������P���Ushd��[�:��R�j�[�Ir�M2��������Z����1zw�Gܫ�k�1�D���ML�	�NsЋ����a��o]�[E��ۥ�����,ǈcu�&\V�|X�Ζ`��	���%���sy��o�����[��%�6|��
	�Y�n�Nw��[�`�1�Q&*��Ɂ;<���Y�Ed�s�Z�d���&o���poY��6�����˘=�";m)k�`��X��4&�?De9`�����i�y��r;� u/I:�pa��Q��>��4㧅��,�~k���Y��V���2`k�{j^�<���������S�=Sev�	J"���c��H�
~v0�,l�Ә�Z{1Ac5���7 \�X65�xֿ=�T��Y��m^$C�L�,䲋L��7'����]���o���m���E����>\��y� ��Y�J2�_J5"�D��Ȼ������p{Gj���r��t���4ۼJ�El\߆���A�]��xE�}�D!>s���������nK.*���L'����a�m��&�,iD�ej���p�@��E$��i���Aǁ4*���`Z��z���I�*���[���eY�[(�o��
5�	�$$�]��yU?Y�֫
7������4� 6���;�`�j��"��>��p;���!F����8��g2B�/��wn�{5��S:�I����������[��(���eB�G"!;;���3�1_̗����k�j1����hF �21i�>5�'�����YCI[8�'�c;�Ń�ӄ���lL��n�����8}� M\eƻ��Zo7okk��O��e����J�����`��P'�(�=y� e�`����!1&�h��n�� ��BL�2�;�4��M�D^��ɏ5�nM�^����d����V�0^�z�9+���y@Es	�5��0UP�M���Q�o�z	�}���#0'�gKb�{��h[!=2����ຶ�Թ�{E��)�	���R�0`��Le�w��Sz��|�7�Ľ-S*�W�"�;�3B^D�\dw��(��oQ�;���~qØ�ӗZ�_���o��*���x,:�.�AqT����=������
Nh�Y^�yG�n3|4+�ʥ}� �b�nh`��	ϔD�+���RH�j��"x�S(�|�h���B�.R*wK�wP�ntE�8�6R�U\Q�,� L{�Hy����#qQ&\tj����!��G����RG+�+��n�40L,ì�cJ[�9쭫�(���Ѵ>���"*p�d�d2P��B;��S��rL���YB�6
�ƌ��	vlhA�-s� A���:�cv�a�這���W���q�=�\�i��Y�>d�W���ˏ���׳��ASoՂ�� ���h��A*������]���@6���Ӥ]n�F���uvp���K4(���jQ�������0C�b����߁�t"�wl��
��w���dt�u	��J����?�6�m�.�S�l=��Czu���A}�T'f��ͽ���g9e�
�s4H��^^E�.}Q1pڽ'bv�w|)�7�Q)�[V���d��0r��p�1`5��PX� �6:c*G�M�+�R���~?y|Y?�ZG����ּ�$�� ���o���Rd���z׿$���d�To6{u�R�o ��7|�o�텢8ܵMRi����*P�b+��iE�B��m0^��<�;�?��e�F
�(��Bl+c�Y�������N)�^[t�S�'�Օ6�+�Wtj�)Y�����ZoƢ�����2�[�ȥ4��_{S�Õ"��sFm���ݿ<kM+�ȁ����n��>�^���z���u�����r���@u]7�2�K�0�7|��C9@HNٴ����z7�+K.*ʄ���囜~�xt��˂���5�u[�	��G)0}꿜ʧa}��� �*>=�?̿��ô��^ԷI�
���u�4��¼����t����9�߿��9닢`�%�V8�P��!�i%�p���$�1���`�D�K�+���6�� f�{��Ƌ����j��ׁ�9%ֈ���6dH�ۄm�Д�ʐ*I4� ��Hl�G:�̛�������ϫ�,F��%K)�3`�v���d[L���E�C���Ѿ!�B!nOi�)�b��Լ*����`����r��l-iC(��C�5�� �(�Y�@��ז4bN�(Z9D��G�|`p�t�E���>���0_l�a{wҼ&���ʓo�'���Oޗ���8+��2������"���/*
��K:�:��Z~�p��Ҕ��
��~5�ʲ�3�+�Fh�񺁎�8!1;9(,鋊����V��s<��yZ1�r�u�kUiaN��NB��eU[
!�������.�2��]U�t�a�І-�US��_���Κ{��u��_�PВ��y�Vz��i��<HJF���Ee���0h ?&��8��\���=�Rm��M\����e��U��$ 0�je��#�r�O�2��}E�X<ǂ����qk���2�
�Lh���� ��a���'�=�M�V��� ojZ0�	��/B΃J�� ���/>����+��p�r� 7��"M��RhUT���TA���GH����,8���y��� �νC��O+,I��.ݰ�5����kfc��}��7^rQy�~h�\V��X�f��GJ�R:�1�2�S�%����T�I9�\�w�a�>��G�{p�R��� �0����ޜ����E�J��\�P~��#��lx�(��ԍU6K�0SQt���	#�Jq�R���al�Ī�/�և�o�e�x�-�,'��1�_frܡXBc2'�:����8DK߱���+��WX�Z_j^��݋�U?!���b�{w������jth�2L�j��م���7�� ���8H�ps�������l`PoI�    �����p�)��}��A-�g�(k�-��׈HH���u'���0�K��{��O:���;�H�n�nֿ���搮R�SR<ӽ|K��}Y����tn������a�}ݼ��&�Sc�9�R����xr�ZYÉ��#�u8%�E-L|����O_T3N���絻��dt=�>Nf_�/
jz?܋PӋ�ˡ�2�f�&�]ջ!�ѦX�'��z��Z�t�yq�ӌ	juWF�Ң^|�'�PT٫��AG߳�p���8wR�ꊊMGdħ����L`���x|�����
�ه1@y��??A4r;�6c�A�ӱXpZ-�ӽ�� ݞ��f�Ε
�ک��(47��7����oͱ�-x���ԣ2��������Px�q��
~�0�x9��C4�3��9�qW��0}�yr�$�`ZM�h��5\!y��D��}��aV��Z5�?'�(A�\Q`�����H�C�9o�]���jηK����ye�a�l\���V^�嘕S0��dw���{vS�B�y'�[t?��ނ��Ii�?�C_-�A�#��^���Yj^Q��Z�n�սA��y��@��*�D|�O>���/�]V�bR��G$�9a�S�j�w �G�	�$���p$n�Z��Y\���өE.�=H��8@�7��k,��!�%Ļ�/�y��xC�Xn�0 x��A�	��q)X(0�k�O�������n�Xt?�4��ݗ2�L̍s�t���;Se��$��@�8R(V������;J��~�M��6��K`��,YI�Z�=y� �b�q�?Y�.���Ц�W^���q$�B��H��EU*~�ԫ�g�2٘��DA�gJ�$Q���=D'*7jC����ؠV�B:]��d���Mֿ��&�����	)���Xr���7���6Z>����4_�V��S�[`޴#�# ��q$g��
���Է!Ϗ�AzU��ط	*c���\���մ�����R����^�V���;"���@�Ɓv�e:���ӊ��i�z�y�tgSx���	⫕�y�5,�0L�X޸�c9�U�_�j���Rq$}��'��Wu:w{��C�`ϦoV�F�k#kRa{�]J�Fa�MyXr{֜ϖ���΀���d:Y�l`$�a������?i��Mώ ���"<S��w5%�U'�v����	z��m�fxӪ��W��@@)�/��8��ļPt;�O�$ib:sc��{������h�~�^���j������ьX��vu*Z�T�����c��2��"X��|!��t-0b'r�R��#��"�Rl1e��_3�zg�߬NP�U|\���R�|�)��:L�����iB���q�'U5� ��i�o��{�*��+);���߾%�z�"Vy�O0мq�%�2DZ��T�é��S�s��E�=E"Iq�(�O�#�#�����O��[չ�\ 7�E=���6�?�jB5trv�����H'������x�~�UI��-�,m���˜�eUA	�6�_��TP�d�4�^ǘCO�r�w�k�۝{�bʬ��8t�:���:��^Ӷ�����a�����T��u��za�q����	G��P`�Ȟ5,����P���c���~�#Q����d:}��?����+x4�c�t5������驍0V��j��֪��$B�7��.�A]Ut��߃ݿ�����W�E�ʘf�"!���l-�x2�g�x��@Yu_�_��w�����<c(��K�A��8�&�����Iס/�T��L~w���a���5@����IY����J!l�]���9��s�;���V_#�����<��YE&z��.�L~�/��L�;����$�\�ᎍ4�O��&V��fqbQ)?�F�E�sQ;�cؖRFb���G��jM�?��'?v���)ڹL�wkL����X�E=�^+��rW>I>~!��$�8"I�Q2�Z��㝿z	�� �5[�������1[�JR2H��M�'e�����Z�Zז(��s�`�*ƽ�J"�b>zW�㍢iE�}�vj痃z�O�!�aY���}[s�H��3�W0�pf�AԽꑒu�n�(�m�D�`�l�ǲ�d�Q����U�@	��lϞ��5
�I�Yy�rtqX��^��ڄ���]Į�&��D��J)k�?�ooE��(� Ӊv�ͥ@(7T��	[��9N^ k��"
칐AVI&rY��?F�SAѿ����i�?�ڌP��G�{����:����.¨��������y��b�&h�P��_6+�r�HZ̀���'������Z�G��9xO�������א��=�^N*A*'�=t1�䬴R���H��l���O�u8�����m�����I[�n������XG'���'��	x��zi�F���m�쑛��y�P�z�c5~v�?�G��rXcb��[�w7���JT�_I�Σ\��,*d�60��{m]�u�[�w��A���캝�5�?����y�������_ڵ��	�L!s�^t ��é����UT�RHj�,>"� ��|�>i�o�/��=�z��Ǜ�,n�fK+#ϨR��uW���e*�,�����СO$�n�ԇ! ��~�s�?��}��4?� f���Tx�����qE�)�v6��m#��¨/���a�v�ƣ�N`�K�'OR]򅯄�I ���$��8V>��׽��&�',�`�Fl������|]$Vι�HV��~6�]��vGT]6�==L���Nk�.�WR�1҆ �b��$F2�o�����F��;r�8d�r�Ԓ���l�)$2�
ѩ.�2fx��å�I)3Blii��h�-*�I[�(h�>^7[�)�'�\��!1֌N��Q5�[�X�z@�V'��j��,�;ٚ��M�����Rڲ�s4�̮[>�����y�x��Nޓ��I)$,/*#ǣ.��,@�++=��\
��x���R����l��yI��A���.������X�bJiI轢�=�i�o]Q�/��M�����H�-m���-e���W�L�W��M��'�o胗"��ŤGO���Yqh�X�q|9$�RǴ��&���H,���5�X����F��y�kW�R����3��v"��k0����^KX�iʎ�A�FP�\�֒�"�N&OZbvL5٣�G�%^V�I�`����;�aZ+�+�c&��HN����p`k��d+YJSj�%��n ����|v5�%�Nn�c�ن��j�+�r5�Fv������2+e}������!��f��I�w��{����ŷ���i�x>�� �,%��_N?���L�.�8��m�����u��Hz��<�L�[
�IlB-�a���/T��S&ާ׾��?�u]m��Kk��u����1C��~�g�Â�[!E�c�OڂySA��b���	��D���h�᫐Lb�sPD�'/j��"w#�O�7f�\y��5�d�L��|�OC\�+�����a���a��/&��P<Q.U��$l��ZCԸ���T��A�go� ;��%_o���vz�m����g���4[�'�QY�a��4N�¾�m5��ys���3!�x�r�PQlz��>��鍾����*�̴��[�tZ)M0�H1:�T����C��t���X��Tf���(^�N��,4g�RW�� EM<��	]l49Hdop�����I,V%`�K�Jmi���ubZXY���"@�czAHG*��	�\mPk\\�m5�q~�Ꭳ�^�̆�^+��'MX�j����S��JN�5�#��`I��lzy}*Z{�_͋��6����2q�o�y���C<d��8����P��,6錐��s(�~���0~wx��������}�S$fN?��̿M�#j� �YQ`��4�x�A*:@b)<�������b�(�3N�r8���>�(�C�I.ʳ��c4e��Ԍ�g_I��⵱�1<��bXt�uUI�<����e�<R$
�a`2˖�s��M>~�|�p	Y#�l��ټ4Y־��1�#-We�uҹ�l_��٤�4w>?��"�    �τᄆ8N.y��d9?������=�T��f_I:p�@�P'Vmh�WC&���[m�h�q���t<z����,�H���^.�T�j�s:y�t����G�.�&�2ھ���\X�D"�1?�J����-�̖�bV��#���Q	Ons��+��ӧ�1f�@���@�{-���W�f�7`����NZQ�AP��H�Ą+b�"}��ۛP�4yx�-V�C@����E=dU.�m�D!Rlni����S����T.'�Das�r����[���ρ���#i^J��cnD�էNa���r���m�N*7ľ9���H!���ή[�%.>\�F�����U�ph� *0��j	���T�:�I�ܠq�(��Y?vG�����l��2!`��
0�9R�[Ёk=�����bm��O�����8��4�g���-8�ō*}���"�T�� �ҹ�z\��V��u���d��f��P[yX�B�x��6Ml��R�2�� ��x�N��{��'m{�F>R�ev?�޿�/3�T�/>�l��ג��ű�U�-������m_c�O��I jW�����c��{F��I�}�r|�Fڷ��J������̜9��3�¸`j#'`�pj���Mt��1oԄ������ok��?����=���r!����Q{M�z&�1Vh���	��8^�%ڣ�%MH�zv��匹:�` (�4��D�,���lr��16�=�+�p�:{�a��C��DJ䪬9]�"�ZժAd�8cUl�8^�l
�h��΃'e���{=R0[��e����= �ߦؤ��]���?�}��룢8зj,}���xR$:5���4t��H�LZ ��m���+v��2}�����c0a֏MM�'\��j���&q�˹�>��$�����"�nٰq}}�6��I~���]Npc/��9���:��a��M������8Q/�A��'_s�r����F�Ǉ`F=Ψߖ����n�
��,�s�J�ZF*��^�ޠ�F�X�u	����ʗ����C�<���m@���3�c�3�}���S��46��@Zb8x𔵱Hz���!��S�p�'����j�i�rZ��K�Cy���a���L����ĵP��<'�ʣG�Ӻ�:�bف0Q���j���E�q�\� �n:⫎�A�]�-�+w,�#9D�w呞hz3�2J�[z�7�W������h1��a�H��WҞ�o��?�<�UF6+,�F���w�/�-X�5�*k����L�'����t-R�~�o4�'��T����W�|,qB�t�3�ڲx��� q�Y&�*1 �>�������=y>������͏����%G�M/��5)n��o�t��ё�Co��7�������rH�$�`'X�X�ૂ�L	�uko���7<?��o���t�$=�et��v��x���A��Pb��JLo��C���WD{��8�����W����C�`]��P�#$���F0|S뤮�^բ�q�����d1�,�pS�,Ś��a+�%�����!#�m�kCJ̴ʢ��+#P�7�-C�7w�1�v��OF~�xaL#�u�9]�-@�����.��fN�tь�N�1d�ǣ�(,��kNZ�O��P%����� U��e
c��I@5� ���*�sҰ���K �����A�<�-l!��Z���o1�w?������tTOaBQ�- )�ӭ��y\;~��n!M=s~>^<z1r��>i�������Z6�~!�UV'dļ#�&��Q��qr��B:�x�6�t�$*I������Xq?�]����ǧZ�p��ɢE��Ԋ�U;���Wݵ@��z�($�@�H��(�Ժ���֗y�=��+Jy�_H˓�ʈ�Vkpv��[F�97N��8WIq��.�>�
����'-{G��7?�V�Āb}��W���h~�}E���)�9�[;u��c!6���=g��`s
i����������N���c����q�c�C	d��9]�d�Y1�)q�F�=�������2q�P\Оə��
 }��S~"��Ѥ$xy\R$���T��Ur|fTw��,3^2�ktP���@6pY�m[?�5%O�mo�)���nxK��1D`��2W�/x+�,�@���m�$Pm[~ A��`�ʔG�I�mũy铖��;���ô\��aK#�el$^z��9�x��hiE��"&��##��5R�w�kb�	$���gԵ����kFt��`R`�#���|�s ���`�Wa���_.��xss{4��JUda�������u�%���˄y'�ű*[v�c��~�N��˓qCs�n{xs�����/~�~��:�<
}�
�z��Pmٴ�tj�)o�i�5�?����R��L��I;/�͸4A~|�|_�b�솗3FHm�t��/�j���M���


hXb@�U;��G�����ɧǯ����:a;p�U9�}�x�ڿ��d8zç�2F0�1��q\*���q]�z����x+0� *��L�Q�Y��N�bI�u�s�p8����Da��B�c���	�`��	��C���qspx�;9���cs�r�i��C����L�F��2T�(-�ѩ#��+�<��h( XC�j0)&�S*��-w.|@]��i�\6%S���A7�'=�Ç�'�?�����N�8[�R��G�7�\��ކ�)��Z�}}]���������U�k�}��Z�q��)����]�������O�������.)��n�g�k�lnO������O�g��O�8~�k��/G��o7J�nb��M<�#�ǃ��Xr7��%���țrњC^X`@�����A�7.:NR�С�"/i��D/4��!�m�G��;����J��G_#��*��K��"���?��8zx�˭���Xc���p7)em������$�󲖳�� ��!|����>����WL�o�r[4�%�����3J�����c#���a�%�)�Ph��;HxiJc�x¼��QxU	hr����ݸ��7������Bɽ�Z`/R��9�n�OĦv����������O��K����o��v
b\���׻��$��I����W7�?�_��L_�[;M۳w����\�ߞY'�s]����F�_p����� ������^��j�hv�N����a���sz�b�]'DF����j2�8���a�m�@���6�8�������/��We�>f����ַT([Yl�e�LR�OD���(�W.�YU���3铖���� �0�=>{�����2W�����%jU?VEßP�b:��װI�����I*����S`�40��;6�����:ZPs8öX�K%�j�R���J�|�N8$*�:Q(�o&�Z;2:�?<V�bYc���d:v���K�-�J*���\���s$�@P_И�p��9��?�Z�+��9�Qs~�?�??��%hҕ��`h����}��(a&H@�u��f���� LC���a]��ʍ/�7a������׀a����ªC[�a��ׄ.�X��:�[�@P�xv�Դ}3�}�x�N���ֺ�~�/���0l��vS[��Y����e91s)&-��ţOqgʌF��={EDzp��u�� N��|�X�S1�:��rQ�m��aH����\�غ�E��LS�u��O_9 �
�eK�^{�9y���S���۔t� ��Q�{��I*�($���ok��t{C�ܸ�����x�0SҪr�`s�R������]5�����N9��D��1ZEi�Ja��밵�ПkWab�h�kf�F���'�����?.�~��w���_�z�o	�l!`w�NI.R��#�ɥ+�Z��IBk�bQ�k
Ţ7^f��_L~,�+3�/$�q��&=6Y�xx�4���@qͨ�Yb�{8x?����k�[>񗯼��x9��Z撺��L3�8�:/U���P*ێܚ.s��%ޑ`<�H�rA�����*J���������������:�f��t��&�1!Wz�����Z���f�.�%��J?��<T�wr%    N�;Es\��و8\��L�'8�1h
y���ě98�(�/���������?7�ܐ��S؁�����vƊ����xJ�� A�jґi5�h��aC�ڂr��h�3���IK��>�}�����O��<����^L�`��%͒�G9ˬݺ�j����PH"��!mp� W�ˉ�'�2� �G�������$�J�0P���e���t��$jC,��B�x$��GN���
�n|�����~��R����FȀ�Q�Z��t�0���j���n�8�a��S���#������Ժ��zq��漌���F��3IvP�8�*���`�Q|Y��^��U��߆=�n�p��d����<s��m�+���X'���P�JA�y��>������KI����2�(����H��Ȧ�˂,<QH��Z.�)E��`��m���A����I�;==��.��1�w�E�C���Uuu@0��,�I�\-�M2��(d�b��R%Q���T|�B�\�8@==\$/A��@�A�1�h�7����h����nT�dA���weRr>%�`R!��c��&����_���#��V8�
	�K,�����6�vQ��9H.�pN?!<��a�Y`9�)����z"zPA��h㍯"cRySΤ���|� %��a��?^�oUl��cɷJC��a��@!inc�Bsٶ���ŧ�����9��n�W�c�+2�3����T����&�4B��L-
%D�g`�� B�=#y����ήN09��A���| 6T<�H (�8�,�n"_��R���o"��Ե�h�ȿ��B,�-�RVj,�Z�Kۚ1k��7�sϋ?5��ч�%��>y�Ғysv��?(�};�H�����q�j�t�ݭ�I���Φ�G�n?*��p}CEίI�k�p�@����83�n�|ܒ����֐~F�"���ɧ�>�s�]�^C�2u���E�~m���_~M���V�dq�@�l�N����巓p)G��p�u0V/�ޚ��u���^�q���濐`��1���le�����bnȖ[6t�����n���f`����Z��6�`��(("�C�e�������M�/gĕ�����ڗ�����E�`���Ҫ�3C�tMR#��ķ���3qVK`�<ix�{�i�XL����V�G�ꑚ=Qۺ�l��l.��H�E��2�m�~x|����H&�����LH�C����,��U_�ʖf�������e���֐��ܨ� ��/�ԡ���X��2*���`�*��3t��'���C*����4n� =E�N�H�Z������6]��_�%�e��rX͊���;�>`�d��
Y"8�
�/gE�����W}��V�=C�"�g?q�	�K�׽���>8HR>���5���vc�1�'!��=�l�S�O/>߁��Vߧ���du�K�Q}7�=^���Rl���l�C̤��
0�m����!��,��%�غ�ZW�m{�:�!Z�j�Q駳�"=�A����Jܡ>�=7ܒr��m��m�z�/��W�嵲��G8}���� #��޺F�Ɖ7ع�����|G��s����T�Ρ�j-��'z'�?�/����'����H>�R���2Q�_���Fr���J��#uǠ�\���*�u���ﰘ~��Of��]�����{8�-R|�0�c^� ����P��>If!|(Ğ�@��9E��V�N��T!��B�P�av��E$2��͉�îqv�g�X0�,!���0��Y���|�t�+ֆ)P�� � i���%57��\�QK�j������N���)�V��ܸ@M�C���0c�}����fJ',sy-僱
g<�XX�- �B�Q����Θ�a	�נ-&あ��j.�+���QE�#�{�R������S^8��f��{��z0�&�pxA)��s�x���r���聗���knz�bN���;�\��?_����F��������A��jܟ�~�K��Ws�Aеk_LSk��AP��9�2/���Xb�Fï�U��T���𺟠��@)�
Jق�P.��h�(%���md���`�$��̜~�Qh|��/� ��q�����2�p�o�[(�h��r��3�X4��'�\��C���P���e
�R׀^����aJ��Ѳ��,�R�̍ł�-����e�͆��U� ����JQ�9�2��2�������6���2x�ӇO	9~ ���4+P�%�nϼ�]t
�?��Oç6y���������K5���\{
��X)ͤC�-(��\4ך���$���@A"������������Ķy���r��4��f�W���KSN�d2N����c�.����8��\D�����B	��@�F���2�*�I��BN���@�a����FȄ��q�UW[�«-��R��]6�YP�������8�9�����ۓ�L�Ѩ5��s��ٷ�㦗���~�=�[`]�}#K�K��鶂>��Y�.�����߰�����G�OH�泞�n�h�qB�~ɹ�H�4��:T��������t���t���A1O�[�|�Xy��4���"_r�dE>U�m)�e��`1�:]�9:{
I�=��ga~ν�)l�}F)3ˮ��\�h�p�8��c���w�%Ѧ�{��o@�H!��78�xe�6���M�=׃yؙ:P8bGu�j�\y��e�y��#Я�������A������Khi��O�4��X��;�JX���b+d�����1ҤO�,�_>��_�����)a���rA",5��=}�u!{w��@��0O�׿��Wd�(o�B�;�
L8�1�*�kqd��:�w��ww~5�9�<y�/"ȃ�����_k_k�����Z�;������J0xX��4v����Ǣ����eRJ��Z{D/��}��`8�:]�O'W��~����?|�<8�^;�(|R!��7�Y'L�K�����$�lHx� Y�y{3��]��\ߍ����i+�R ����7�a�0�m&���H�1�዇���ɿ�V��?Ph����R�=��z�g�0�L�e�fVVW>�ȴ+d��=��;�/���q�������N,�3W[�/��&��\pU�3,%c�����C����� �#=���˷�k�1�-`�!̅��nv��	��@�j=H��vj���Ǉ9�C���0���d�a����J��#��p���eQ����H������Y��4xp���}���?-6��v�������k^��	�b�6R�+�ث�����|��y�|m� ��dA]n�Pò�p �X��\v�9^E������pe�h���IM@K�s� m�E�SX�(�l�������rExZp�#�K��3�'>Dv��r4��m��u��a6K_l�>~.��
��.�I���rD�}_7�.����KF^f�I��e��uei_c��K�"�Xq6�]L��P@�Z{`�S�F���Y�P��<w/kO;��r� �UB�}^��� �F���:R��y�=��y��H�j�]Ek�f�]�|����h�=e*+�s�%�y�3�7�w���b����>O�������I^lm���2&9�/��کM4���o�Az���]�p��g, x�a�*q�=���H���5J���e ��<�$����\q}��w i��|�����3�t#4�o��/r��k�l0:HIKfT5'*{_��	��QG7�S{t�ME����ը�9lӲV �M8�j6�D�Xw��Å����tQ�fO ��k��O������ϰ��d�H��nc�yͽ�8��/R��"�P`�[G�`�^��'�)�"1���Ȗ��|�Wʧ��u >Iq(�c�f������ ���(�Z�����{g�iW���7�w{svu|vxzy�ZOC*vo�+� ��%.H�{/m?f�{��7�΋lK�^lvS-[R�"�p�W��#�n����u�@����_�x��e�R��JOX]0���j)�������*�S��DOo�r�:�Z    o4}�R�����_�����#�,ؖ��=2`�aI;a&�
đ�u
��&����|��o<f�Ŀ,���ת�j�U�W�dE�j����M�g�8�EF�٬�����9E��=7���?'Ϗ��H���D��Rb'-�hgXl��e� Y��v���n/����X_�C'ܷ��-��/l������i斫,�� d�0�QwT�S�g�L1������MLk���i�t����p�n�;��j�sz?�"I%�)���������� ���~CH؊�{�h��':�Ih,'C�$�A;������`旺DZUVy����z	̉|�f0Oz/�8܄��f�݌]1��%����G^440�l��"�� ��["���q��X��������o~�|_L@a�Spw�g{^m���@��^�ؙG}�|sފ�-r3��}?���n�l74u�)'8r�%�h{��N;�#��S���;O���;� �AH�R�V '�����*x�ąY�!7�u�)�.�������_��j�b�^��0(�y������Y��.�W8 ���ʣ�
��r�i���U�j`S��즀Y�s��nbΦŮ�Co5�0`qSȵc��f��B�L&e��#K-h��9m�=����D�p8'n�>8Q�A�*��tN�F�/-E��>/&X��(�+�e?����2��^)G������c�s-G����"Z��m���B|kY���W�CfϩK�q��DfW�G#T���e^��;��@�J!���`�?e��r�y�}~?{L\i5~"��0�WM䰭%���Y	o���+鐽e��;T�`r��rg]!���<�/<���Ƹ�C
�)Ôݽ�*R�o����z���e�xDa���h1b�sK�HY�g $N���	"Es��s��p������A��Pˠ�����3Y��H�s���8ɓ��U���#W�ڣ:�ͽ�
�����W+K���>�2(ⴾԺ;���w��N,�C�z��Cl�n_a%k���e@�пu:b��8�]wFT���x��4�j���˔��h���w2�w���6Z��
x�me6Ƽv�o�57�7��������Zw����O~>`s٧�b�y�/D�R����4���]�`���]�x�"�@E|��^Nf�h�'�������1i&<��C�<Ǘ��Z-)���n�� {k�}1����:����W�$����N���biRɊѹ��;,g��=�)�ca�7vQr>��{��gL��̲�Ěwޟ;�/���9���%a�K@��Й]�ja��^G��@�aX:�����mv���4�|9�8�g��f�_��$/�B�_>�9n�� EՌ#w�W��$�8s�㱮��	V`��+�$�6���;�����9y��|�:�%`Ͼ���8����*!������0D�#�<��f���>��j�m�i��0&���~�t���b��i�K���_x�" !7E~�kغ	��O��?V ���������ț�<ӫ���R�Jʃ�J��,;#���H�Z̮��F �I�3[IN�-s���c�\���M�G�q��Bjm��z��D���Rh��C��w�3:�g��.����r�Qߜ������%���]���I]j/���̺�������v�K ��dM�H�w�[�]�P~#�D��p$��/Kq��b����>�_���Xz�\eE� =I(��W����n��2-|����Ta6A�̬���g�x��>�� ~5�|��E �r%� ̐�����HN�a%�V'�M,Uɿ̛������*�$�A��O�VH�"��&��pj}&�ɨh��*��֡���1�ˉ��Xă.���.k�{s�{'��n�x�p>���]�8�9zuv�������8Y�(.jɔ�"ܗ��w��~H�z��|G�U��G����a�YTVa�C���g]�����h�I]ʉ?}��ɲe���c�>h'�e����x���K��9tO�+e�<ie�Qs�1>r{#z�^�����Oϯ׿�^���ᡋ��¬�H��'�m|�c��5���P������"dv�y��Eo���'z�cVk�_��Oha-�g;+m��N�J;��� �����@+iF�9��J׳�X�N��
I�;J��Y�H�7�_��Ͱ�F|l�p�ut<���#{׷�7g�gG�������k���&s��l��*f�I�oK��jU*�Ę�7e�J<k7���٣��~��@�O�k��M��A�0hP���%�\�$zXZPɢ7�����DwA�u�
7�B/]��o����棉%*��|�(����E����[XR�`~����2T-���V�#�iʍ7x)�5i`�B2I�'Vp��RV�4�x���T:�箄TVVyp�)�!�����I�e�b�������Z�o��ե�x����;��QYA�J�Xޔˊ��*�<��OP�v��� bIUQĹةu7M<�L����a��Z��H~@$���O����Hv)4U(��嘸3��ୣZ�[�,t�������s�� '�`�:�\���,X�)d�.T#N�5|ҬA<٦��X_�Z�{ܾT�,����h3Á���6紇���)V,�M{Yۙ�hXJOH�Nx�T$2����*X�� ���(Ğ��3�*ϼ���,�>���b���B��'���M�%�7���S�H��-Q�+u�<�d�Tp�a��0�
�g������8r��#5h�A& k�a�6����8�#�F��w��:��
,X-�!��l����D���"�f�Ԙ���h�x�c~?�c�w,O�_\��ܠ�\+������%K`j��]��+�]Fӏ_@�5�;���q�4���|/@�`�9�+��XlD6s���X��C��`��B���ĕ솇@�*�]D�V�2�B����T�Hs�I�頌K�����#����/p�j���|1���S\#�X�m}���v�)����Æ��Ժ��p��M���,�����e3���P�W�����fE;�)��	
d��<G~ O�{گVy��4V��,w�As`�߷�%U���͍{�7`���;>�=냍R;��o�� fv�^T4���i����k�t�x
��t��}*ޏ7�7��.����Ϯn�Ƿׇ��������=��m
g\ S5���9tt���as���p�M�Z�.�%��m1��f/l��U6�o������i4��� ��J{Q�ũ��\\g�zO����'^#˶F;N�]9]���
��L��t�<+��o?�qŴ{�t�s��޶Ε>Ld��*����r��۵|�����������%�<upS�<��V��G�%�pXϮ;��a��������j�Y�ŷRp�1mi� �uE�],R���v���[���tӸo)ð���;t���!j�3bz��n{֭>��#�*�,j�x���;v�Uv��v���Hx�-=��ql��@2�� ���o4�����rӳ�N�׻=>��/~�>��>����ǳ��������rë��{��
�ӊ\࠵�}��+�R�f�Y><�-�"aps�Y)�ۚ���Y�Ʒ�x�����\�V�_��d��fo���(���Fe}�Q"K����*4t�fI�{!G*���A�<!%���V��}�25 �W�9*lë�];�����v�TR���ײ�/��l ~����O(�Jr���,�Ǡ�)�D"]����z��m �㭶�o+(��H�4�ܰr�AS�g�w��c�;;>�>��P]g��7�a������+,%_�a���Я|���/�G+�Sî!�k"�{m�G�j+__������Jư���*�Wc��ͮ�5�^��ˣ������G����y(e�\�b���6�%�?]U���&D+E���ژp�m>�����%g~�ې��.�P��	sA�{��i7�v��9�r�P�#�bt���A�����ȵ�)M�T�.�o����:�(���a�n��o<�8C���@���	    ��G;�9�=���������������o�<�4���qA�díMl��P3ހ�LJ�T��ݗ�o ��,5U{l10$(�	%�q2>��6�@���[�aW�P�j�b����i���>�c��ם�%��*\'%e�q�w�Ԥ�*K�>��';� ��*��
�� .(�U0낼&�opm��*b#��h��K;�Xxu,�:�^۠���:�[��;W�t��<�����#k_]"��$�J�rt&�N�͎��(�8{eI�*�V�v$ȱX�&�=1���'�O���G���DMи����xՠ���QF5�(����&հ��r*z�����Op�䩺����^�/�M�c��!��qoS�Ïp�+(m�CN�[{���O�ዧ�Xq�xy��h��<�����z��5&���oN}������qD�Yب;���u�����7����u�8ή)V
]D�t~]�P��x��3��Y1��쎏����?�JG��\fE���y�(�PATx(C�_6e�Ż��s��/�b�r��5P�|;'r�����@��e��YyV1��J���Tm�H���^�f��<��G��C(Yw����采����HWX^�	N�@h�߅p�Y�pߨ	n��wy;��*VYe���c��`�諬e�*
TA���p���\�JhO��;��������	�c���Ą� bDAH�,�S��GpA�j?Fn���A�6m��Y�my��%�e��m�3�GT�e�E[�y�5T-F6�͛Xc�B��jE9&5����*lC쁶��Z�v�շ��Ѷ4��7E�xާ�� ��_��4~n�i[rQ��f+tkM� ���P�k֚���߿��y������;���a�� �2A�c�kaeY�Xw{�}M��qz�e�'��y!+��v	����[�7� K|ySe0�-4��V�d{�y1������mTN��XA���S�7���=M����-�0���?���Î�m	��3LEg�������j������G�7g�����~.�.p�(#v'�������ѷ��c���A�4&#��7*�*�.&-��rg���w��J���:+��&P��o�Z��X_�Kٚ�9K���X�V�@k0֔��&p�
�A
X˨�ù@�B7��7�0���Mr���^M���i||k�ӥ\����0oi�����˵Z�-�`��i8�If�Q3�?�U(����q=����ĕ���EŻ��e�#�)��F�������w�Vg0��.�����y�T���)܀��%���ik��~Q��oj�}�:<r��̃xY���n.�Fkb�Bm���<�*@�=�X'�|��0M'5e�v��j�ڲ���CxE�@������J�;���f�?�G� �жB�ak�f'߰���z|��y����Yq�T�-�bW��>���
�C�4��H_Ar_�Cj��N�� h�;�Ǭb�uV��M���F+Pu3�ؒHAm���F«H�(E	��F ��9��-�8�_��מ"_V�"S��6��w�ｚ.>O~N���z��Qz�(�;5:���(�Ӓ�)�u���.�Y��{��n>��=���ɐ��=̣G
>>��e7�+�L���.g��O�O�1���f�C}��-�U�UQO0�po��� ��@HÀ��
H��� ��*H-R�c�<^�ڊ��zW�w�w�w5�w3�����	����ɫ��+ٟ�ǟCH�j�.��]t�IЯQ�7��'/;�j�� R�S��8�nNs����&����e�����k^��lz; b1[7a��)��C�r;�bbg���VyL��xd�' q���U��xWniR���x5O�7w>fY�'V�Yp�MT�����9U�K�J�}(W�����/.�+}Ak�Z-�
*��V�w��ݪ���y|)�G:О�@758����wZmQ������ĺ�z�f��i]b{�&�.�t��k�;�>�~�2�|�jx���������oz9�>~4U��,�N
��5a/����ǜқf�9��J���.狧��5@A�W����^^�/�Pa��މ7ﰧ��H��ծ�SE�ˎ��ac�k$$�@�o����?t���`Е[���l��a!$�$E�A-S�w8U���TkD�NI����8�0YOe���w�D�h|�1�������9+߻L��;_O�q��lfU�AX6pp�$�}�D[:�t�G����	��N
f�����0�����$s���5fw�,Ʒ�n�����N�R���h]r���$k���bX�Btod��4v�7�9���x�p��[A�[8G��fMad,��k�)k ,�
uZ��2�FV͸֫��YU�o�=���.B���6�ż���{�3��uGek޻���O��.�wL�JV����d����M	�+|<|��[�{bGC���2�"[�����6���(��@�A�b[=��HO�IN\���y�q�W�7ˮ5���K]��0~��q{���Q�8��D�O�#;z���#�� ��)-=�m�=%(5��0B�
��0a(�5���;��q ��<�+'Y���`c�(
2˪
�V�n5�}��yL�Z�n-�	�m�päAL,��b�2m`y+uv�Q9��<�9��%% W�9�����5�ˢ)n/��0˪q�U�pS������돕�oOX�L`��������<���+S7UE�BV���6��l�b�a��^�vEt��0��ã��]h@�bxI����m�B�[�lB���n��k��	@2>�5_�!|޼�ѓj�pv5���A/5�w�t�AgDƒ�f�%a�Ub���)�VY)CbR�Y���mv�U�OC�(�c^^O1&���G�Ə���,�k�����wM�I�&�܋aqiы����<`��
bNDӖ�W���ej���˛�a�D)O�
�%s�'Y�
^��n�j�C�+ګR�0������{�L�.�p��)��jq��W�3�uv�U$G,�F	��v��p䓻�w��[ыO��nm��i����YdoEР �\�6y�����&�ܭ2���У/�R����SK��1Y�O�*07����mOI,Ct�F�`��U�P��ӬfŷFͺS%\�*ólC�ًWl�kk�ĲL���(·��(����<�C�
�A�}���)�7���!-��9����JaY�mocu���ض�F".,�Q�����Ώ��7�`<�a���r�<�q�cЕZ$o�}��l<U?�b9[�q�b,-JSw4e0C/_�D܏`�#��!�G�%_��(�#+x�*��)�w�*��~���Yv3�X)��=��t��s_��P�G!	�B@�8�'��6%,��48���Ha\�F�h���m�ѓ:~kW4��,��Nh�G���nt���j-<�9���<�y+|�F�Ml-41��C5��mKw'J����>��\����������H����|�Zv da�M���jx{v}5��{֔ˣ��>("�6S�����H�_O�8o`��7��ׁ�����7��PP�T+H�@�x20l��#�AMJ�]wE~�5`��/���~��!=?A�k�%��T������W�b��gA(a�lFR���l~�9U�Ux;x���o�^rw�V��NAŠS�����kYc?$Ly�B��P��y6���j�-~-Q}�}��
��/��iy�O��D�5�Zt�z�(ktl�P�h��J$[#������r���"u)~�����(�3��!��2'��V|����B�2O��!]`���a�	ۑ������&�Y�%��\�f����'���r6���!�7J���������:u�r�1� �:a�����u�
@��n��8�\É��ON���a������o6>�ϙ��w��8�>{�����͚���Ѽs�f,�Zc6-�1E�ʹ҂� �N�PBV>�����g]�4����Q����o� ���$�"Ɵ6XI��A�^T�\J��a���bCr�sE^��>�����~�~�m�3w�����Os�?    ���»S���B�g/�!b�S�EP���ƺ�uu��*f�~���y���B]��g�]!����i¡��KA�޺�WB(�P6��
�^�L�O��,���>V�m��uG/OE���&����S�ݵ*�FS8� I�M�{u,���'p�qv���d�ʠ(R�c�(Bgh��6Q鈂co0_?�C��ǵ[��Ze5���ĥ,���l��b�V1����ڍ��V��Z�����b��J�C��qF|#���[j��S�Ӈ5Z��S]��� ��3��Aڐj�O	o�.Q]o�R�������jjSz�\�`�%ꐐ� r�]�� ߈f9d�JL|?���0+h�Mhv�� ��z��&+���*���z�?��Ҍ�J���W��"��ؿ�ܽk^�"�tYW�
�t��o#�+�nv�����	�*gk A�M���Q���D�Df�q{zs�z��/����	�m������S4�y��/f!=\R�Iřˤ�_X�-��Y�����y_gr�c�y����_1�/�\^b�	U�@6�b��\���ˎ�߀%�*���6.���w�=+)��M�T���29b^Jd���ݧYL�f�]��4�ctt3���]�i�����������f6���2�2��O���1��@%��F�ݧ��
�,�k����i�ְI*C��a�m�G�W:W���u�x�-����i ����ۣ۽Pғ}!'��i�I�5(2$��=��X��4Q&���0K?�:�����=	�^���P�'�鯒cI*޽�4V �lbnc�+W	�O����,f�q�ۣ۳q���6��>^���R�.�1�b~��Y�̓���H��@톌Uj�Yf��ݽ;\�#.���V��Jw�����5���9�0�,�^� �9��J��-p~y���{BP[��Ƃ"�.le�U���;W��L�#x��,���^<�yҎVȖl/����s́���>F(n�������/��K-�,L'�Y���x�V*��3��ŕ2�j0V�ju��`E�JW|?�Z�� �l�l��j�S����)�/�*w`}�4Rbq�f*�Ή�G�tb�^災����XIY��)+|�D'�9޴�cK�F���hl1��J�Y��+� �	�X�c���Ύ?�o��p��/�L���ւ�oĉ�1�'��;�X�[T��g/$�5i�L�O�IL�3���Y�b�ܼyO��V��"�����z�w�ޙ~c��k9���-�t�p��7mDw�.z�4=�`9h��2Fr�+����p@.'���FW$�W$w��̻w�����kY��'�D�X�������`�#|�J�:@K�	��|��ml�Ҟo[�޾��~2��?�fd>6��[��i`ް}��o���gcg3U��,�w�s�0{�������a�x��2�4`P�TVkEA���[�X/]đ���Φ��3H\��0��7�tA�1�Z�b���d��z�H�4�!=��K���3��k����ڽ�WOr;��3����V�hg��o��'Yf}�n����g�K	+�U,��u�h����L�8�H ������@��$~l H�1O�������혁�~M�U�J�9��ʞ�·�k�b������l�{�\�pM)P�RVL�#<�ׅ��T��U���
�I�a����m��uTJ�q�|�AG�\�������UG�e��:A ��.�=4ak[�k���z�*ϵTPe�tj��w�F^?���N��ɾ�}��/XUl��(�<G�0bI�%Gm}�/�����Q�e ����C� !hAZ��AU��o����i��bǔ��h��w���B�+D�_�0U��o��X��O��wh�~��ךzd�4��{Va���&��"��<Llܡx�E��Osh�;=�v��_��U���ق��b�$�K`��ׄQ=ɐL/�d���f��̭��8�b�\���z,��wu{�ex҅ґ� #}�G���O:��O:��Igj'<�j����,�<�D�']�W�&��,��+"�%���I5>�9i�l�G�5�|�k�+�r���W��I�;=���<����3V?�b)Î��_Q2�<yd��.g����UhΏ�別%��au���儦h����"��fь��X����~ηDS�n�L�O�h�в�2��S4�iM�����y�O#��z�BQ|w��<�H䛲8[&K�=�e�~>�<>���Rvnf��U=1'�Hʖq�ĺ��(.dr�B�j�_U�ݸ��d9z��MȽ0�������B~z��B�I)M�逸Џ~��p۳ʼoV�eEQ?�B�FĦ��w� V�U70ǐ�
�[��z�X��|��q
2@�o���邦��Mpܮ�=-���o�M*ɧ�ײ@ߔ!�ݨ�6�:o?x��H%X�]b
���l�I�EŁW>m-5�V��dy�*�~le�����`���5����ˊ4L
�oE�5�Aĥ�u��C.x` ;��`lEh,e�i=��!���>񭁧'�[/�95c�}5�����ln��x���>થjpՀ+��̶W��;��}Z~�o���?H�\v�7m��!E}����~Fh3�m�.`Vx�&�wS,4���\]�����)p8��*�����Y�ݐ�R���@�͚ž*zo���z0C-�L_����(#�R؂���[)��_\���m*78�`"�`
�P��8�&�캫���x*}1��(K�wD�>�Dt���Q,^R/r��N�;"�l�+������dh���
�\�J}@֜s$��	�]󳮧-�1AF}OS��?�}��q�0xS��[�ʦ�T�/f�~)����9�<�Xf,V�&n������c5[�7�]��ԥ�3�YHOc`��
)f�+������ŘTD�Z��n�u��H�*�o�E�y!䛢��d�o�^Ѩl�Z��<����j�~��,;��+�Wc6�y!�;n�1�öܒt`���Vu ��W��sq�� u��[C��aٟ�Yi}Q ��u=ˬ/B[�oOp�vhLo<��}�,�O��'��_��j�ٚ�35
�[�
S���6����h �|����]�<�U`9K�Yr����:!�k��`�h�Ey�:T��A(EI��5{u�o$ݩ��doC�NVư�"�0LI���f	0Y��a�0p����g��%Xd���b�y�0y�/����~0\�R^Q:����U8=�3�q��d��T|�m��ow��_�5ǟ_\LmCɥ@^�ȷ��h��W]���-y����s��h�uEY�*��`0Đw���dfٍ���JLG�F�^ρ���f�E�FI��6{d ��r�/�dp���h�^N�K�;���Z�O7�Ӭ.�������0c�/H�}��%o}���+Ьr���C�s�辂����٧��[�X:T��E�.�tH��a����ڨ[�I���Hq�������a��>_�}�Ы{�9�К9gQ�R��
:�2�sIZ)��(�cဥIXҁ��%_x��%4���,�^�&��i�xEf��ϋ���_���#th|�~�����d�qn�x�a"��8���,6��+��W�������$�ZƧ*4d�.� F/��+�'�w��W����l����'������i�K������C�=��	.$��,�L²����n:��R���c�[�LS7�)�sq�psٵ%�푆�7���KP]���Bwz(}5����* rV�o^qrۍ�>�%��`��%j�F��������sއ��b�0���s��s��������^���V��(6�:C��>L��w~����̲��.��	�߸&�H]�)
��e�|��}�Mc��
�&M���z���e�Z���L��/�ל&<`���Զ�m��C�;��Oα9f�?�����ˬ7�^/]���Ӵ�7|V���&��茰%$ֈ���ˊ1����\*K9��/��x�gSAS��J�l������n��~>����_��X��ŬJ�����F�JX�O�RFB�Uw��    ��#��c�t���?'�{H�BD8�	�J��|#[�Lf�q;�T�O���G?��7 �^�=�Ǉ�����zuG���^y������	_p�/@
T�>���L,���F
S`�<� @�&Iw\b��+���Ś����lj��,Ưd�Kf'%�V�h�jO��)�0s�iP�4��	8�E2�e,7%C	1�l�COF�����o������w��غ3�>�;mw�na�.H��{~��F_��F��� =6����1*	����HRC��HAHQ�?%֝��q�֤.�?a9�h7� җ��M}�za&��*_�B�IE�./M�"R&����� �F�Vewz�H$�y7E>4�61�X�A� �&�#W 6��R2�e��S��a��a 4D%���I/�NH�Y�������B������b6i^h���q&Q
x�vw�J���;�b�I�������tq��~�=����3�,S� ���9�$�\�7������Κ�5wKpW�����Ǐ��P�:�������u����\v}��7Z̾M���~���B\�ӧ�㺗�o��o��_�ܸ���ڑ�$i�+R��N;y~�B�ry̺���>h�]S�"�2:x�T����(d#"l�imv��}8� ������O����ԥ�"��ɝ/��xbB�V�]Yoa�7�(�Ŵe��-.���+����8^���|��Y�ŏ%v�������n%�e7�mk?�<�/Ļ_��"�Ժ��^\ⷧY�b�p����?(�U�bμ�O��50�˶@bLˬĴ��b�����S;��ģE�j
W�H������W�s4�ѽY�b�!�2~��E���Imڐ����G�bw'1��&zٵ����e�ҤK�z׋���?@h��ؕp8}�������Tj�Ｃ�5��A-����UYN �`7��=�{�-�@˧/�~��_'����COi� 0EX��d��nxIc����$៦=O��ĵg��ak"ɷWJ�ʼy�ِ�)o·KI���؊���i�kS�����H˩��EF���������6|�	�o�\�
�\�ӴS[�D����*Z}�eW0]�'�7�U���\�
�Zs�Q����e�c����;6���Ae���>W��ܮ��1{K�
��'�D�ڂٕ���rj$XOa6c�r�)S`���^ ���f�0lS��W��.$b��Ŀ���ꂭt܍_������Y�/X�uM�T+V
/|J�:�h_{�xO�wx�?SQ���m!���;:�j98Z8�C��3g����p�����C���|ÖX?�*|�$�RU���d{RudV��3v-����?�o�OӲ��j�N�� �RI�7�Ob"V!/�J��34R(�|���Ƚ)pȴ�d�a����o��G�zHVֻ?d����C�*�m�{�3,M���v.C��.N��8�X�캣R���9X�%*~^�EaU�X�m�s��G@�����&RDZ!㨙沉���x��c,�3�dC��㻽���*g@���܊�����1x����$�(��uG��������
���.}�Q�RF��G�%�^u���r+��z�8�����h!����/�
G�Y��_n�뎸���5������l�XN�	�ԆWsB�����Y��Z����
{?,=�|��+y�Ǉ4�[;m��RQ���>zY�8��lܝ�����?~~|�~���U�Z�s���`Z���~S�v{W4��!�T4v��v<�w���&��I��{�E}/�Wm1H� �4�$�����@��h"2�F�O�������wW��v�����<T�4ϳh_�
_o��J���έ#�v#�y�����x�}$�)��`#��7V���5�n��G�鞲4�I�+�T����hQ_s725lE�<���T�Xw���Z�I_ m*���G�6��ue=�;.+l��J"v��SL����ٟ� yr�<�w4��}MK���ϯ��@/+�ޗ;�2vN�4�]��M0c)�㋒�Bp�1[�Zw�߻jp��˴ �����2�PC���
d<{�P���/���o�ib��A@��C������8,��b�}�3|�ȯ�o�uo<�y9_�~<�
��yW|o�*����T],�U`��\2���B���'�i�� ��u�� ��#J�輑]�(wf��n/ͤ� >�n)�?�@�F��v�]���̺myW/������<��Y%L���+]��ؿ��J���,nuJ#1\f�1��v�j���Y�Gj�俓x�(`�Ѷ�Y�1�<H ����F3Jwt�A}���+�ov�[S�U4γ0ߚ���f����h48��?�Q��7v3K�!����&Ή�y����F57a��r��M��58��Ϋ���:rFZL��P���bl�]��N��q
�,��)
�j��4��9����7�G�
�.��:��p%g�\�,�����Rc;9y\�˛cf��cy��8>ڋ��\{Q�!Ԯ5�P��� ��Z��s�Y|D�� 3� �1LD�4��(� a)�Tπ@�!p��iWІ&@��w╩��:UTld�~�������D�;�$)�d{�	h�5�+Pg��|�Ѱ,��
��ХԺ#û׺�Q�B�׺����U�'�ըZYQz�GMІ^�}�' 8[̭��5��6V5V6�s��{K.��\�U�ɚ�eB�Z�R�h���aK��溣G�ۇ"_��kYX?�(X6�:p�g[�	�]#���rqJp�X܋2ˎ��G����W8d��WQ.K3��u������K��hjA�ܽT�#�ri����,��]q;�����.ј�_�o���!�m�W󨞠!�
n\�uܥ����$�	�d�}��7��������|�?���@ٞ�PqX�S��Q�(���R�͉򞥪i�A9�3�����w���w������6rf>�����91�L�u��`r�W0mu��@	�*�?�!�\w����jz?ǆ�G����4��bjҪ����P^__���[��I���Xe�YȂԖ�Qj��׮w�?<B�����������3}�=O�u��|�H����ci
[4Io|MҫP��0ز�F�Iل�s �m�zy~���EI���ɵ�eW��MYf���c�1}5��J�9(I�@�ֆ�n��U	>}�=L������_����\wE�����<M�x#�c{5���E������-+q>w�Є���MoB6��[�h���^����谫��Plu�e��uN���]1����[b���sO�S�����mM,*�Pz�b�RX�{ǳ�#�,=<Mf�E�v����}���c��O�	X�ճ4&�M0+�L�4��C���U��=a8�B�i䦉���1�%~�zC4γ��%��ڱ&���?��g�CM��	kА%��Ն�$/Q.�� �8Y��	�Y"�q&�;v�z��o�_}��R��l����{����;��`��`�&�@�e`�|�*�K�����d���M����[[a�Ò-�w��W��$���֣"�y!�$�ݑ�`�ؒ^y�]�oI?�U.�s
�l�2:6ѧ�QC݋
�t
��������{!�"~Z�j����z�:��&��,��@z+�t��(L)WHH�%D�h'�	Q��SE#P@-p�[������E���&����XY��=X���3i��f`�H��> ���ؿ���ÛQ��ht�?<��Y���9�H������/(��n���E���t� �I�kӐo��?5�Һ��NlL�R8�p�#��k�m�*���mG~�>ԋ|U�p��ۆ��oܙ��sǎ"֓�3�8GU�J��!S�6R��6K�y�{�G�Ë�볫�G�����rFD���C���{����dK�9�"���^d�g�G�8�AjZ��q��sxE�� �,�׷osw̎ H*+����L9
�a0�q��T'W��k�_����u�Q�ϧ���n��)P_4�|R元Ǩ�����ۍJP�&�10�ս�+SH��JC*V��K[�$�JB�i�{}N:0e��V-3�S9��y�e*�    ��V�Y�;��n�K=�]k�!t���F=3�QR.ڋr [6#�S*da59(T��-�_�4*�:�P��ӎ���`#R|���b��h1W��ק;�{1��w.�6�Qf�4���g?^��qу�L�y��S��/��PiQH�BϽW*ΒR�!��
KAAryb�P7D��^�uH���L�
��;��lqx��^�~ٽ��߬ڇc�"�Z!�����h��х�^!ƺ\{�t�������4ςx�A�:�	�7���p�F9��79x4�����r�����-.�h��#�$�xo2 c�*Q+�R=�n?qu�k���ӫ�w;a$#x.C�
sх-�N9*R]fϺ��,c��s�	���cwN���F6Qnop[��7K���cT�y��SN�B�<T��x��:��OhY��Ɔ�hK��gke>���)U|#����)�U�"�	�!Kc�G��d��y`�Y�?d��q����B�6-�F���`|��T�Bz��X�;�Or��j����ڬ�%�2܏E��`��ĭ�x�Q��v$��(J�y�#
j�5���':�{�������?xwp|v~rpz�B�Cf�|�*�VY�	�1�������a���la�	�׋��A��s���F^R�D!-0�)XR��YN+U}��j﷪/s0�I$���ƿ�h�:29%.�-틳��63�0T'�JK(���J�Ҽ�ઠ@��4S�W��1ës�����������Kp��?����_��b����K�K�$�o)=v�i_�o`nv��	���[2�n���Y{ڊ`Z�B$�A� 4M'�U�=�iɕ���l�?ɀŀK��Џ��f��	PC��Ha<�*�e�v2B�pev=�S�X��w��Mq�&9�"��=3�=�bJ'�ih׳����]��ع�᭴���o������LX�.aAaaQG6�4e�x�zL���NE10R����f���[��M�,��˄3l�&���,c�R���UC�-��˺o5Q�_�]�d�w*'�/�A���<�	�(�,�W[$�6��&eE30/�~��f�#G&аT�f�; �M*��θ���k��Z��o�\4��x�:ʢ�)�6��\S^U����ܨ*xFޅ�o2$v�kG��(�	E��.���2����������O}�SYt�5Z�S����� �mxj�AȆ.�z=���p^�)9�B#��3Y�$K�q���_�/����gY]��&��Fa��:���C>잤H�`�����$D;��$��K��r�6~e{(�yߩ�D���.�]m<����E>�(�1��^S�H��o���D��L�@�.����
��4a�	���_��^lq���S@&��Տ�]�DG��F�y��J��v��b1k�F�|��HG裏�J��u|�}��5��[0mEY�L�+�-�7�k
�%��������A1�Ba�COKƅ�!�Ἃ�����!��j]x�ƄȐ�*�+�������>.�w�7˟7�AsN�6_.�+=(�/E�?U:����GD�$�E���KU$�$� ��h�5sW�&F�P�xn%t.�,���+NE��X2�UV1\ŭ��'�*���������"���<�rҚI #h�#�J��a��gp�
�ح*�R9���̼nxog�w?����^{��}t���=���k��bj@��L�y�PK��y�{��j�;���ڍ��_so��p�������N��j��9t����y�<����H�%;���l�������k��cG*bi]��V2�c@2۱��� �)���82��S�VK�k�z���[OE����~���R��8�C���Y�N᪚5�v/*�Zw��Lco���#�����W����\b�:p����e�{1�~� �F�M�3IOL�b����2���w���?��>˾x-�콤�f���+�Q�M��Ш��G�V]�6EɓO���̛u�Yִ���~;D�N���/Ч�CCn�C�u�l��}䷝��~_�}���*���39����k��O0��
��� x7uo�-����<I�C-�-R�����"�����,;�z/pf���Ei�=j���#�~��7��.M�7Ҭ�}3Ζ+b�Y'�ځ_�"��5��L��5��l3�߇D���7��?
6!�d���-�r.h|���g��FOު�+���z;�7<�?��yW�*�x�S��cs��]� o�V�P�|�8�^3��8�%���B�mb�6��HM�V)��,d��5���檠����[C�Oc9�������������������^��	�����U������p����7/��S�<n�h:����ڬ���Y�G�=At�b�2�w[X� �s�}�j�Ȳ��*�HQia���ܖ�f^��B��鏬��_�[��5iұ,kۇ����|�ZT�?�v�1��ژ^���DOL)��w�D�,���Ϸ����	SY���Or��#n���V1��sc���������6� *��,��i���������r��B^q��Z�Z�/vN ��1��4�'���g���묖H���T�88�z�
-��,
�K��%&���+K<�]p��)��(�EQQ^�������1�O�e0xC x�'�b�е�rΊ�`>�I|џ��7G�G��0
'9>�x��Ɔ��bh�m8F�8x�L����#n6�m'�X���З�粺��wX���T|�&p�2E��Vo�"(G��̮߫'FFN9�@gz�4Cp�"R���FY}*��J�r|�Vb�[O�S��������3h�i�!�T�e�
���R��ҥ��.m�ɨ8����KI����~�-�y��#X
�N�-e�eDQ����+~j]6�:ʃh���>D� qGDbMz:�%VZ
�Y/kJ@�˩((��̓�V�oQ]�H��#�ZV��w���ht]�7`ir���)��Z�mt�"3�jL�4�l$��=�deϚ�9�;�k���g���$��'s�*U�,�ۏw ,�Ùuĕ��g�����݉4���y��gp#vfD z���U.D��S���da]����r���*�.�~iKI�c�fԈ0X�C��PnP�O����Y�/W7�@�v�G/Vu�8
JJf�@-���m\c���5'��c��
5s�oG-���x�~[o��w��%j�v*Q�퓟�\��-���1�N�i�)��uq��Y���P#��t�V�a��d��J/��].��q�3�&�o��?̑��C�1\3�=���n+\3�������Q#�[4�w��S;�s$�ˢ�����ܡL#|UA�/'�U�^�_}��c�p��ͣ]}ʯ�O��Z��œ�� "}��|�u��b�=�������dںXD���H18�Tsˉ�1�Ǻ[�'�N��y\�6Q�)�}�h��Q�N+�s����2(<����z�H��e�s	��ah8/,���2ô[mx]��;���7_��E�,��|J>p���H�`*΃��僐y`
�D��ru��`f(7i1���%z\c�$�@׌W36��|�`N}�=��`�S%�qK`KQAq�
;j�û�����X[�s{��7�fJ�$�Yvu �4g֔��
@�G�%�c������mԙn�8��ұUq̟o���(F��K۔,k��a��(������ѵx�i����(�P��k�qh�6�����]y��v��y�K�(=�{%�F�Qd��_��oa,~�['�g�y�S�Q��!gx\<����H<el[Ic���A�ʼm��;�����j��A���C 8��7� !=��v��f*�e{Ne�ݯ&�F��]n�5����7۴+�y>�`H��0�ߓ�����:�>�Bۆ�#�&��6:S��M��7۹��rk7x0��,��G�7c&��hGҨ\ı%�;Ǉ;[�`��,�^��T8F�O����(�h
�����[� f�6�},a��w�3�=�o;��E�蝮>5�]����=W �e��N~�V1��]�X�    �\5-���(;�ױ2/�l���)�]��1�q�	Q\Y׺��@�ڤ]�/=�L	�%ԩ�,^��ȁx>F��.���={V����h�,/��"�"?O�Pꚍ:���o�0�ۖ��eꉵ�����h%�;��������%I�i�$��"/QZ*�u��8X�T`�#������qT_�|�#<ϋ�3�Bo��tF�ʜ;��X��zb���e{ G�8��m=m�$�C"�Ɔ-�q8��c<�&MUfΔ����=`���'�>�;�՞S9Hq��j����m>QWG�w嵅���D+	D���J:����������S9q� �{j�v�Q��m@�1�VA*���c�W�ػ�a��Q�y�nf0�*�#�V�t
Q�	�PG�ᰘ����w����Y<��L�|>����1�G�;�H��b�o�PU1i�N=OV�k��� αGy7���w��E<G\�mL��H�rN0�I�r!W`a�2��k8�C�&=ۈ��o����W��CH|�7ļ�e�`�66�����1�n��҆�n���V#Z�~
��<�Dd'S]�w���b��FVf�u�G�:,���n���]/���?���	���廦�z�|,�����_����aZ�}����P��b|߀+�M9T���r�!��M�RĻ��������w�P�[�+c2�iְŅ� o���ތr9��4�Z({5ز��w<��u�����7G��2�S�T'�]Nݷ�g��=���p�4�,?�K?��]8��!]���Cb.%~QH"�@qI�ją�����S����#�A?3[�\������������7ۤ��fu��t�;j�~��a�*�(ӣ�y��X��~ޅ-����s�����֚���Q�@SG��MV��r����Q�Hn����\#�����]���s�H����4�#�И��İm�B5��N�2b*�1�'߬���×{4����u,��ɠN߯M�evk?S�3~ �J�6�m_�0�Z/���T�x�/���W�ǯ��o�^�^n-.����{g'�;�g�0�ם���DZ�y{�o�Ef�i
���Ac�AQ�fګb�$O>� �|���d�)����u�f����a�wȜ�j�V(�/N�� �(->!:��&H�/@}$}ҼӚAr�����ۯ���K2N�bcR���1�i���PkAe��˒�LYP7�(��E�4'��Pe:�dE(>���������v�p��Ȩ�sr �O���<9.���́���x%X�v�"���y�? �ݏ������?A�0O����(4�5�u=���T���,xl�������&(G�v}NX�DN����
	�[!���X'�]6x��n��t�5���%Ya+b�w�m�A��"	+	*Q�jo|�0�Z�*	�iH]>�F���v�^��6���([uZ��2�ƎUqt`$�����E�T(���h��QT-0����@dC�Й���� �tR��ƃ�E�؞jM����KB_��o<u��T�L���;���?��T{FY6��g\Qt�!D�-�����џ�M��+9;}8��7x����������z��f����g�܀����� �G���06��YC&w e������W��c|RVC63����a&Cn=�Y�[���Z����jH${zG�i����?���X����
��X�n�0.��F�Y#�i҈C	��e�Y-���������������mS	/�?��p�`�W'�EY�R۳�ö1|�u0���:�]��ȫ�X�^l����e��B��C\&��Q9�P�ǃ�<�^F�^"=o���}\h��Z���8;��&�]�\g�_�zW=y�`Դ���xN������xi#B+���~-��֫a��L�8�QQG���.�gun�F�V���G�#����S�����F4�A�$��gF�Pd*��x����W�tf ����g4~���#keA=�&��]P���u�s�� ���9���XV�e���׾XϘPO���k߆���6� ��̬�},�_�i���zZ(�?�/���'�u�g޶�Z,^�4*r�?́|����M�Pw�:�1̝Q��c�����^�&�����t��7*@�*���H$�KT����A+"1�-�T3cu���.�B�-���u%�����'��~������TQ��<?�s�M>�V�����\�<d�M;Gqֆ�F�{�YK���H�w��dHU�&�3�:��Sy/��[������ ̺��,K&NW�œ+&j��%8��j4�l�v������q����UQ���}�^����7�%����e��[Ȩ[B��j�����a��P*Z��X���&2rS*t�h��>:�9R�4y/�o�N��]O�W
�e�g�w�=@>i�ZQ��6��c�i3�)��b����ҿ���~�)
a�����C�o�Y4��;��O��.��;�׊m�6�[�P��X�	:EM�i�sg�g���ڡ�N09����ε�qC��	8����(�CǤ��)������8�����9��f&�1Qмj4�$ϚW]u�tPE��bVKYҰ���^?{h�d]p\N!
So�РgL]�Uv̄�4z>0~������M��6��|"R�8���2�jlF���u���d�-�='rҋo�8V3�;!��LCz�a�ɉ�@Nc�,��C�X����&�����B�\��È�$aj�$��eT�e��v�s���ۧ��qF��Q���(Y��%5�D��P�F�^Bc����n/���+j;
���܇�� ��N�w8\��9���&�sEUۂ��p���c4 �ބ��"��]@�\`�C�Z�MΡ!�(%"��7���#�Pʨ��9�q��t~�l)�`��M�m;��8�FM]�"��
*{A&RU�h���=Ɓ? k�yB�݇=Y����|}�̳�%	���b�`f��dEl���D��m!(J��᎛�Wb���#t:nj���/�@�,��^�v�*.sAs�YB�L[�.��zr&���9���q$��s0�Iw��я+�J�#(��ud1̖��䤉	�4���u��(�W�:M��J,42�w��������ُ�߯��G�t����[�)�N����/�"'�WG=4�U�oe�����V�*�G�f!��Ѣ2����hx�08�*(ũ$��*���7s2�xY��?�-]�$��ƃ��̌��qG�F�������X2J_	��R^Û���c�~�����֫����=�����0�9�A�%��d"ƬJr��'"0�F��W�8���F:�C���a<�B��D�Ug��U���j���r��O/(�B?OBv��v��K"������8��,o�JB�g�IF$�;1�&ʢ.ʛݓ7'b�89?;H�j���K^\!�m9%�1�,��g�a��4[q� ���~�e��z�k~��,6<����L��8� �d��N�s]�L4�y��1S��7�c4ޜ�W�'x�����D���}�i�}�ro�Q���1�ػ��j1z��U�\�����
���9�hBt$������Ӻ>_����������ãy�1�{i̝��kQU`��}�Q�������K�@]�s�ڃ����������ߠ]7獫z��Q�c!����1HgDh����bիqeն��%|=��F��u��||�����������j����l�DV�����S�I�$3U��0b܏�R�"��e���^�op��sy{�O��/��O�0L�b�h�b��zPY9c\qQ��YO�0'r��������U��Ƚ�v-�i�Ú����Qس �UhH�CqMG�ט����?�����9��fI�bJ0i#��Y
[6)i��6���nN΋n�N����{^T�|œ8��E��E��>i_�l�D]E��P6�)�$B�<M�6T�mB\����2���`����~���s"�,���;� ~"WcS�����%Y<K$�H,P��a�cb�l��[����Gs98��r�e���/�?��n���;�#$Z7$���k�g?����g)�=�,��9�    -���ko�8��  E��ѕ˧�>V�a���AĆ?�n��l��s���Ĺ�uT6p	��ѵ.Z?�㸄Z�2!	:Oe"�nW�~���H�z�x�� K��,�:.*��[N5ԛ���tU�,��N�Ǌ*\��(��YO�]�QвW��ɩ|���������e.��k�Q-���s�o�o=�� �zEI��*C�P[o�F������9*�W�1�a9F��Sq��H^F�	�pOh�	��ƺ����_��@����On�aiL�c,�X�nޡ�R
��#JLiG~)���*��[O����{��(���UVJ�]�r��߭W�mt`ь������C'1���#qc��(�O�	't�F���r뉶��K����q������%��ܰz`�4M��ͪ�
X��C*	!��Վ�3�Ba�@�0k���#g~8�g�w7����]��~+��3��Ⱦ�UM�6��f��X\K�)2����B��	��eV�@S�J#T�IYyn=�	�C��Q;wo:�Y��lRƾN?����;�7���0x���))7�`:�W��"�����%v'C�"���áN>�o��8?�]>}�ñ?Pm�kԫ 3���Mp��3�,�>��I� � w���)�"�^Mh�|Z���D�55��jb���Vʖ?��� ��v����2�H����56"��)QdIM`��߰�* �C��V�Jؙ����+�b(��򝢞_��|�/����lw�t+�i����,��ֶ�.uo���$�*;�w�XFs6�����[T��A�qdԎ�]��YO��u�e�D�#^��H'�x��y]e ���*�7AU:LFC�Q�H��4��9D�l��УG
 �5b8�F�D�}�f;;/�N��\_f�W|%T��ik����^���������kOupF2��p�3%͎Չ��62cR#>G���z�}�u�b�����o�_<\/��}����Fhw��T�Uf&&��:`T�������#�Z��%��*7ڈT��F�,,�]��W'f�a������4��Uߩ����5~���}1;^������^]��_���Қ�n��5��'��v�o'�����������X��P	@z���1���sˉ��B۶2��Y������4����Q,��i�S��ς�$b�i4�V9M�����D�p�@jl�O������۶�D�z(�ƷS^�Y�'.��S��3e�qe6��e�3+B�wh�&�RL��X���1�u���~*����������^>T�&6_�[�:o�2Y׿x��kd	�tZcr����~�C��M���U�m�g�g�ݯ�c5�	�b[Ӌ�S���
T�`���"�,4[0���9i��DU��l-?I�d����Dg����� k~�r��,u��e,��K���l����;.���,1�e�zS.D���o���]�4
T��z`��39z/�����``�燋���4�}����|�9*Fxa�	��Oq�F5uB����la�*JK1 Fz1/B�! ��ыw��F��gA~�Py��	G���h�t�o��.����#H�)����߄͈.���d��$�/*��k�D��
��+�\Ox�L�j��|��vue-�3+kG�0�����Z�F�ɰmԪ�m?t9��"�����ܛ��V�>.�w�7˟7q8�����l��Õe��x�(��R4��S�f�&���e�}�~HDa���#D�x�A���s���d`��������b_�����y��z�%���l�O���<h�p�z�汸/����q���%��ox^!?����_��N`Lk�����c�^��-Ϯ�bzh�<�������-���)Rٰ�z ddc5晜���K܅��˰�:��
Ӣ3ČwOdA[����S�T8��:��M�}S�h0�Ui�s�᫳�Q�KI��ex_��f�]|7hD��9)�V�������M��}C`���)V=�F��"�"��������{;H��[פ.�W�B͔���%�
�^oVgT�;��Ko ��}X�o��c�)�CQ:;g�>��3������+�W������������ӝ����w�˓���9q�yO�1��.����&l&�Z��V��@��P�����I��XD'���Đwp� ��b���G_�t�c}��p���Nc����K�@%��H�4����F<Y?���wL��M�"V⒏��`�z�9:.Q��������(^D���)�@$rД>�Ȃ9MC�$�~�r���l���{���Km�=h���y���=8n�9Z��� =��+����X�v|�s�0�~�u���m�*���GPW�!x.A�MU#7����]~4���Nu>Q�o�e�b~7���)����/=V3�jľ�D`��$U!M�c�����p���j���=m�ΰ����+�?fh�c�#��fFS��k�q�5/�� (@F�~�Б�h�#�1�X���XQܽP�S�p����o�D���k�������|-��	���jg#3kx�����j[%�V	�����	�1���UB��+!c�D�+L=J�1��n�gΤ�;���B�!�	�h���l���.BK<;�Ck��M���D;��+�{-��q�3�F����������Gy)�5�Ȩ˓��&F#
��T�a�A��(����?$"#���XQv�y�T�RVi�۹�DE�a�C���'r2�o�=&�d�Kza\u�iT�K�B��QƐ�q^k�@ɿNT/��$�A	�Ve�e�����VХ����z��-�{"����6f�f�ouFܜ����J���0A�1,Un���.pOȕ� (��x,S���7G0���9l?�z5���;!M,���f[<Z���6k!�� ����>+B{��0�O
��[�+]��P�|"Y.��FBmH5|��W��e���C���{2�m?.�POvt�Tͣb���u����&C{D_y��_������Ko���E�ԝ�=bF#�4��Q����p%�ä��Rb���E��D!>��V��l?ȼT��ɏx���:6���A]�ͥ�T��h@��
��PI�J]F���X�t%w�?��>"f�l�P����ݒ��!h\�%L�^��5�=��T���'}�D�řN
s2 ���1SY�% Ra04��7\;K�e�y��|s��#��N�����M�)4����T�=ٹhb�[6Bؙ/�q&�]W#��M��#�mL�l�T�9N�֓,��W�G�QT����|w�m��{�_6÷�/�0������۴�232����D#���lt��b*K�AM޹-� ό��i��3�+�Y���	9����c;�=��$�&����)��;S��0U����s��vf9L�����,�V%0��\0Tkn~�y��gS���	)��tf9L'����Ȃ��.��^�;7�5�q�tT�������~�YNs�#���>�j�oG0� �Nj=Je�E���XR��I����6�R#^�z�t��r:����yX$<� ��B��i0����Ye0/��pj��ކ�2����A�֔�c�� J��;���8ՙx0���{N@T�¥�ff�K��}멀���������ҷ#�C�
i�B5*�Z=�8��Y ��Bu�^��S���YNS���-�������� �2:9R��OXF�o���>�p��d�J�Qg9L�϶�k�6ktҷ#�CF�w�Us,�`�e�-`�EBMf�S���][�ڬ�IߎXٜއj�K0��L2���:˩`���mN��9���!���Ft���"|�4�-JS�)*�i*M�^N���ێ������N9���|��"������� �I
�F�l�r*�O��m�\H.|;���d�)�Ƽ艪$ƒ~��bކ�,%�,�S�/���Ů�%��y��L=$�Np5����Z31?T`Ra��NC�/R��R�\v=��ˣ�q�mGb�>&};b:�c2>r�S���u�gx�9BIh�4    R�LY�ڳ��������,<���wx�﷩�w~v�?_�Zl���n����v��?@�{?�Z8f
iXR�3�'��QB#,"�����^��/O�D�௾�a�Bԓ�{�s���kUЎ�D'���?��p�D�캋��y�e��ڂ�ӱ�:���/��|I;�K����#�p����j	4\�+�%�;C9��z�+��qu:���+��\I;�PJ�1�z�lv����`O�T%�re��0W�8z�S1�k��k���ɽ�O�!�[�|�nΚ�#�Y�4��fd2���G�z������]ۚw^�~�*�p*CY>*`ܬ�տRb_��*V�b���F�A�Zwm��\�D������q9*��(�L]�-��$6<� �E%���T@;�6�܀{y��K7��@�H�&��w��׮�Qe{�S�|�އ\Gb�˗ɿt�����c�7�x��xE�S��%ﮧ�yԑ϶�,��R>-x����׌�x��<���1<T%�Jw���A�C_G�#��=�=.�s�������P�7�)�-��גv;�����td���z��n0��5���O�QC;YN�~"���i+���Ή,��1��� ���Q��e�f��4���
Y9Ch����Է�����y^$<�O�Q��k�+>n{G��f�/�]k��>�[�F�wOd!}k�C�������iY�§:�gQ��%w�Lrt����7{w�F��T�y$���{2�)�B�J;d"�hN풎��pq���&#-�@�������N�ҵ���Y�04�(11z��v~�BL}�bz�k�P��'����lBۨN�Ρ�z��Ta+�ߊ�@�h�P'uз����1s2��Jت!l�Gb���Rx8zFlR�oJV=�Y�2����~�ۯ�Of�M�M��Al�F�VU���b�|��6�,���W5/t��)�������?�˛��0ô.��כ�Y0��؛���1����l��뇿�{{�s6����_[�R	^��G�Y�%�)�<��l���_	*c�s�������8ױDO%���� �Zb�Ԁ��>�C�/���C�r��6����?��\@��0����_~ȓ� OG�A��mM·49��qY@����puȑ����\��\��>�C�H�E�����;�����|�ZyY/q��1R�� �7����1���2���<��\��|�6O��&��g ��`����|�����ٖ(켁���y��e5����8���,�E�$h��T���硩���a!�3����[�`Qȼt�?�B��j��ҍaS���a��~���s�ژ����_(��mqLX������,D���0�B�ϯ�Kȃa��!�dmT��f$�A���7yr����&wC���������������G��V��l$ฬ�_~�[��ܶ%���[��$��>�������ǝsע�ѝ��-|7���he0�@5&ď�4�,n}Q��:g8�n��9Rb��Nc���?�� ��)�@�h��0jW�,g4�TH2�T��("�L�ޠ6�lW�g�������?�X��GF��s9b�p�@,ÏZ�n4�\7<r��сI�c�r*��r&:����t�_qoΕ3���19�:�;nvvv6'G�.?lǙ���o߷w
����� �Zq�u�L�%�8p���u���Q�Y�ǘ��Y�����Lt*TJ ,i,��UY��zR���s"[�XX�8��]�8�E�/��G�4�d��6�ł��9�5����p(�a�Ӱx���nS���β�!���=�a��A[��l�������ݠY�>�A��م�[�z� �O~-�waڀ�@�ڭn�э�w;�/w.��v^^���Z��a,�{���Ĺ�%�;뉢���lq�s��^�~ٽ�����پ3-�~q���盻�Ֆ�l��������������Z����C3��Sv�>\�����-�px���������:��g2f+��.�U��
7+�CE$�M�=<$�lv�c}����s"�����M�(Ӫɦ8�y#3^�ks��ΗH_�@��n��Rsk��3����F�+g�t�S��G�_����^ef��y�Yn���Nw �yԘ��qK.��U�I�52�� Z.uQ�����ײm�+Y#f�v���6��; ��dNІp�mN:K#,�f�n��=�L7��?͕{�o=k��l��8��J��@�Rc�B�3�i�w�Ud����a�՘o���6;?R�/��=2�!&����ë��/׷�F8�(��E����{�EO�-��vh���a�}OBT�RZIT��`J�lL�;�H��1hF�x̫�A�K�HB�.	6��`��r�IΎ��ss��3[_h�O2(_f��W)�r���U2U�\c�GY0�UC����k�B��/�z*�]����Dm���;V:���dNrq�JK�B�j	>��;Q��\�>nB<����|[�u�-�>���R��E>,
ftp�e�%�������C91?�Ԭ_����[֫bv�ro~q�X\�&|Eϙ,د��n�����~g7���h聹� �8�o������t�/���W�ǯ��o�^�^n-.����{g'�;��م1ڙ8{��}�T�[���H��`�aئ$�����)�����q�
�)����+oG�\����������Ϝ�j\)�pr���N8��h�p�k���!��D����3�5R�:�:#�w�!W^ci1Ӡd�Р���HK� �E}������A���w*'���90?�q!-�i.Y�;pkLh���w%#)U���rb(��@%��?b��t�Lǃ`��Z(���d8�pcuYt=�������z43�� �t�A�I/�w3���48�A�-�U���)�#0� ���*XMR7�����8�zW7r��[��#��N���J؄Й"�Hi�M�a[FZ�j����qC��K���BBN(�a��L
�j��06��k�L�44N�Ol����0\VA�ζ8�W�5�M� ���s�o��ݭ i1br`��H����x�#��[!�
�xg���������|��������?CP��l~7ĕb@�����G���(Yڿ�k��4�;������~N���L��F^�Lx�"A~�<��hK�ھ�me���1ىl;צ�����?~��F�[�b�IQ6�q�~��gn�+���Ś�9I|�.�7<��=Quea�Y�qRf<Is0Q��-���L�J
�ud�������vaV� �A�Sal]�9k�CW���� �ᩨ�͊�A��ĢV�#?��w���4\s/�x`�ǌ[KrO#���U̬�H 6��]�|��/xׂV}����"��QM��=@��"+)�C�Im�)�ԌX��)	���e���K���>}y�S���z��0��S�	�b0$:EWGq�a�B�1(����<�P$皩*�DcV�멐*�8���f�߰4��\V�˰"�����a�!`�G!pM!��r%�,?�8v"��Q�ySC9W�A=6�Yx�l1���T���M�����-�^3U����w.ka�*�r[ �k���h�yQ����d�DC��	�2�nLP�"�Z�"�,':�/wu+��;�Y��m�?-�_�N�X�#zL5ьOL��d@��p��uC�5�(��0K4W�[�|�A��F��q��9b����д�T�b��^(S�>�V������*&�H6�fK�'a.�{���E�s@8c�쏾�T��2�]X�;r�<����&���KYZ
9�T���p)ə��4������+o(��W�>�i�WidQ<�����.82�1�����!��u�9�]O��{8����z���~sw���W�׿�s����Y��ee�$������j7~q���q�]�R�6�ﶧ�r�}S
v�d���LH)�r�D�N�&�������tv=x'f�w?�������ZG'?n�?_�Z�b�,��b��.c,�ݍ��ހ� �nt��wӬ�2iggZ�T(ĄP�0    �o=�+Yȟw_�?�˪�hT�Қ��V�<6AV�@������DYm>DU��t�Yl��eK>]�L9K�g=�֛��_��W��?��ɶ�g�f1��○�������j#�nh��-�a��f�E2�����t2��s��{��� ���P�l��sN���B#��TH����>J_S�,$��H��ᅤes�kt���9��׈�8��>bkk����fl�����{���aKji�mn=Qr�������=gr�_L� �C#D6���z��E�{#��|� i=���z�j��c��w��S�E�dz-b��{�F�5D��!�F~�e�����<��`@�wK�����E�uam���W(���u������kf
U��Hu��n�E*O�nDf9ѥ~����9��:'�B���j�R�!?��ƣd[֭��n�y���� ���U����7r8�
%��C�Z#��X#���ޫi����hɻ'�Ⱦ����m!{�Q/�5V��wNd����v����,�5�C5��{�E��"�C7�o�s��p�����u�6h\Eu��"�i-�f9�{�W�@����Q���Z�7�|v��?�=��ۇ������p��/�A�*��J.X�Q�Q�h��3�EM'v������o�(�9��Q<�pW(a�M"��j�w���ԭgBA�����䑡��x�rޗ�2��|^�7A�J��֫[2��N�{.���*�p�9�h�����Ԃ�Fm��L�QYi�n�	�F-8��«�96��M���������Ľ��M���sg� �I�<:U�J�lb�S���qې��z`T�e(��Y��4��ʻ#�c0T?����11��LsY6���8�B������?��/�E�;?��U�@��1U���T�7,�ĈӐc3:��}�B�c���L�1L��2ˉN��{9{u�s���o.nGQ�=9��{�p}uB��G�!qը��?�˻���-e��~�~�/r���_�_Sa�]�
��t=T�$��U�{,�A2O*r��T��Rk�������,�w�Q��6vF{��h�^z�b��nk������+��^�9`N�=�q����S���^њl5^�m���E�6iJ��z���7���������·��H���qc��%)�g��،ev=Qҏ�˘~��~��Ap9r��.� F)S��ԒL����M2�P==hu�YN�yO���)��X�}�9���q��@�p�d%�#�oH3�QڬYv?PP��R�,�� ΃�.k��<_����pD���C =�2�`s��
�㗪�	v|�|g	�]/�vG��Tv^�ѝ��!�*�����-$��F�$E=�;�D�(2�� �Y�z�Z�s��>2�w��_��?�_矩9y���ϻ/s/��b��,�GU�C�@l�o����޼��?V͍����W������_��T�7~W�q�Ta�*����\!�q�la�Aݷ��H��*իH� �oeY��W$J@uC�􅟹}=R��AS�3��Р~VcN� 
oqϴ7V���s����|�T���#����q�B�s*���E�ܳ�w�M+��	v/�=���^�ɨ���gI]��i��*�$����?|f���I_�T7��jt���"g���y��_�e��";Q��_.FH����l��=�`a�"������6&�����'~S������J�g�Hn����k�P�Ǔ�'��X������ڢ���3"����\?$w��h6������l����/z�D��$:����,'j����{z�{�s�.��b��9u��$u�W|@���EUC�t1o	uo^z����A����~��}]U(y��{JD��0��!����"���S�~cf�w�b�\��р(�1�dC�˓�H�:�&}p��k�5%9������<�����_�аԅ��G]¸?g)�ҿ��;9񺑶��������?�3�f�d%����2oM[;�fȸ���va#����|z3Oy�N��Np �G�})������r��e�@;�%�
��H�������p�����ҵ�\!?�x�m���ನ G�	�,%�t?�([���s���M=�-
���e�<F i�R�L^|�"%e�(�~�{�h1�f�<�àѕ]h�@�k�)�%��y�g/�������_V_Z~煖�|ws�4Z������k����cl�ξ�r��<Ps���̜��[��iN0��w����4��)�8{�Z�a%�_[�9U`=a�����M�X�rҢ���:���۹���4�?��D\���Q�|���2��G�`�Hi�:"؂s���'��O��P��r�!$�L�!��p�ʫC�3ˉ�������>��[�~��BY��5�Y�w��酢�&����+i�H��t�8f����P��;;;����kw� WLY5 �7�+�č5c������+�q�y�s�y�W��3��s�i �"��o%����=�"D����`��T�-"�Abx�Ml~��G*9μ�8o�z���v��_��o�y����e����� ��_c�������p3 ���ڣ]*�<��7od����9o4o����4o�y!'}¤��\+���>^�����F�q���z����}Y�2�*�>���fOb��[Gɼ�4��+4F�����ޛ�QE3��m�"�yρ>��	�ʹ�z�� J�l����� ��b���@�˾pl��<ޫ���g�-+H��Xo��Y���b�P�9�|�$�R�S����DT8~Q�ho�"�O��k��[pi�/>t9vlϙ,��� QՓXwҎ�Ec��*o��D֝`� ����^S�m ���O1��q��a��Q��F��L������~��|2�: �T�3�j�Pڬ����0� l�S ^����ӽ�����%QOzw�{&��n�ɫ��:�͢�������������>z{^n�p��g�OzZ ���j�;sBz����6q�I���b�v�YN�]��>f*CRUv�s�⻵|v&ɪ�p!p�� ���gC���3{3�@ɒ�CYI�1ġ*�3+T�rI]]-�,U�6	��';;]�c����?�k�KM;�y���?���f<X�V��]ix%k�.��}K�(��IBHXS̽Y�<��|���߰�)���Z �U O��7��������RK�m���oz�	�Gm����RV	a��?4f{�8G� r��� ������_]��6��P���A�C�������voDHHI��<�M�v9�W�En��	��|(_���Y�y0а�t)&lv����\�6�;�1�M]���nf��:BNc�3HHV�h�v����6p$���m&��H����9D����{2��p�n��6����P�rHu-���fu���t��ַw����}�kEt/O��fN�>��fR��氥ib�ʭ'F����_�}�^V�E�o�a�~�Ź���V���V�h�����D�Y^xa�ƃ��m�M�q�pJXȹ�D���]i�?�X�1�o�3�I�w�*-�^q�92&_����׳�4�X�[OB
D+k�4!顼����z�
]��<�/Y���9��w�g�j��Ji�8�Wl�W\�Yx��'Y��W�U���½vcC��������S�vL�ꪬ9�A���]���O��z)����p�mQ?y�h�4DG:��`yK~#�����;�y����ά���
�x���^�h�з���e$�%�LS�B/z�^z=����ây|p�ݕj9���,�W�^��q'X���x#-�X���cf�5q��
�gTmqF���8����jVq9�q��-��qR|�
�D�"!O��)�0��QK���D�C�Ӏ��{T��=tpϡ5����VG��u�o
�Y~�<�Y�U1�޳Y��DYH����y#�Q��uM���	G|�0�1���& ����HYC]��W�3�4U�{'[#Ub�ĕ�ĕ�E����\.�i�d}�E�c��    �a��S�y��Gv�>�E�����+���ru�
	��>�+��w���$��"&C9�E�ʄ�#
�u@eB!R*������h�=z�w�}�>������Ϫ���{W���	�������SS<�e�n)��t{��1���]62����zr���-k �݂w�����?^�b��^��^��GLP4TL�R������Dm�S ��� VJj�zI��ޤj]o�}{WK1�e�^-�i���C Ä��г��!C�M�� 4L</�\[�O��xƚ޹���Y��1P\���,�Ҿ�����G���x�ZbC��I���� nZ��J��`��49�Ũ���;)�L
xt;�����=\�=��F=��t�`9���fۣ���l$b�Dl#�����*BS &M�%)(@Z�h��I7>��%{�巗�G_�*~�_d�J4������79�=z�������W3����i���ڛd�Q�+��@70�T�*E�����@sa��ix��#��L!�E7���ƈ��C�����Mʈ����iQ�;';;�;�����[�'�Ow�c�n�Ӝ��U$O��E�Tؚ�3���U\�-�Sr���y1�B{��ʘ�|B|A�F���ݻ�0����5?����� ���� KW�BF\�Z3�㴈mdW�vLc��[=�S����=��Y� ��c���Q��O`){�7zϼ��y�E�C��鐍�'P�.�X�caF�%�����A��[�e�]�e{���"�bY��:*��(ﵮL�v�º�ii���i�#+�r&6^b���^��zFn���v�X�EnG�����=��w8Y�^�w��oe�<����z)�.���3p���dȦ�������?���^��(�w��_/�Y!G�C���:�PWS�0X�4��o=Qe�W|v��h�W�*.z�d1U�(���2�������ʸ�u��{@k����_桉�F%�c{����nV�K��Û�'����Ð+ε�u��,;�I
��n�FS��q24���`�p&�2jR�A�:~޴+]�8���I���*����O���� �L�"�H��_���[�rp6K(q+�A%t?{wG�M��O���_��B�[���@��ʢ�R����~\��>y{�ԐE�b���
���zU��ݷ�?�o��H��(�������Qİ� �i&B�_2,jB��>���;-� �:�}������(�oJ����M�{$�^��'�C���rc%�6���z߆�
,nY�B��N�O|G���ݝ߭�k��'s��RK�Z��Y����M� ��I��TܼMa.Ƌ���b	v:ڂ�� �5�� &�s|�hj�߲��_�k�|���@��jj��E����`���I�I"E
�g��r��pGٮ,�x��Ih��!���LSq3�,M,�0�$���DDr4]�����k5_�Z~�5?�����r���R���^��7w����!{�����o�U3VB��5�)����q�|Û��R%V�X�_��(�6�JsG;+؞�a��4~x�h��sW/e������{)��(l|l'j�d��M*�Qe���.UչP��	�N�x�o�t��H(�0H�e�I^Vm�;��?��y��p/N*��s� ���r#�t���fC$`	 ��j�1��F��yR�Q`�X��z�P�Ԋ�<��.�2,���B�@D7�������a<ލ���x�bVa�3˩��(�����w�=���V�.��x9@35Β��4L+�aچt_>���UJ�*cɆ�3��	苼�&���V )V"P�߂Z�j._�k`c�C�q\U�|�7�V�/�;�0;�8�\y�yd�F��D�켒F6�j\lm`>�ܼ��.8�y/�~�w��pؽ����^��oh�BJ���.&w}����@���>�^{iع�_=�:���R�!A`�1�N��a,�,�MS��֓�����E�8'��n�,r�߄�a����P����KLŋ�7�X�`�Y*��.�fXH��0�*h=�5�f����O�@�.V�C��˯-�������z�_sVl�8�~�M�����G���e�ǘ��j�LG�����T�ςh�*��&fx���Uj�`����.ґ�y�^�K̠I� �n��"���9G���%���|��_��Q�9�Z#��D����16�����b�z	��7���eUN��ۙB��P1��:Lԍj��
��=D�ʵ��<~������?kZ��_��q?|YbD��KJ8��:�e�# ��4��B:DRIRn=C�2�2זI7���1��_��TO�ټ�+4QbX���=�z�)w�s�����!��Zǟ"�4��hE"V吴��Tw�����IjA8/X�8gX��>�Zz���dY	n��Yώ���(��!�Q��i0j�{�����]�׫�� ���zX�P�,���kس�wLd7th_�#W���AΎ���ۻ/���r�^_?��[C��m'\1��8�ǃT�L&�g�Y��!����h�#����n�u����2P�"�}�`�4ۻaZ
$���z#�S)�Q��)��ΞB���Y�Lv�m�d�%�:�Y����/P�҂�?�m✧mQ�d|B�	�
�j6am�����4U[G�p�Ҹ���'ж|r��m�^�I���e�����*�○����?�e���6�*d͖�7��[��&�?>IT)��^��'�1~�T��!��#DZ��e����?��%�up�cɕ�^]�޺8�]ݒZ����������������|�j1����zu���|�?~\?\��gWǘ�ς��Ы�b��l�/;��<|�{Ax^�<QD���LX����� ���*�fe(���~pŵG.� �z"��"Tfg[*�]�z��\�����EE���Y�б�pm���H'i�n�vb>��Js�_V&�1l� c���Ku4kR?����{/gW������� r��L����#��Ğ��EE��۽��R����C��-L� �aN�0TJت0�UB㵲R�:c�:��M��z���0�αjmV�s�C���l^U+�lt�=�	���Tn�t�"Q�:�&��e��%�)�n/��"i��4�b"����0XU�;PF�i������ZϏWK��Ec7s:�����D��cT��
.u\�*,i�n��=����:�hk
�Ba�<{�z�Q�s�gH��w��N/�W�������^�^\��[l�x|H��,���8$� ��XL�e3��';�;/N�	��R��W�
�a��7T3\���q��w|:��7~���aFp���5��Tb���M��Q��l��6MZ6���E���DD��x/��8ko��ɒf�g��(Y>�I��_pe�������V/��^ut�CR)����b�|53�����3Dc�KoV�ʱ8�:P�"�;�L�B�x��(z\a�Ԥ҃kQ��cMc�};{Eqr��"�kz��'{�wC��eR�DH+Z�;� R֛RjU��8B2�`\	�I�m���$k����z���{�f��_����>�F��BD\���qI�5Dά�����4�/�ql�d?q��!�
N�o�v�q�_��GQ	�l�w��y�Ss�0
�+�:<`�Q�E���P�p�������I���=���V�ȸ^ハ��1�/�8�{Zkҳ����o(�3o��A�wZ��yrާ2��h����	��8Ŕj(։�}���Ŀ�Ho0	sL�M�o����8W8�-�"��u���Q�gD��WĜZFS5�AA��A�j�, ����}:�FS�/��5+���?\�f��Yɶg	��ۦ�Ѭ���zλx���5�"�_c �FV� BkFc���D+]��K~:�f�wq���rN�*g^��-���Ͻi�� ��q9�#1j�YSf{6����[̤�w�<�B⥠^S���^x��G�=V��YOT��Z��\٪yxq�g�g�w�h8E����<�?�FM!z5��m7%�����˃�����������������ポ��ӗԾ!��e��jG��)o���.��
���}    \���o�?o��`�;�7�q�`.��������\i.#�d:��&�_��j&s�08T"�U��,��j3�*˭o=�9{������$�y4���Z�l�S�n�<~�VA�����f�� ]@����W��PF��8�~#��v��G~C�LJA��v&����q���%oe�]D/�����b`M���NL��'`�D��Ş�	�f��PN����!ߖ��6��|:�,X��Q�˨[���@���6- K �Z�w�0Px�`M��Ɵ���l���=h���ʚ��,���׏�p�v�6x�?�<����=��DM����j��h�)t6е2^�"df�(�)��>��䉨�����I�.�Ag�Xw��u9Lh���{��65�-��B�NPkq�5i�������~Yн�ý��֌�W�]�**Z-X]mp�{�zo������|qy�wT�Y������k����}qrp�s||u����?��������y",V�d���^�(I���;�'�W��}J!/�ww�Ww7ămP�?�M"#E��@ZK"s΍C�䣲�"�n|(�,�"+鈑?�I���Ϯ'&�O�˔�������,����U����]���d�6�٢Y���/@������f
�Iv&���f�RJTz���b���$�Z�Wף��H�>��u�g���U��ȸf�h�Mr�\]y�
u��4�w��f2��X���d�����o�p�>��q^���$�,���#!��˷��{,��C{Z?	��� �ڨ��SH�Y�KN,�!�"�s1��+i�c������y�����j5q�Q�s5�GhV�����)��1��y"6Ʊg�����*�Ԑ�)�!��P��LyT�L�K��`cSxIAw�\��3?5������m�^�Ԃ�t����ab\oj�#Ǜ��)ڡ�%>��� �Y9?ߕ�ӻ�w��\W;͜��ټz��hB:s;�g��s|$�������Ͷ�j��{�[�a�?������>�>��+t��ԑ����8�M��Km����|��W������������ߤ�OfQ�uB5�Z�[43�J��u�\m����խ/-�w�,�fZk@��T _���-d(�T�m%�T�ӛe��z&��:Y�0��*�7��=5�×{��;�|]���"{>��q�>�~$�O�7��NM�{P׭�qI�r}]� ��Ƨx�=�;?[��jo�:�;�K��.P|�	��M��� �I��x0T�J��]�}[̎�Z��\��W�8Z�2�d�me߼��-��i��~�`�w5�Cv�g�c��}2΃�ˈ̛�_]r��i����r�����(��|w��7���J�|�=��!-X3u%��{T=m]���>=�D1y��`��S9
�v�R���ɺ8L��F儴^��&F�T�M1�r�oc__=T
�=g�b�+������M�=)IR[T���v���5fj%�;�y�Ziatj�D���d&Zt'��r��^��e�����������������ۇw�?�{���a���X`H#�AG7
<��a������g �Z{��y� ɕS���ؤip�I�"��s����<]�V9�������4�l�h3��o��@�����Xuҽ3j�F3j�Dd��V�Y�dJ+�a�!6��dx���ؼ�]|�� ���g���K�g	X��ŉ4ܛ��#�[?&bMH�M)hʷ7*���z�5(�i����#r��9�q��|0�?�37��3'.MV�y�ks��Jc�^Ύ��<h_�u��N�w@\+n�(4�U�'�7T�5��q"��@�ys�M_䩺�����6�y�1W�9�$���r"��Gfv��?���oV_RP?���,'��f}Bu��>��+�A�ķ���E߃��{/��H�DH��ۥ���M�ͮ��}�ʭ���"y\�{��!���	{�o�]��\F�2DVe�	��J�0Z��҆�O��WǢ���G��\��sD�t��4@y���Dt���4���6�ni*'Q��D����L��>/9�K���^X��_��u�O�QÂ�SYK����Mpr�aӦ�)'x�]*-��nQ��[�����.�������9�������K��M���p����7/�^ޔ��Į {`��v&���33��%�oԠR���H����7t��Н�刄-)^WX��uz#y�8����+��'lt2 [2�vLdLӐ�\�$M�w�Q����ޛ-��$٢���NW�Y1� 	�$�)k�6���Т������cD"�T�{������Jezzz��|9P�BVXd�W�Mֈ'2n+��Б��9�o��TFTg�Dm�������T���7k|��LqmLU6^�=��A���	����Y���Y��?�?<TK0X@Ő���"
#�{3E�g4$TO:&�~�E^��.���ͼ��7_/�|Om�a�A�Q���=
�A�՝m7�������o�/$�'&�*����P�5�0�� �F�G�e�q;-WءcFRZ!`��3SF;�򲳽lk��|{b����WO����n<���0����Wt�����v�ugo2�����3t���p�<�����&g�J�Y�ܞS/J縝���ݰ������K`���݂��/���gT��åt�E6��:�d7���K�qb`mo:�ܛo��P�?�1���
`΅BL3��l�o�j�O��C��J�us�����7R[�x>���?�/�f���{���<��B? 6��]$L�P���S
M
D��2�ߢ����{��;�{�󢤕
��p�e�53��K/������?�{�y��zX��6l�������\N�ᚕ�VA��"kW���ǂA	�dC���@qÓ{'{�P����%zM#x	���2eH@6W�-ȇ�fTpg�P��2���M���zI�t'�(⬠�j�Hw~p��8^���qG}�d� �b�R�J��Dh��p�-f����XT�?���nLN�vX�h��2��R$�&T�M����� Ʊ����x��-�a��N������l������u��C1:�<�O*U�8����c.ԩ��I"i�;Fd����۔��5�?J�q�Xc�����})���z�/X�D��d�8��hh�2��;�˧1�w뎶��d�}�H�;�i6�uO�+Y"u��]���o��]=��J�l����Gg@pQIAE�}(�)�k�j����B�r@CV�=*������>�sQ���˘�ץ]0!����f5���w"����9m�kU*y9L9��F�g?� r�yH�n��S��"^ �4��P!K��S��L㡬� �����1t�DW���C���bF�����1e#e9�Ac�QTE^�ܯ���ݑM~>��4��� �3Y�=�U֚����~��X��lCs���@[/s�4h/6��b��Bj=\��rt�����<0ؓ�|):}<+�ʇ�N�#Ԣ&em��}R�[L�u��w}���И�!���ž2t��i�ua�_��z�������u��
~V��[7ί�נ�ƺ4�����x'Y1�W5WÕyAF��5ܽ��,R
�Y�#�c��4��o�J��i��W�e�c��O�32��)�U���aCeln-�#�rh���R��T�faD�:nTX+hϨ3;��Gސ���Nb������c�Ȃ�@�@ƛy� �����5ifm(��3�P��?�X돫o��O�V�|^}���^l��'s&�#�$��k� :�����~v���EL=L�������`���!��i��(�4�zCvyb�$�,��l������z��G�d�]a�#y�w�w.~6�����<K)}"m_@��D�W�8Z�q�t<�ԆPj��e���T"k]���[�Gir�DwZ���x4�nZ.�>�1�1�J�%�ۚ�x��qV�Z܍R����0ҙI�.�#a���
dMp[�s��gͺAC:߭�3�,�R��zK���q�n�    ��L>>�+"�ÞM�ď˨g��9*�9ۚ��%����"�-L�I�|�^d����~'3�,{<k��j��3�� 31��L?I����(<��W���PAd0�as�z?n^~ġ�ɃY,'�S%,O��EM��(�����k~�YͱW0��j�@�q����AN�uB�<'\xpN�њ'�/_���J��sIQ�kV�Jq�&袱���j��IN2�&��K��w��ac�̂�TR ����Y��ɢf�+u��z��<N�nq9�����Ϭ$O��\J�u��.0^����&��o7:CaԈ����9�:,�J[�Zˡ�#��YH��������s�H�jS�"W����sL��NF������?!���@fax��3`u(W>�l-s�fl���$¶y.Gw/�ӏ8rT��3����<�s���ޭ" .�X��	P��<������H~>}s2}z�_>o����h���~��4��/�k�\y��H��9��J�Ip��F��,���t^)9�^-�;��̳��YY��&E��T�;;R�yg��*b-17�o{��(e�3"�[�j� ���k��^�����~��<�i�PV��F�7ێ��mO^�H/ɷ��r^k�S*v������y��� ����;��]<�t�q�u�0r�����}�p�ң�����q�Kt�g-������b�[1�bt;݇�htS�:�}1�qr�C�E��z����_N�MC7!3�x��d(�c�2s01Ì��J%��0��L��c��R�qO�XnG�gn㺸&���:'\�3��p�O
0̗��ֶdk�z�q��j|��_-~==��?uy�Z{�<���`�1��C*@��FH�V�$�ԫ��������[���>`8�c2W� �(�Mh�	��L�v�m{�*8t��!1A��<���A
���O3���+Z������f�ǟ�_���o�.�X��/}�͏�C������;�Oz�ۏW���s��������N�[h65�4��M�\m��je�7�;=���vݎ� h�M�nLF~3+2��=��<�A6@}���� 0�n���ϑV'jݍ������nO�������8���39���*�pZ��
���v�rT��jX�����K������h��v�]Jp!��y#�����!D���n>i�P��YIO
O���PE丗�iYo %4s�UV�@��j�k�A�E-p0�d���t�wj�U��j)�����t���Ծ���f��Y�΃�P9��W�M�,��_y�
���nH���$к� �m��r�rw�3x��V%��Q�`�ns¹�d;���J��I@*ښ��69�֑�b 4�9=w���R��	,$���������x��4�ұip�'-&lt�������-?W������ͽ Q�m��B�m��|��� /id�v�ς.����EA���8��H�0�%�hj�ѾD
LKppk�%t�Y���@����r��#��sI�Ć,s�@��D@h�4�(�c�T���:�	�J��MP����q�s���}����f|������m��S��&����������CR�ϽrZ����e6�,�a��)<^����m1�._B�H"Y�x*�G����҈b�7��IᩚEh:n���cs���XA�t�/]��!�Cѫy�wV�T������b�p T��'A;�rL��bP=>ټi��vnD��r)˱�Q7>�pJ!w�����Cc��J5��*�chu|Lg�����]��Bƴ����^\�,N�2��JJ�B�eEoS�[��O�a7�@�|��
I���C�h�D,\�6 ��~�]q� *�H<��= ׮lw}�
@j�j� ��������� r�e�f�?�^�R6=���?�}m���H�����k ���`q�s��uW	~�F��� .�E�"N=,�\��a�3�����< ��\w��Ͼ��S��]!��ø�J[P�&A'6��jA���
$�bZA��v�k�,�?���ZiKd�DV�׶��nǷ���%ܟ���D)Y�Vr$[�jd��qP���+�?�'�~��(`a2���҄��Wr�G��V�����|~�?��~��9��i\�;"��55���6�\v�7^9Q~�l���F�`܇�;'�^���qr�p���
�S*�V���ܽQ	Vİ�Q���ů�������/_n�#Y���jK��&m�'� �~�<�Л6�����{���|����B�%b�c8 .�Sq[���P���`P��̽�ۥ+�Z'2���=�Վ
N��7B��ji7��X��+�.��/�{>��aT�s)�(��:�����s���<�<�c���ԡ���k�G���woc��5�`�ن��:<�̥�(J�)�@���/Z��>h1��?Ȋ2��ǕgӀ��k��AJ'�.T�K����U�Q���r9�0���~3V^��lP��l��dg�Ш|mKV$m*��[%��H$�e�G.��ݗ'�ppIy�1��a���؞����l�K�ir^.eiT�?�7���f0hѴ�s��Ė��[i5��Ŧ5�v����uHb��PɥQ�â�y��B�YN)�.��N�Ǔ�8���P�����If��}��d�G����[۞����d�]mbz�F�n������L�j]�Zu�Rc��y)�?�a��?���x�w^�0*����P�B� s�\��\�ʀ;N��Vp�r��M҂���U�jȸ�7+!O�ъS��6Кg��Iv��J��	�t��Ĳ�!��|4���r/z��%AO5s8+b^:�n��*M�'c[uX"�C�5��x24V��g5E$@�:MLv=T��=�������*��|
%���-� ����$��=k���d2!�jډ�#DJb!+<��fw_��8Gx��i.�
w��|������µ��o ��Z����̾���0��	r-�a��D�W+����v�1ޣ��;�fݷ4���N�hq>���]]a�Y�Jx�}k�w�	�/\���q�|*4zq��	�����q��G���d��>׮����$un��$$=$J�U�� ���Y����d~8~��/c_�=��{��](�"�0��Ԋ�[�ov�&{p,�TF�
IF�#6�2PX+�]5s;�D���[n��=������Ӫ�\o�&�%\�ȅ
��F.ԣ����,��G�M�	�%��Nlv�K��{���z<x\}^?/ �
{�D;��Y�w�������;Uי��4��q^�|r|u��ଵ�d�����jE�HU�v��uB��1F�	�?J\BE�ob~�an=\l n>o�Ί,6�R��.����#�B�jsOl�x��i�;~��o��	�0�Z`}�r@[���{+�o�-L��Lf7��t��f8K;&�H��#�Bckr���-s�_*J�R���j?��:?���Y��~�Z>�5ΧϘX�ļ+=	�בp�7�U<��W�H���Ա���`)�-��*���ݼ%i��	��Qv�#!,7�R��C�_C�^c���0pC��B�ƻ@��~��
UƐmE{s��6C�[��R>-Tt5�.�v}��0��EB���&��t������X3�Č4 �`�8���ڽx�L�̤�P{C�#�io�N�p0K2y4+�w�M~:��T[��OS���Vt� �!d�B-��u �b:��&J�̉���=�joٜ;1�~�Hc`^�����ch4-T��IC�:��ɺ�T��kCnq=9���K��@3���p ��|C�;�D��/dr�|�M�K�������hE�V����Ն�h�kC��;+�����J��#߶�����B�Wv1��4*-"�aq�㧀z�i)��9�Z�pyk|�ȩ4�!YQ[SQ���!��6Ĩ[��b}o���� o���*�H�c��pZ��Xc
3 j�;	���I���Ѫ;���inmAS�,[e�͸�AJ��U�H�q���F^    d�?@�4�d��ON2U �R"�,44���d�i3U�wV?������P״ж$���ZQ�^�Cb5��!,T����sLz��P��u�;^���6#ۍ�Ϲ�Y������+�ɼr�V�7>�T>�����1�_:�A) '�G�6q���@a�n(�?}��+�v� 4$`��\�LZ�0\1��b<��9��� 9�fs��!3�|bX`^X��0Ǵ��ia�-+��\g�M=�����xϋN��A�:�B�3�Hm{��+ ��<L��8~�q�:k��_qh��bk.6��\yU�B�{[�#2�hFW9���ɧY�`V�M���#�:[6�G���E;���-�`ڌm���]��2�9��D8T(��S]�v�T����91)��Y.
�?�{"�!1���HE��᳇1�YN���j�����s�1���Y�K��G+��R'�3X�XV��`��ѰA��zDT;��Rlװ��p/�K:_kFح02�(;�����������*�ߖ�x�v�����#-�TI˒T���{�U#�T��0|@��C$a�-��E��L�:����.���<wN��tq���M�	w��]ow�T�ힼ���f�Y?g���Q'J��>�o��1L�@7�#$�r`�@����~#|f�!Y���9�=$:�g�#��0k���>f19���[�7�����Kt��O��=��Fؘ�;0P��R�>������a��}����^=���@Ή��[ (֨��F
�Ժ��W$p�;t͇��f���:T j�b[����ͨ�`&�W�����:���T����h8���<�%փ����x�X~����n���y��ۘ�m�3����Ȋ��;��)��A�[�Lt���dEn<��܍2�tt��`�Q_L"[�\���)�|d�V��`�	����bp:U�� ����7�ī�����B���i��p��Z�S(�ʲ�T�_�3t37eM�G��aX�I�PH{��q�ij=XW��b�_t �v�X���kD'�	 �(���rOК*�ٮO�sL��d��c7���$��X�4�"$PP�J��l/:��J	����,rr%�D���b�j�.��z����B0a���{�;W���uB�]��E���v���.��pa�b���{ˬXu��_6�������K���x8fD���8������;�^Ü��Y7э�4�:�;Бc]6v�I*
&
K�����������/�#gL���m~��:��-������FTa�TH`(��s�����ps�Q����"n� ��}$+Ï�vH)�i���}���Z����B�G�5a��������	1���(���"�1����%�.F)��70�*Qi���Ҩ�D<P,���N]s4;���r�+���I�B�d��6̌��ܫk��9�&i����8[>=��m�R�h����°��l��A)�+ ����Z� ��q�Ձ+�t)T���<=` �cy� �Ř��}h�;�@rji�JxGC����5T�m���׻��&�y8�,��T�i-���������������a�B��������Γ�}.+�Du5�+����A�s�=͋���F]�y�������08]��/�+���&��r�/7��f\'����<��WJ��!3���?Q�%�?e�Õ�=+�<e��q����_�$/�GI��,���cs�ᢿn�f�y�w�P_�
� G���FC��lAj{n��@����+� ����� @*:W��� 	:
i�� ��Y�޲����l<+f�4~f��m������{��X�����e�=n>�|BF������:�s��0��ՏgK��<��A;��w�G,�	�
.��{�����~�}�����Tr���X�q~n�{	� ,��C=���o��7��6Bs�o��y���|+�(j/&��2tX�"�羶E,��a!mB���}�JH�������������B�x��q��2�(�mgsR>.X�9��˶�Ww��	~ŀۦ�ms��Օ�>�͏�P��s���F��!�K�L`[��&y�� �
%!���TK�,T�i�^9 �:����MΏ&���~p��KZ�>#�qq.g�ꄓR���h�� �Wi�߽iN��x;e,D/0xگ	0T��P�ز�=�s`>������u�PV_�By�j���<ʪ
ې�/b5��_K���4F�Ly��@a�y�V3��^;�LY.l�B�^	-�x��8�:5��s6��۳��俰%�y 'i��%�,�2i�{�Z��et�.�o�6��m�k���c��}��m���B�D�����8�5�bbjj=0�99�.)J��Sp<+���	}onÆ Rqy�US^Q��l�����%-p�q��c�en|�*�P`�ւ�Ʌ�'=��8�}|�w�7�.r�r:+�� }��"΋������r0���7%O�sq�t�{u��DHk98F9��#������F��:��D@��Ș�ki�j0�洗��"����*t˴�	ϑ8�Ai�oÑP���>)`a����Cռ�;+���@UG7��Eac���Z��ooG�����ֹj(dh�B�%e�?��V$�Ɓ���{*Y!�XL��Pv�x���v�e�1��c�Z���$�0�-�Y�����,T(�k����+Ѕ`0�Z���-
r��@��9G���݉��ٽy@ ��%�f�`���D�!G}9laT�ն<ےq�T�1@���D��X�z�=.FUKb�zmb=з8;�!�X�xN���K�߂��nZ�@���a�A�l@m	Rzu��(<��z`v�zUj�h��;+�7�tu�0Q�:S�t�E���7�"g70?�B��v�l10:J��[h}ǹ�nW�YI��J
n{����F��R���������NgE�����\7�4Ε�=!��"��~����h`6��F��r��v.LSjދ���cJ���v:'T���F���bƅV}����P�l�tp�ЩR�:W!X ��We���ꂗ�	��uV`2�%���	�����4�-�	27��Ж�� �Nc	�H`꓾��)91p�sB����e9>~ܼ��$ѩcY�+^m��,f�㚄un�Ӷ�m��@$��lU�՛�ԃ�PQށGFC�� �Ʋ�{����Η����?c��;+�i�S�Rc�|����~�
���[CQw�}�$a.�|�F���ա�_��"�`H�E�1���<?/F�?-���7�v�Ֆ�Yi�׺�Ig�T�j�jR�r=1���6ʏ?��H�(H�(h�(p��[��ӣ�`�� ��,�Ǹ��p~���H�i��o�i���7qs<I|��5@��/ǣk匷�i.�R$y�(2;���=m�>{�u�}|q��pZ�ƥt��	t������[�D�K��@m�[? ������3كv�g��l�.��F��:���XlQ�aN��R�������� �-s����>�{#���D��7bkzގ�Ms��o|#��5$, ( L�n��9N�F�|>�-�b�,�����%��i���%���1������zϲ(\_i'E[k���y�>��q�
�u�n��z�q�8����Ǘ?��b�hV|Ǫ�WR��+4��=Iȏb�8�W��[���C���Jah0�Za�}1��F���z��w�Q5�7;Sv7�8;=�:���G�:���"������cN�,�M�2��K�_t�.�!,AEF3Gs��1�� (��p������Y���QD�*���aި"���fa�pͶ E�~QaUk��V$��~�.G���M�nSe����	s��X)��Q����b\/�=�
=/� ><�W)�� ��`�{	�U���8/�&˖<��࢜������6e��9D��椈�O��z��(X]��SmB�����#�<�3k ���a�S�q�7����d.�E�Z��5��75ԗ�/�g���f�t�-܆b��0���_h��z���f
S��Y0    !�Kz9\�a�J]j�;��<��.*x���۳q�&T�v�Z>ۢ��[���o��u��E"���g[ͷ��H�[b��ï� ���֊v�%V�_ڑ�H=�g��.�W2�`�cH�kNGuvBC�F�	��+@u�}�,���\�[�1_�>�٤eLgJ�u:�B��zw�Y��^��[��jS���:�@Ga(l0�6�Y6�}2:���ߝ���h��[#�>��a��Ba��[F�9��)�Շ<�<�|^>>=�?��Y�_���GX�x\}�������x�S��O_6��6߿�<,��������ҹ�?7�%=^,K�_˿� � �\2Y�����P(e��^,]Ϧ"儨���{����I����f��6򕎉�|0\"���]�ݗ���܌��� ��M��*ɣ�*�u>�lF��@�N`�BY�h��4��kz�"�v}p��w�V)%��'L��|��z�ظ�Wm�e���͎���.Ӗ�q��d?���U��P՞����q�t��y_�:w�C��Z��D�� k��#�����I������||F���?K6��8�مN���lĸ{� QF
�v,�*ۅ3����d3bG�c���ڦ!�+p��ަ��M%ۉ�vO�s���'A�a$�t��u�.���
A=3˄\[U��Ѭ�0�؊��Q���y2+�?B5����H���4��h(��r��t�f�Rz��@��=��ټ�w��P�39Y��*�O:=�73�5� o�t�z^	H��O��H=��T%H�5���=ih��$�1�$�i�������{�T� 2}0+XI��U��$k�#�,�50V[�M�v�p��&�)2�ڛsDD@*0�*\�W޽LN?�r��3+P����%e]���@�3�5TԪ�u��s�_���������~��y�~�����	b��xr5�����<i���zv�-��e�En����$��*}0+�	)�߼���)�_��%�ߢ��t�D�=�~L/�휷v2ۙ+j�Ή��w3��P�zaimb�#��	ϑ�����\��禙��3?�:��� �,��pկ�DjR�n{�����$e��r��.TK�R������P-B�^�%�O^�K��0��yMm�dfs9\��]��}.'�
]\hb k��fB5ͬ��M����< ����H��:0�E	Lw�N'�n �B%�@k�����|��eҙ�l�ξ�y�o�l
�3��>�r-���,S�����h�]4n2˾�~�8��}�q��v�_.���`B� qL��)�;�v��q�]�?/�p�^Y˕'k�DI����/.�sr6L��I�id �&�8y���R��[���QN�����������s�@������q��lI{�:���cL���_č���q@�3�ޜEڛՓ϶<��&���&Ci'����ɹc%�MY�X>=�~p�N��U�n���'�,�ZF���hQ9�c���7-պ���k~u��l��u��&���{��euǋ��7P?G]��xW�=�Y�����=��G^�s���yn���%9|n�eh�N@Z=hĕ#�<gЧh�D	H�a<QBY�27�������b�l·'�Z����0��=��5ӎÉ�I���#نd)<��7�v�*ʇ@�+�TQpT]lu�^KΆʭ��˺"��}6�]�fg!F�r�
.V䜷b�ے$�� Ӷ�auiv5+Φsg�N��קG�����7�����||z�7���brE�0��	�B*�p+c	�����k�@��r�ո>��z��y�2��y(�
N<,�H�k���4�cAUM.e���"!����jF�;�P�bO(�ŝq�����p"eF�x(1��Zc��{(ڌ�|YV�/�}���9��A�-7�_Yភ*��\A	3�
C�La�VU�D����������fBpͅ�!))�xf���]�XaK��k��8U���r2+�Yt���P���Kj�xی�,G�%^�"�2�.х�n����m0u(+�E�?(��i�pW�p�@�P�Mm�;���d����ES[T&�⮀��N��rˁI��k1�_�?�w���âS�}(+�kQ�
T�߻�V��%0ZK�딗�@��T�z��ig� �f���^�
�����-�v%�VA�u:+��l�@Xjy4T1�'�������,����r�To���\�I�ZBm����6t�&$G�X��y1�%���{� Q���m2��B�9������~��T�gNl�'�R��j��>���W�,Ồ&�����j�io��Q`;�;�j.��V��ް�{��[����K�ď2��Y#�
��u���5˄�&{<+��=����s��x��3��2\0O9g�fy	�0�/�ټBa㡲~��F��WNǻ�kyS`LQyhV{Z������7���\3֋4BVm�v��� ��
�Ac5��l*n��hq3=�-�Ԉ��g��dx[ &���0�_}k^k{]N���(�q[m��*>H	��pX4Rm���ok���N@D�0M�Y@aY�R���ɷ�����`|y5?=_��/OΦ�Ցw�g���*�3���4]� ���#u�����9�x���/V������/���N��w  �0�-�+�>~�?*�����M���G�
��0��M�]�8U�1����V ��<Ó�3�l<��׊%�Of������6_L}sN����]d2Җ�i��֧�Dm�p�=P�=��X�J��V�nl4Y���q�>�{D��k�X6�		MNy3����l�|�]��'��1y�|r��뛟y��Q�����H��k:���FH����:a��p����]م�����pU�p��a��m�_�����*y�ϭ0�N�(P��HX��C%���=tX��yO?m�6E�x��T��,X�f�_�Uu�1@M=&W��1ɤz�������X�6]�>�{ߔ�
Ý�֡-WHL_R�9i��[)��8#-�T_���E��N��f1T���������FW?V���xL�ߝ�l9]-6W.Z�N��\d��h>��ͧ���'�՗���I��^gc[�i�d�����%O���A���A���Q-���g+����Fjz�Sz�F��8�nP�t�A�4��Zb}q�s`<0�x/�ym��abF�y�lEm���$R)�])%��kf�2]ۛDjo��;�&0g*�"�Ϙ���H:@��ŀ�ĺOv�*�#=�����ҙ��������ǧo؀B���xyXZ�hw���}w
�\�Ӛ���31a�Q�I�2�v���BEB1�P^�Bb�7	IJi��]�mg*���=�6sm��Y�ޫ̧(�xz"�gD;4B�f�(�{�x��rp��o9K��s}pu���gs"��z�f���Zg�zy"�y���@�,I� �����|z9\���HEw*�u:+�I��kX���#S�D����.(�hH��\:-�v��p�����I�.��5w:+�����l6��Y�Ď�NyN�u��O=-P�@�f2��R=`�����˓��B��2;�ᢶB�Y��Iؓz���3�B4g��f۾��qrd6��{�aD�d;w��ƀ��`��hC����̷p�1���ӧͿb��3�2��p��|quE�M����s
j �Q�s�N+��>j��||�������3Y$0\A�EJ$�N�Z�$d�N�
^�4!8��y1Tnk��9�N�v�C~
�S�xV�礊Q�$>��R�k�1�fqUK�8欞v9?�4�3��I�T��1#�ba��)Jr�ˁe�?n��:}0+țXj׿�Ψp�"�j�V�z8�J� �,쐔���X�Q
fg8Up�L˂�3�_d��*mF���XBFw\/O�y�xN�wE���*[�ނ/��/[�R檷��-�� U;p��J�#(�Ɓ\@� ��N��Ba}a�U쵬�������)r�9���p%o��(
T�/4�D�֘��)�3N��w3q�Fb=а��7띊t@�'�
0�    ����8'\�Fl�:�z�λ��G"��������ݡ].���|���ǽs�"6�8��塩�85Xo�֚�����j��f����}Q�G/��Җ4/`%��**�)9�e�G�e�C�y |���%t�E�9}4+�9�"�T���::��F�`>�p����JYj�s��N	�H��3��X�7�+ %�z&�~��ԳVF�r��f��>⣋��������v���Ա�ȏʑ�L*�vO^=�/f{
b�-�_29����r�i�0En�Uc	ۢ�
^���Jab��(�>5�"��f��������r;���{��c[���~�{��Z���QckfZ�A<<�c(b%Gy�?-�S,Ɠ���u���6�|z�<�P�>���+���ӹ�o���ȷ�UX;J�5�tc$9Ҭ$�p/��P$0HA��X5�w"�t��<>Y:����{�ԫ\��l.,�k�ݘ�T�tĵ��^_f8l�����$17��ÝN>�������	�6
�j��vg�]\L�ȯ�v|-�4�#@���9k��������T���jxqb>>�����_KHtn9�Sv�.:y*K���V�{eAm�����x��}�X؀Ƭ�PXF��沯�w��Y!��[�o�\?�+�_��N���t���ˋk,]q��BW�l#<Gu��s9q����Sm�-��c���H�dV�t��Vyp��F�^_���5�M�(	�|m�Q��&�1|l2�=�C���f��y2+��."�D��D/z$�ۂ��?Ox��!�c/pk9\�@.r]!s�n�wVj6�J���	�"�����Ӽ "�XC�� ��9�>�C�] �"Q��	��J��	]���(�M�VX�P@V�<���0h������!Ug]�7^u�ط��tn�d��8��yQ`M*�V�6��9!����Z��޽5�#�ۑH4��10�0)	�|	�.���o��R�3���#�u?�������n���Q�<���CY&!����F�Zo��@9�8"��A��Op-�Ǉ� [����Ǐ�r�H|��4��R�n,�'�"<���4��:aIT�ԏHB�<y,+������ �mRo���A�Xe�ԝ�\H:�1|<�Yg�uV�gAʔ����1a��ILz���M�	�I��EH���!"GF
0�H� �F��SH�G��$ѻ@��
1��uV�Ŵ>�����B��'�Ϭw�91���4Κt�\���04%��9����u
��s
ls$ i�l�B��o��8H�`��8���|8#Y��90�2�����51�X�m���P��}jSI1A�U�`V����������'*�>Ҏfm�O��Z<&q� �މV�9�ݩ�@��FCH2���P?U����I�}�H��+6�mUDɡ��V?���]c��Vr�/�6�[Ogu�ڈ����y-���@�#*iB򦞇�V�J�o(�u< �ir�6 uU0=�bu����B�^������E��Q;���B���xF�[���~0 T�*I��=|��UcC��i�6�S�C�|������ӎ/l�ࡈ%��
M1�N]���0�Pc��7Sd�6^Ƽ"c�_�w����Ng_�]L���B�^���ї�3�Z�Z�'��L�"١B��rhp����x'��<�+\ً5u�J�^̟<�Ud�:8����>�K�`s9\���ӊ/}��iE�Yr]�ZQ�B�$��gd5�$t���	��2��v�x��Rg1Ca�m�\f�|�F�����n/���rƫKE��������a�y��������m$ncp��?��ኸ~vyH^_n��"�ԫF~\=b�#�x�����m�e3�����t�1$4QA��E'Va�C��_��C���=�)�4��S�郮S)|Ҫӷ�X�ң&�[SL2On����ͳY�?
�n�M�T
�=����A�7�e�$^�|H�$H��p�q�D�h�R���Lg�2=	@ �������n��$D��*��*�Z��2=k�iW������W��V��a�{ii,�����ns��`�``�4��p���j��On���0���22��j��X^���A6�(s�F�.����� �F+Z�B���B.�����5�mx�'���a���"���i�Z+��q`O�eԁF8�wt�ݝS@m<��}���j8�)�u��j�<0�+¹�	���R-P%ރi"����`O1��������3���d��K8L MP��
 �̠��~:k�B�v�3`ܫ���r�:Vl���� ě.Ng������:��8\�h�u�U1���d��H��5�����բ����_���/�2��F���ٗAcR�@fx�-E*�}�噐i*�_�	D�>9)Sח����y��R(�s�-9[�I!;8[����tM��h�8��D��OĢh'6���F�Ԇ���.Ԇ;�>��U(��1�T�t�6g�!����y6��~����	bm/z|Vç��7J�R��&� �d��wI@��cD�PF�4�@��!�!��tt0����W�t(����EָP�Y^JK���.�S�@4H��Р��'���]���U�^G��p��p̏k��a���z~�ܯ^�T�[N�d`�}Om#� �}3����M��̘��w�{ �{�\'dI�qv���Ҏ��aJO�����f�v�����2�b���J�]�8�*�Ls�{��BJQ�6�{)�%<A?��"䳴��Z��ҼT��s,Wn+�L��<w8+�KUA�r��}��%V�n�:6o8���h%灁�Z��jحB�\�^S�HyG���N�>2+�N&u(+�Y 1���QDv�t&��_�����,�����π�9\�\�o~�Ie���`w%k�R F�v~�"N�m^Z"�8�;�-�m� ���s~��A��?]��l�;̯��|�,��o�����#���;����C4�}>zZ�Ҷ�f��t���~�{��x�!�nAq��sq(�z�$ڬ�,��-(�qB:��^N��� �u ��7�
xg��UkZ�u��3�.������O����_���7��)o��M���Y`�E�*���<0	ͅ�F"���	X[Q\VQ�m����� �<zqw8�<۝�Oly�>XN��t�yZ������.s�6��b�<j��)��Q;W�x����
S���\���v�6�ƛ�N�������z��x\������j�k9���d�V;q����/p�a����ϯ����}�pa�v ��Ë������fUv=|S�㣃���o�?7��a��;`����/��U�:/��� J'Xހ:o�J����H vj�r�'��4ިo��ٮ��8/�h�SMF(?�F!8���W«_�V��h�s��@�V�q2�&����g�cޏ]��h�fwj�Xy媬���r�n�};������9x9y0+�}[��/��!}��3���i���w����0E�S�{Z�y�ٰ�+� �`܁{�����k���r h����6 �� >R���N����O�5�ǿV��n+��6��i���D	%�v*��y�F��9\U|tr�Yp�L)B�����E�L��"�T< �XkD�0���uM�\������������n]���9l�ٓқV
���**�Yy%=�\LQRhp�U͉���;�>��7?������R��g�{S�N�4�U��wrG�l��վ�A�{���\cx��2\�ӂqH����0"Ld�K����V��'�w�q<��>�^L.�p�!�q*�n�Xa�顺T��9�ަ��tW���;�#���-���X���!FF���z���Uϫ��{��!�is�XN�p�
��d��ǭV/���z����V>Ɏ�#��<%<�PAv�p��!OK�)Z�Y��r�S�߀ɐIn�X>���Dy׹���/�V�m��=�d��8��+̞�;��{�P	��?�`���
mkF ��}��}��"��0h��̏g�Y?D�&�w�;,-��V�.�y�wV���(��s�?0�E��o�'�%ن    }~��S�������o�;�e��h��%����ha����kV8��P�-Z�Y���	�f��h����6���^��W?\`�����0��w��}6��Y��pb��ź;��u���D|F'2���
��~;h�.�4;#.�`�Jl)�:ܯG�p^�_%��O9%����eo0�11�=����d���HϚ��]�"am����l��
�
�樱�#��� �0���&
�����r`�"gjt�|Xu��L�H����(���HIe/͌X� )�����{�;0ř�פ����=��G�����|~k9ܝ�6�������'��]����XRv����ڔ���hZ{-+'5�@{��ȝ�6縶M0c�m�I��fh@
�B�����z�ӂϩN�x�tV�7Bg�d�i��~���E?�bU�(��%�\��w���M��Y�F�n�[P�p�+�;oo�*�!cnM�]�leh.�UQ�D�:��?s8��K�D���c(Ḑ�[���Q�h+�eB)��u@8��0+��l�Rh����{��E+/��݋�����y6��p]��y ��L�>`!ZX$������`OVE�Mn.��T6�Wƃ�O/���Gڧ�B�e�}NBq����)��2�X�gPYf9\�J�.�~u����g��d�}2_����&Iq��AD�*�����&�~�t���B�e�r<����l$&�x�
@:�Z"�����=�i[��j?K;�:�KX7s	^X`�v��Dp�:F�M���^��Pl==���p����G��B��tLT�H
	4�P5��5R
�&�j��W�w�����Ī�{8������t:ϯnfe�I�Od�QIa� ��yܭ�ᥧ~�D�͔'K��C.������֊KAC��;AjVL�ိe����N]�������=䵣qw�>��,�:��L-n�2@��E�w���Y�t�Yy� ���~��{
�P��]�ݪ�k�C����f�`�T#`?d*�M�ٌ[�'�#ϐ׳��.��ȺJj_�|�yM�2\�[�}H�J� ��q� ��-��4���_�>KHA�%l�X�}��o��ֶ��:3#G��������|ry�����e�:���pQ�k����F�W�E�MH9�\wѮ�X!�Fɬq��e�����O�	��ά! E��9ڏ���E.�;�Z�a��Ԧ�^�O.��WG���bq:�U��S��+��oJ���7��żsxv�C��� ���N�1ș�o�2ϻ����0���5V�jn����j��`5 ͈�a05fR��C!����S�'��~5�22�^�'���?���e�I�I����'��B�4<�sh��C�E���x�*����]�'���~���('<��aQ��\V�'�".�K)�wQ�M�Uv��T��,b��L��ݝ�m�Wʰ�RnH��;}j)�����X������h�P�[S?ES
� *[�s0ad�PC���Kr�|A�S�Y����=J��&�v���NOu� ) 8��i�{������()���(�.�� M�9?�8��*�*�S�v����|����c08�'�o ЇS���Ny�o���ˁ!��_E�ox��@�4Ab�D���,�o�s�����0�%Z?���܄TI��4�����5�ҷK�{^�ڥT1%��,Q3a����2P�o�}$7�/�H~���.(D���Q��Z-��� �MT�k���ϊx��	oz s�׊��#g�� (�@�*������ξ/��~Cf�
4w<��p��"TZ[�߾�_�ȶ����)��s`Z�Sga,�D��Z�O��]��H�)��[#-��Sj��t�u� ̱����v1�'�z�e%|\�m)�o�Ŋ"�;Ȅ"	���"<�/?~��Q_��<�_�X:����&�`,/�z�	b��gO�Ȯ���=Z̎�G��U��0����4R�W�e3"6M���բ<�y>{�����s�V=Z~B� gO�|�6�D���k%��8/�=�)#��8��}-��BԲ�Օ�3�r���0�_���梀��g?�KY����8:: �Dk�\ۄ��$�섇�I¡:�l �C@=�G>�mC��p��5]	���󳫓�Z>=$^[��b�Eףּk_3����Y�F�_��5�V5�߉=�Y��5�e�yg]�o����'m0��B��(E1}�D{P9�dK����l�Fs�0ઓ8� ѡh t&
)͵I����z(�
������9�.�\��1���2}~��SÖ ��>��m�j����	I�i��a�=��_���c����@@�#�6��F"�F
�Tf9�C�n�h����s�����/���L\]i���o�i&<�2۔���6J�8WB:@FiFR��7��رl�4u���ӱl'$c\���:�}6kz��b�5^vaP�9��$2G��H��$�
�'�{B2�m
��@��"qOz���R�����*��m��:�53�q�"�S�^l��p#޾�Jh�AQ���p�q��XZB�2m�͊�&d@l?f���Z�Z]Vv�.Sh���@`�	H�b�T{9X��&��}��1�ϧ��grҜ<#Y<�>�U��I�29o��&���qJ􀊦�t��}:'U�2J�f�9L<�eh�$�@���ۥlY�s[�,��T���T�u6+Qa�D�zj\hH��	ޚ�(Q�sKJ�)�v��p�O/��؟Ωl���� ���Z5�Ǹ�/�U��)9���0�tJ)R/k@'��A�:Z��`��F���Yi�}"@��C��!kj!�Ô����D�[�feZs�n�ۙ$����k.����ܼ���%/�,ɀ���Zz,G�������{���AxE;�dey,��'���r8ѕ��'��$ug��#SIA�Q���V��3>���9�خc�`~J-f�����|n�Vqzg���W������b���� �1]g��\8Bc�nBc�P�mtAUU�U��iD���d�17*�����gq.GG���^�V������'q^5�p�ā���
;�P�H����䠵�`��1v�Ƴ��s����:���]\_�!����n$4���b �[��(D(�c�O@�,H��/m��*5� 
l�/rǜt�En8�7���w3=ۍ߮���g�f��{Q�7��'�G<��~�-�9�Bw�&����I�G�k� k$"{|̹*N���K�SEH�$B:�01L��^,�p%�H�Bdc�>��`��n��[g�oa�[��[�ݣ�^6�Ÿ�ko�{�6��0�<���]t�Y6��<�s�]�v��"LÖ0Sb3Z��r<�|����ϯe_p 4��I�T�,���bPm)� �L��o�	�������;]c�v��	F�wU�k�p�~`kD��
��6�0g,8L�[m���lw�R�`�������?`�cY�KQ�I��Qָg�X�7����Mޞ�����i&�)o#0� S��F�~�e�����nK�y9�[@١l52�xц��>͑�V��G��Q�LV�*�<&k:��%��q�j:y���n!ˋY��p��n:�BWz���܏������i|�<�u��"ʳbJ*Щ6J@�{P
� AXd����᱂m�UԠ��i:�|��p1ORb�$���<Qe���@��aw��!gK����E*��Yd��e�/r�O���]Dy3\�4�~�n�6QS `�Fqcy�D�@��(l���pq��<�滹Y)�\�"F��ܴ&L�i���2ȼ9w�M�(!�9P���:����S��������_�H��Ѭ|��l<I�����#��>����M���9��lv@y9�-{���a�&�J�)vќ���F�GK3��
N�|�<��#���͊������.i��y��-�ܠȥ�s��dN�#D��9�h� ���?�������z[�.�W�3�:�dO+i�������tV�6Lz��K��_ø�L��8ƨ�u���UG8/�a��@���9ϊ�v��
���ӥ���o64�    �ni{�C��{SMy��N����y��M=�����Y��C�f�S�2D�^���.�$xk�R ⋱K9ɣ��y܈���y��Շ�_����ۍ�&:(yC)�Wu4�,���u��K*���D2kh��o*ء{��VS�ٖ�x$[i��ٜ4�^�x�|`�"�kJH߮��&�"�K\Ps9X	����,� g��<�y�<��B����*�F�ף�*��$�:S��l-�K�.�ד�������:xT�cY����bR	�{�ꆈ���ɳ��c�\��~��ЎTN �>�k�[�xׄ��2@�ea!����,�b��k��U��Cc�+���s�TR�I��m)x��W�,־���j���n ������eJ�Uc9\}/��A;Z?�^]�CY�]�xn��K�]h�4^��){�e�8�q5���S�k�h/{���VS����>)�O��#Zb=�)��'~���l��{	�i�X6�>�å@7��.�`��\08u 7�b������s7��_X��a�r�I�o�=\W�-M~�<��0��1h5	㴬=�n���>"`�b��G�fS�El�a5��m�4~�n'ub��u���"� h�����S`�CYs��� )�֑�������Hm�mۻ�t�׉��\���n(���@��+���5E.7��1;���Q���1�h���z�f�ǧ���r�����c�\�[��E���+gJ�@7��)5�|Ke�@)�����Њ*�
��Q�82V�Y��B@l��`�=��A/��nC���9Ņ?��v*P�4���>|	����ߴS]Z�S��O|���r W���z�@t{O�h���<\�B���0��t�xus8��4XL�F�sq��@���Do�[�y��lQd3���J�Npk{&�e�}�%H���H�y:�e[	����M���P�_���Z��~�c4���c�R�%�\��c��X���J�FY|�ZLj~�Mj���[�)��si)��MZ�ic`<�Ćt��8@�%�Ѫ�w�-�M�A��������ul/�uV�'�Lxwg�|�:�+�M@,|�U�^l���_�����8�?uw�����U�2t��f�sX��E���:B�; x	(��s��;x��ϜP.�:���f\9 �!�)�d�ֺ��m|��
y��
΋q"��zD��P�$�g|H5���$������[������T6ݚʆ���A���	��R�$���A۬Ml2E��p��r�]��E=���Eg7t��J�����;�h�צĨؒ��ͼ�М��|($�P�7P$ G�"�?ӆ�����k(�C��xC���P�6%v�lCy�"�h�ν�r�h����Z�뫋Z.Bf��z��[�V+
-7e�@s9Xˏ'�W�������� �WD�Od�9��$+�	s!��}�X1��
N�w�t�1
��&��"�If|o����\���yk-�����וq�T�~g%|��j�3�����`�a2r�zbqࡧ�m LQ�t�@Z������h�1��C&�� �֥E�V~t��p|Ԭ�0�N��ǳR=2�
�+������Τս� o���5�~�q(�r]�j���y����qzyz=�EDb�uש�D���&@�2)s�g�z�>�Tn��y?�o8�M�G8a�>h� <�	G��]tώߑ�(Or�v��:��-�A:�����5�D��8H%�;�@�q�� ��A��@�UƇk0�� �n3�GϚ1S9dz�LV�3M��0�W|ŮY
xзZ
��uQ�����<4��-Ŝ'݂Q��YQ��^FY�[xmD�dU��\�[~�����g��](��XH��9�8_� �(�v�;��9���)���[�Iz,�g_�u�ۮ-�+#u�-�����-�= Р¬�����}+�����n}ҙ�Lv�h�8��bS��Z��C��zUn���E��ua�ve������G������lCf�CY�~�N�pzWi�U���+�0s���ߪ>�N�����F��F�J�IXѢ�xQ�i-�:4>��;+�?|�A������Iܦ�W�
��dP��
�1��p���F7���o����%V��đ�<?V�[¬��Zg@������ y}����rnG��h�|��1�!P�	�" �Äb��'��j�A�ng�	K0���m��D��넶R7z>��r6��i���u:�
��aǒ]�aj��vt��0��T���<[@����*|���b�}s�z���o����E��f�*ay�4����6�`������&�Fm=�V.8H��U��o���۪�1�<,�2f�����	Xfj�TC�t�w@�I��GlS�t-�*���=N�@�$\3D
Mׄ;W�9Zȱ��1��lz��������LH��*.����[[�O����h��篥�G�M��T�f�O'~���~� ����ّx�>ِr�Ը����O�RV�V��[��
n
���p[1ѣ�|:��<o�׫O_6��/��ݰ-���>� �I����փК��VsJ�����n�O�\y��4\π��^
q[�-p&2���@���H5w8���>��Q�Ag ���������,�V�����V����r�F7Y�͂��v�?\/��$����m��҄���HY*����pi���PLg��ׅ�R��X��^��w^R��|t�w��e���Z�;3�X~yX?��R�8��rr�"�y���!s�Yض[	�.d���3Yc&^/#>f<��ܗc<5#��^��@�]����&�NΚ6��P|;����w��-f�Z*̾=Ƒ��Ԡ%ܡ���3Y�ǚ?������dv�ߐ������ן������+)�/ܗ^^��C���|t���~5>�Vn��ԡ�P���`R�=�bg*%:������2���D�6eJ[ژg��<����q���m[H*0�llHq�y�lL��k��?�<=��-#�V�@V�75"P�JV-V���O �jU�n�h�ou&=!�$��`^������� ���c�T)#�"&on^đ0��8��߹� ���\�,�������������b�r����<�:P��7q���Q������v�	�6���	�"LH 0��*������;�SѱJ̆�pAE.dvg��,�~��7�̌[����Xh+���s��E���\ոz&gn�z��Н�3�D"cQx��/�(z��(L�F4���)�X�s����Ղ0��:�Z�y��dJi&0{C#_��7
S����r�0���<딷����3�=��dV��U7DS���6m���	4�s��so<_?}�6Z�:�e���n줞L1'JIF(
����c6��ї��p�[Ҩ���﬈��H���Y�s2���o)�����˷�d�å8�����'�v�l���h�t��Cb�(G^JLe���x�sS�d�L'�e�\X�9ⵙN����)zMX6޼����[�o��d���C�r�0 ��nB�3
���8������وcR8o�����?��nG�D�w�f_�������D���m���>�}m���)���� Q�E�i��I��d�͕����p�>b���{`�Xz�DrEOכ?����*�m�1n(�Cv7*k����A�{@k�<s�0�):���2�n0$�i��p�h�%m%�ۮV4�f��!�&yn�J����6<��T�?X�FB�aP��`ɞq2:x|Y?�|�G4~�$��)�\o���Sޚk�ڮ�!�=��?
�RŅs}U�W��*D��@�1�C�����~a"T�n��J~?"LD����R٘y�Aa[|CM�`k�)[�T��\��]w�i��J.��+���D�^����+��Z�q�4�C��ec�-<��r��gW����!�� 0s�`s�zU��u��(�� �����pZ��<j6�	��s8=��y�'�B>"�3��c���՝	�}�g�ZS�~=�Tz9\�'�ڙ�	������SYy�nw�nw����vzh#~�<)��Ӓ������py�c�������ȹ4~f�    �����L4=T^Ϳty�`�֧>�ȳ�o�9�t�����R)�`lzj5\�����d�CYA��S��Iɪ8���&�&����g@�dN�DXҦ\�8�R���9k沥��YLvN�m�sr�+��+�ͬ�W�����������,���dh.��t��DH�/���>s��ܦ)L����<K���6�T����k������ZbT�U���E�V��D�@ے���p�)5X�$��i9D��D��i)l%�rn������/�eϩ�t����ڈ�׻�R�c��k�(��W6���҅��a@�w��ן<WZ��D{2F'��p���6M����~���4�{Ӏ���> \�o�<�of�'�ݿ���\����ُy��w�P�'�Y.Y:���FD��I%�+-Gs9܈���%�6���Y�=���עuiM��!x���2x%e��\��;�a'L���D��k�aC� '�e���9(�ъ�2�0?��*�C�y�����#�EW,9fm��6�Ѯ�h�wV���|�,!��E�P�?%�N�!��)j�lX�sV"���bt��z|��S�,����t�	��.n�B���z�[xsYq��{��ql[�9�E�^�σt1��%[�3%y�q#�βՖ��$�}\���� 8�����{#nG��$-�\	{X{�������������ԫo���Vh�P	�S�� j.;�C�&�[r?C6E"A9�p���9vQOXݜ��4_�� �ם���u A��} T���HR�h�1-��/�-Jp�P�g�Q��M�	r�Ê �@g)��+���9�"̃�Am��*t,�.xI=�ۧTXY���jKM��s�!�(�����K�|��Mu�s��t�a	��>�'� ���G[�[=	��l��d������Q����gsN�:1-��ҳYT��9,�zd�Y:H�Ԯ�u|���H���n���(�p<��r2_����X.��b�l�;���:r|���F�h�%�9�\�UۺY� ��@���]#]I1���kA�*��|�*��7�yG�[��L��B��wQ�P�\�x ���^�Q����Z��UVAI
�~�
�b!��NI:Q������vs�bc�X��1�!J��{���=:������TpV�7~V�2�E�P ��
��6!���з@�� ��b��=�
�p�\bE�
;[���U���S�.�fd����~֯��eʷ+����l��0?ɺ��%T�O�32PxS:�n����2X�
�����ʮS�-�;���b��k���C���{$�N�Db��]{BS˝A4$[�m�`�gE����2��rO��?��DB��80�'X5ˈ[�!�F����[+(8$��w2�'�%P�;�K���^S�v��;e���H�ݺ��PH8b�P������*��KG��;0�$�y
�N��a��D�8a:�%�G��ƺ1Fi����"Z���CY���Rr#1��Ǆ���k��Ƣa���Rn�$Uhk� �ۆ8�O���<�ڹ)
�)Jz��&����/��q?�PK~��K^)wNg����X���������"TUf�|���Ę��cʤ$����i�V�"!�s:�lU+�$>���C��d��\d8�FTT��Tf8�K=�[>>|�5�vs_�����,��Q4ԣ�pv\{�W_-�hYTA��2l��e�~\"`ۅ�.\�Q�E""��Ԥ��x��r�6�����o�_�T�%ŹTr(���t�@�,�O�5>�r��
	���O��){��9���0=�.��0QC����X<7!䮟�)��B���sw<�k��kO�Ą�O��'T�K���3��zzX�Ѫ5�Ɓ����Z��Me7�}��{�d�u���t���RH���q5igS�~z�����I����3\3�Z%�
%��GC���*�W=?���3���u-���g��ѦF��Y��Ee�e��Z��fDEg���B���5�#��<a��v�W[-��Y?Yc��I��dR��SD�^o8;"`Uk���Tj�y���$�:r�<b��v-��)�~J�X�?4������d���5W_hU���\��ζ��'Q5�{$�+U9fBR+bP�'�V�j��Bt_H�N������~Y��Z�ys�~��ۅ�n�x���~�����'��������W_�*�Ʈ��䂢�	�;	]w�{�[0��^��P{�������7���&��C��p�-ܺE��e �hVw.��o�ӛ?Jwq�����n=�����M��g��d����C�p1gF�}�=q���.�-/� �=�Z�6�N�>�*9kΣ��ߧ�ݐ��B�B�.@p�BG���^�J��h0i����	P����]j*���,���l
�3s;��@�����SJ6,Pu�K�����$��l�sL�Y�-�!VK1$ü���Ph֨*��ykg8K��ϖ��͸Et���e1}�����f���֝����BK��k_Ὶ���Z��nC��4@��Zc����<<�����A(��]�I�忠��t�C� ��V��C|R(l/��ĕ� ��q.���Ƞlͅ���!����.,�l�Oo�mM/���_�??~Y�}]UR����n��d.�z�����E��&�'�t��$���<)iQ=E���_�?�����ٿM&;��ϫ�է�m����Gs}����B�z�<o�,�qid�0�������ggw|_�I�k�|`�W����	��ݯ�Ԑ��"@ZU���Κ5�r�xd0�b�L�Of�sߨA�?dg�������7�^�V����B�!�04���~��v�j��m��N�k�(��(��-,���~]s,w@m|��X:�Хc���n�º[�.�nXMJ}��>VB����@	��X�p�>O
2S���F(�>�=фR�?dq���w�l{OAU$"���)�f�U�;��怪�n�Xb�TK�.lH���E������E@�0���L�ĜA�Ε��H�����A#thXF0TĴ�z�|=l����!�졮�l�y�4�-���07-"�m�.0Z��q�n9�����a�}:�����]�D�W�B�EĖ+�gq6r0�9���cH-���������w��(xd�� G�z���xrUt��;/^�B}�^w.̀���;��cѱ�e��фyh���Jq��b�`�@���f� ' �Z@� L���5۬I��k	��ɠ:8�pº�s��4(�9F�0��4#Xk
wc>�]n
��Sa��غ��Tڡ��cG#|U#uk�gq��4"�&�C�v>ga�oM�Bh�pC��"-OB���k ��U����Ueyw<�?�2�����÷�×/��O ;���d�x�+S�f\Z˞[��Z9}��A���^�ρ,	��6�bB��_�a�ġ1(��0��L�4�&�׋�D׋k5�ܛ�^�q���Y���WbΑ�<)$B��<3y�BR�7�'����SM� ������B�)����]�����,d��;�K�]F�0a��8���I#o�:����B�� �x���Xv<�7�y�7�?\ ��`7$>y�h`��O��J�ަzc�/ٲs�o=���_�ꎻ�XoX@�Cv@BpѢ� =� -���v�U�P#U�^m�M�Ȇ-f��O����7\������iգ��Pwޠ�*U,+�/*��2����:�A�����V7"�uΙ�l���<**AhO�?���Is�:����n��-��rGs`��`��F{b���e-�O����-�^-n�>�Gڀ��$,Ê� ���H�ҕ�z:�Z@�qqsA�*�Ց
�����^&�|D�m+��!�d��0A��]�6��1��H����Eq�`!�l��mG��cg�OxS�4zlv�;������4��Ӵ3�)�@��Oh�I^uw'Z�tJ�C���ӝ�����ͭ{��=L��?M�_�V�˛�w������?L��VY!58:p}w��7^����V�B�tr�fg�8    ��<E�ak�7ː���r_�	����R�Z��#��$�/���K8��Řs���0����ܸ�۰<�G�-Aө�*-F���g,=����b1�*��0h36t{Q�?,����-q&B���p��z"'�˓ݺv^w>g�;	EXTor&x�l=�4(r�|Y'��t��`䷼-��=�<y�}�i3�K���N�3��WB�t�� �	� �M���(
|x#*`��)�­$���O�_}�~�aNN�DFל�"}ʫ #W�5��=����Dyz|��ܨ���oB�%I��]�%r*��b|��`o��z~��>�+��F,.$M�vm8��--֝�~g51�e�����!�-������ �o½�y�w@k�[i���BQ��
9�4|��y��W1K���[�����껳j~.ל�~�X��J�lÄ&"��Y�r�n[lo�Y�^��#:���e���ʽ:���^F�/U�Uso����6TbW�ZkQ��E�(EjvT:��UZ��l:��i��t׫X��mb׃Ԩ����gϭ%po9pS�-G܎��t�㡽N��j�He��3Y@�c��*5���
k5��MӍ>Q��6��{U���p<�o���!���Ϩ�Ȣ��Z?��̖�Ƣ��~'㴙K�R�>��d�P-!�}I ��9�DY�;�ˊ��H#cFC �h"�QuE��$ڛw�R�&�����,��Z�.�9W���	��r"#�+�4Y����$���	�>ݳ�/̾8ڞ�n�e1}_�VŎn�C���"�G�$�����t8�Au�����mұ-s8ۻ	.%0�lFC�m{*�G��Q4lE����}ۏ�Mm�۠�~�؅�9��`��w�g�Xd�Qn���n���/�nx���=�t,J̦瓓���bz~~��z�&-\��D0R��z��\-�<v�i�2�D����&��$4m�psLR�P��>r�LH� SD QD1a����Y29ݿ�>99����,�?���*9�ɤCz󨿂e8S�'��(O֌�M�vM�i>��Hn�!�����K;77�����:r�7�7"[�c�f;��h�9�gJÕ<SZv��L^EZ�C=�[��	��1�*NI�Q��,;ɔ��Jf׽s��(~������+X֜�����C5�����_ɫ��v�X�|�L��-]�n?/�1�L�	��3@�4^���rf���xa#ÌgI ;��5ޗm�o@�]x�R�S-�����pD�t%��ޜ��u_6�~�װ��iB�&C��}�Y�X`bl��lz3��A���˓[y$�<�z�G����^ ai
�j�ڭ�_֜�a�E��ɚ�q�K>��w�C�VW�09��������@�_�ݜvf*X����1�*�T�E�Җ��0���i��k����v����ߋ�_wSL�����|��@Qy�y�l9����l�n�� ��șW��ذ�-@]�����*h��[��eV���b�C��t�*�,���Ru��N��^ln�N��T���uӢ
3X�P��`�	pH���1��HS-�0(avͲ��>̮�s0�/۶����F�$�4���:qK�@�� 
� o���N!��8�L�Y<��%YdL�Lfoɳ0����g%� -@6Cq����w. +��������b�ة&vȌ.	L�>�B4������v!��d=�n1��N[�}�|����f��W+WA;�h�pRP��4ّk��n�<?�h�-��[0\�9؅ ��y�8 �w���(�;���w@jO�J��� ~t������
ќfw������p�ߍ��#<d�����;I�����z���~�P~�9��4S�}�Ý󳽾�kz:g�ÕC����P1�m��n��x��O�W�B��hk:"��}Cu�s;�I-�e��� �ZNL7d��ǧ4P1@�nW��qo6S��������|�d��L���u�X�x_C+gݽ7�Ϡ}r��i�����E]���l���vsw���t�my���	7@a&D��K�|�����4k'�o�W?Ad�����Ӕ^оC��6\B���ݦ�Q&�4A�]~x������HB-�AAwy��ڨ�@Q�;7���e:���w7�XM�6�A˛0��X�13� 3`,�K�n�=�L(�P>���cR�v7H_���$���,�K����Y �LՖ����i:��צ��Sb� �[g�)�����`��_�"��G��GO5�D7�d��8���=�"J:��H�*��X����\R{��i(����m� A�	'�@&���u�UH���{��
�QvPsO�rC@꽌z-n�*��M�s�W�(�Siw���T+a�.���:�4�e���nE�ˎ�'i���|΂z6]�˥�X;�Rm\������TP�U4@5,;���O�?L/.w�<����z�$��t�(��63\��������J9���������{��3 �LB>�z�կ��ّ������h;��@���]�Q3Z�n�L=����@f� 7
j�8
[%�z��g�2�;?ݚ�ă�u>g�|S�u�>����#6��3A��f����~ KrWଶu�����"�'���h�*q�b*�5�+ �)P	���#��[�}ŭ�)#�C}�ռө@�zӥg�_Ѽ�S`J� Z�A�.��9O��7��G��UQ�VM:���RLf���͓�����!.�P��{0��h�*8{�yEuĴfyCl&�|̓|�b�I�pa�ڨ0��`^�hp,�����9�U4`��ַ�Zj$�F���vXܲ�0=���FV�.u�P\I6HLԼ�,�Q(�]8nz�&¥����]�:(U&�.���,��*w�r���48pP6H�/�o)[� �$��8�z����Ǝωɟ��	W�����r��Z�� F<Uk���R@&y���}\=�L2��B@ת�ǘZ�3<K+q�͒��z�<\/��bgk��o|H�K�� Ug�������3�'���	W������y�0�s:�,��"#ٸy�U��8����Vpv��u[����Sh
2=?�ή����ZI�p*���������yF�<�C<g}I�#���ߗ�����(E��?n5x�<�g�]#��&���k���@����2�2��c���>A �{"|s�έ�$�^*1��l_��\V<�΁��D��p�3گ��_�M�o{�[g�p�P�����O��	�b}�Do�`�6$d3	��Q�Cx:�T��*����? M���`ۥf��/��o�����_7wS�|7�	�ҹ��Y�Eh�e-���yJ[f���Ȝy%$i�� �CU�������`��6�\ݯ�vwT�ڟ��n7�u�ө���L��ճֈI�4R�L�m	��+�Ž�4��(dǢ�#BT*+�p�Z�C&��;ܸ�u����k�,Ad����bU�C���3o=�w&�1��OSnBP��nq�ge�#.k�[O�[#�^ �p�-h"[�>��c*5���S1�t���������0�R���|6�������t��8�C�\��|�G����a��;=�@:�
���p�p(�B����+d�2��:|Y!�u�P[��7ˍ�H���]�3I�V.��('��]��!�7��\��]H��������5�����C���r�	x��F��P7@� wE��~P ,�n%��]�����~�bwlhS�ȴz`Z$B�s�FI�ֽ�B����/qkEP���_����a��Y8C>İR�έvC�˩;���Du�����^�*V+v��1=JR#�w>g1=
�S�tB�����i]5�z�)* �^���;����U
��|�B�*�"�(@��v�$n+)�[^w�(�XF�a�e���<KR�Fu>g�<�zSjj�(��C�~��ܴauƀ4���C9sP�-�?��_�<,��Tʀ�t&��pF��"�nA��;�����
@��q�P��2UK4��V�K���"	"3�����p������*��~΢:o�KB�U�~�    X}��p�}�-�n�����Zga:3����zGc!�d�ه=�k-��8o޻Bf����攁�0:�	��2JS�x�M�lqs��ů��	&�� X�vu$�c��� �!@��nig�+�fp�lr��䑿��:�'����T;Аb��s:;k?D�@]K�Dj)1�u3�۳y=!�K �KjI�:G��W�#�b�T��2�gs��u��4<猪!�S-�����A�]�?�VX5� Ug8V��^��Z�)x�k1]�y�xx�r���|9>\��vurF��2�BN��>p�,��~y���s5��h����V����h��	���� �mt��-t�	4��H>������J'����u�^�Lv��yHz�^��p�Y����io_�{�����͓U�gv�1�#5���}�{ٕ����(��Ěp\Xl�?k�����zoAI�Đ|��M�ļ}n0�A���?Lc�q�0HYY(F�k_��M8�y��8�=QE|��*�U]��k{w���������~�8�ڥgs3�:j�2S�X�����z�]7c��a�rf�T���p�������G��[�r��������[{:���d��.Ч�$$��V,-Y����~��>���mL�\JN��X����^e�㿉�BV�O征}V��	��f$���Eo/�o������S�d%�߭��,�܊�"�@[j��*7֮�_�Y��Ӟ�PO�?���na�o�����r������9y�\�)��̧�x�_�'�m0�$+
�e�4�as5C�Zд
k��q6���@$��@]�F�/�����J^������������|���t�tz>�??)��Y�/`Eu���ݧ��?���׏���~TM�� �CLq�8F��,,Cᝦ[��i�l�mL�A�fz��s�)$�6���ơp��j�Ŀ}�GIU����0~�9ѓ��������fN>fי�f�	)��,��i.��5ei�5�Y�×~��[>�|�Y����է�u���O7o����!=��sJ�3�}~�!yZ�0��Q�;��5y'��g�g��P]��e�{1g��Y�\>�L<�w�"y���I���V�PJ��5cd(��J"=�j�Yuc�K�zc]�ue�"����_���OV�����SY�gǽzf���[]z��[m����{�Y�!0������Īq�PL��ф�t��҃�>�,.�@��� _����L����
�M0��g����$n���tPu�נ>���*�>˲̙�����Sw�0�7��_Z��� \�0,�$�j�"~Uly�3���Y�Y�L|wA����vf22�ׂ����?�k�s[It�(&�s��;����{29�%���W��C���R>[�5��˻�Y���ܚ�c���p|�s�����o���tS|N_�4.�бo��滰�j�Bi8J����qۤ�������:���u�tv���c��$|O�uĠ`n;R��)p�^�Z��Ւ+�p4��$��Ql��9���H�7�&Z�HF�l����fz��P���V`���Ҕ�ox�$�y&�&��}SV	bΡԓL�pDˠ�J,ǬMU���ǳC1HGy�'����	����i�rP�������3��M�/�t>g���6�l��a��3�Ē�������) fm��"I����Z��x<w��iY�sϝ07m��F�����x��17Qq�*�(?y����s7����9f�QjK�7mV5F���Eb���������vKg����Kgb
n>i?��,ߤ6\"����K�/řI*;��`$�L���y��ul�j��7�,�"�"�Uo��^L��9%>HL����z��m
p^E~�Z�1J�A�a��M��.<Y7���\���H^Vbo���Cj�������}�������7_f���v��]��JtB������ѷ���
wq�mq��\�[�}-p9��(ᘦ�w�b\��V�������Z)�����<'��
[��A�;cM�C-�:��M@�֤3p�g��ҙ�ܛ52�9.+k־��xE�p���L*��� 26�6�Ā_w8�U���6c�mޟ�Oda�G:�)քk���_޵dت�U��ܲ^���p�6��h�Qx�	hz6�k�S�i���a�K޴�����A�[U�lM�G���u���J��{�>���0-QZ��IU_Qٜ��>{��]�]�*�ڂ:���NP]IG���>��ǉjK��5�j�i׀:r�����е�F:����_ܯn?o+ʇ$��� p-$�R�~�L-#|����|!����r~��ߝ]��y��_�g���O����������(DXA!X,}��d���7�bl�-�f�`\!LLZ��&��ٴi軭�ǶjM�'Tg[�9p�L��B��%�om)�a���[E�	��)�f7��9��>�]\iߡ,Ա-�@T�WY+LʺaR��g�m��h� %[zIUwX�	���|Awj'F�
2Ue�b���~@�ꢽ=LS&�g�N/g}� :��_�!o|	��nZ�k��V�d��a�*����p�R|D'G��f�������xwYJ,w8�d����Z����ђ��B�kP!��c�mo���,���>�8p9'�^�T�g��L���s�n��>9]=|\�+�g����.�"{��םp�z�����$�Ĉ~��-t�5�Cl>dr�������/䊅z��f��WnH(ٰ��C�U��s۱��6X�M�Vf���J�����|4SL	��k��o߄�|�_�������a���E�\v���15�sawzV	�� �fx+i�cohP��L�i_$:l��������}h2%ҡ*�	��I����'2ñǌL�_o�J���)�TTG%)�U�)�z�
L5�s\�����t�t��Ö��#��/�����v9�X�ky?=]�]>N�-2&LA��P�@@�+7P/wJ	;��>žo�3��ha�7Q����{c����潽L��=h��w}y��l���T�0�OJ��кF��>�a�ؒ�Ve��X���W"50T&��8���JD,K�2��3z�G��џ�����u����Q�y&��ul�dK��Zs����Iѝ���"�+m��x<߫��l��r[N���o��]̟���>�!8i����25(Y�*�������2�-\�KE��O#�������2e��XĨ�1B�.b�(��n.���Y��t���E���s�(�U�+���ީYl���VOX�Tɓ���6G�dn��U�u��KŖ�dǠ���m����[N�,��=��	|�(�45�)��C��t4~�����n�-.���Z��{m���Y�c/#g��Cu�e��j��eq�E���Ti�V�v�z-7�bs�+}D�ǐ6@��t��;;m����q�"��p&��~S���2��::\�fI̦��6�����ftff�Ҿ6D��)���b��
m9�Z�3�0.j('>I7۹�(�ɠ��C�9+�:[�ɠ�m�KH�#�Xk[yZmYͮM��ׄ#;���ہ��szAx�dv�*��<B����
�+K��X7�D]В�m�#m�Ф"p����yt1�q6�,@�T"&FQ�u����B�٧�{���d��/^�vC���͢;���0��[ѐ�K4i����I0:�q׻�����8	�<��ip����Q�bDc��BUg�I� :�-Ը��i�fs�n�BB�����_��Q%
�w,|l0C���vs�0��.����mZ��+�������3X��B $��PR#��3�zA93j9a��a�4� ��) �J�)]����.��c�Y�c�JJ��Zi:(��o�ZZ��F+�Zj*�o:���)z�{ �{�,���Ճ�?`Ѭ񤴃'J+?Q����*�*1��hP��b�A9�4�OPK|`�!ɇ4������=�� ����d����-�k���5��Y��4�z�}&a!����S�_    D!Z���eB*�����(�"XdA���,��hC����:��1�]�z�;Ӳ������a����Vs=$7{V�t%�4��V��c�Znb_ž��i*:����"*XD�ĵ
�C ��퉮�/�)Ċ-�;�i��GS�<�=�ESڈf�W���A� ��L��ip�o�����	Fe���ԩ�ճ����Xz6���(-%^�3�$5̚�x�:K��@<H
+�dE �[Yf8Vӡ�P&�j_��e!5A�X�0r~��۪��>=#��1Y��d��Y)��xL���d�p�lo�v�xߡ,�{��i����Q6t���C~���ݬU��p�ݢV�DpcLb�wD8���l�d�#��S\k�����Y�cwf״�3�ڽhs�]�j���'�@�����{b3�)˟Ȣy7/[���| ��e��xOD(�.6���m&�����\~�r��]}�Y>Tb��ٯ��^(�Ъ�5�xph���K��@�:'��I@&�(eP.#-�e��B!`Yv<v	y�&���}��bsw����}���˻Ow[�W���kO���%�}	E����jݺ�K?��cX�P��4�{[!���zw/�5�횪�i���@{���4��Y�!\�+D����[��uK����/$�Ha[�dN-B��Uv�^��<iqe	v��GP��YK�h�=��vR���S�}t�d+U�3Gs�\��$[�:�=OG��UF��*�H鴇j��V�TaJɵ����m#�+�����H���K���h�Q}�=��X���B�q/M��F��"�>�у2f���ڼ��,��
PjV{p%�c�-�0��f��d����Mq�Lo���MQN8$5��_�����Bl��������/?>֓7�2"��A�>}����ݜ��x�;��D�}�azc"Z9��s�F!�����fA��o<t�~7��r�9,V��'���?�WߗӸ�P����_n5*�����a�E8��2G���|�0������)�V�(|
"Q��E����Z�l����	�[�r����O㷷#1��Sg�<N�v�${<;'����[����`�h��O ��͇ CB�1@��N�E�,L�IR���`�I���B��	��ăEixE&�s��5L���f��t6�V��B�"�n�cv�����I��YE1Ŀ*fu�yqw�'�g�充���@9
<�Z�HWD��p$���I�^�%�:��/�I��.6�q+������[�P�LV3YDM_I�㗔7�8(�E��Y,�T��R���vXԋG?��	���_ו���x0g<�R���u&�,D>9)�����>d+�����&�-�ܟ�:4�`��x<���/:h�Ȣ9��5R&�CԠ��t0Z��0I�~���x4/m
/HNt�fq���b)�dP�^s[mj��|�E	>+*�S+�t��a�ғ��������S	Z����~8jO��*3�U�*ҁ�0����d=�(C`#a�Wϱ����I��'���XXf82��ẳ-�]�u&;G�e����-�+ɗIˍ����.�L���g��gǻ�u���P��KX &�z�w��^&ȡ�v��5���¹��-�@��b�ł�jbӝ��I�\59[�\=��ys�������Sh�֜���Q�n~3�yք��.�H�����/���dV$��45��0͵���c��J-]8��P�:m���C��v�s���s��,6!r�]- I�:�t8Ι�jPS8��ZF�h���N�>ЩY%J���YУ�''%�	\�a
J�Y��^ �l�Ѫ��B��d��7���D�T�;g��V�B)y/�ĕ��Lֵ��.,�ȡ5\�*�~k:��k=9xuq�|b�U�9�\���X������b�20(�ݮc�P�)�^R�o�^�8���_���_�7}�_~�Y�x�~[>.n��B��?/<#5躑F�UE�V{>t!g�m�Q.�-�M��̱\���5��|��]?�r�
 �^�������5�����!����)N�!�q�c�z�@�L��P����J���E��؉qo��M�*�����(����π��-�kĲ��4�1�p�lv��k1���q�CM0k��u<u�5�	@��&�}�� ���Vw���dL��J�X�Jhဖ��g4qvzL]����wo��W��V����=���m]���|��	�}��!sHc����P�Ծg��	�\���ix��
k�T1��^���g�ϛ��Oo�s���4��?�t�f>e��f=�(3��zL
�ҽn��JR�E��N@8��V٘"�ǃ�L��gC�t}(���Rd�J�̙A��:�`t(VCKSh�YQ�*_g8O�R�r�X�6�Wh�r.��6���8��f����?ҭ�,3��J�W��Mg�����i%�;��Ҳz�QBۨ�����ڼ�(۫���,�a�Z���k��U5�%7U�.�Ֆ1��x��U��7��x�Zq���i8�F�9x���x�w��|VQ��,�;��'	��w�.�I��\�|LwOr7�&:@3a��Hu�)�+&;�������������>�=�k��	�����EA(���5�k�N�T����������!?�2�������_S|��>����p&����MJ7�A��6�i��V�� ������z���^�*�z��M��*�WYv<��|2�~��	$U���Pv>G�ڐ)�7_�cc�a��bKQrv��[?N]�	�DQf��@D�1D����xdp��v��\LOg?��rZRg��1�6�iXh/�ԅa��4U�ׅV�p��p�ɕ�RmP�tٳ�-�EIh/l�L�u#,X��V���������B���P�=�E�BD$K�%��� �H3P}zz��c�����g�s��#���~�G�>�E2���[b�h.�0b�K#�[���b�\�<.��~�����z����x&�2�g��՞@��� ����o��dw�8�&0k���V  �U��RQ��o<rwgn߂U��|ږ��Y y�!����8�Y��e���v��F��7�% �qg�*��+���SCM��ѡ�Oe�= �Ȣ��c[g�P��/2�QT��h4�k���B2wΪ�����w^��;��7Odє՞^�P\�a��K��{�YΗH0cn
����^jv�lV3ܴ��6��A�F+b��$��l�nŕU�-���5�R������,�QO��"I��a��b��>S���پ�\�6��� Q烬�3Y0�Uc��Ơ`��F�����^?���?H
��7߾�.�H�t��C��Ɣ7�Lj(Ś>KeWl�)�qf8�8�����/��f�ŭ�4��?���V J�uu�S�4��oYW=��آ����U�A����(�>�
-�@��|)"߰o<�F"���k.5E׿s:�Y���a���bPA̺b�n�������ʺ�j:�B�!���J4��l�7$*��YAu��7�RQx޺k����ԍ�+�3��,��2hۻ�Y,g1�JAj�%�����ʃ���dl-�!u��M����@'@X�b{v5�<�p�~,+��r3NnN��W���j,��1���8ݞ��/���gۇ���g�7�j��qN�-��T[<�������x4�\���L�A�LV([VSuMkH�y�_Z)�cg^w樻[v���<��н��܎�~*m�T���N��ޭ���Y�l��f��w���rv�}y|~�}�����%NZ ;3�XPK��0��U��-
��@��+r�TA�Ձ�	
T���^^�Y$��ˌ���2�2s4;K_+��f��n����ر����j�6��e��Rb�k�jE7�yЈW�X n���O���O������e,�a��,�Q�
������7�^C�2M�t�[Pw�ޅ�/��1A2��AG�y�n��~Ӓ$Vz���û4�x.��<�E�]����P�}R/���+z~T����))�J:���4J�D&��8�E�}��b+q!��l�c7.��M�*���HV2��N�Ж��t�1Z    Ȋz���a�	�]O`�����R��U��v���4�2Z�k�aq-�n��.t��!;�ZT�NW�v����m�:��n��*a�Ng-pi6��V	��3�xP��~6���k�@`F�dk�٥�Ɖ�p��q�'��o��>h�H����J_��ɓ9�����_,�o7�������[���12����*K*ه�pd�K�u"�� [��k�ա�
*��Lg��a�ߺ��������~MoA|��"�0��ˠ\��Z�M�N)xC:����X�X�bJni�>%��&�:�@hFCc-wi�B-�ud����c{�y����21�Z~��N�3�b�Y�pcu�@��t8��|O[8�E�:J;�B]2D^e��iM׵��1a�ʈL���3Io�d������߫����*r4J�p����9��7��Z���n-���N���fo>r�+�t#}��
��(��֢������`�{v&E�|m�Z��=�Í
�@��Z�ޤt�����|�����_Vw7_o>�����s�� �B2�c3�<�~]�I[�/�ơ���z��tc�p�����P>��|tF���wg�A���ۅ���ߜѷ��qy?�/�?��- 6&J@�Ok@���z�Q���rܷ�3��[�:
���D*�h��[��&	?$|�\��H��wYO�e�N��k��|p�$W
k�pF#��nD��.q
�������%������Vt{��J\�68����,���ރyC��e�W'���J�b��j���h�]+y9ݻ�y�|�P��>�:����^Ò�	�|D�=����G��徝�����6/f�{W���2--��.$��&68����3����\w!���_�w'�0K`��e�垨DiX�^��6H䁚�,o?��ٜ����iz��4U;�'8MU�s���5M�0*h-�3O���Oӝ�>/��Wn��5m���ԭ)�]Nܮ��Vϭ�J�8I���Mf8�͓G�+�l��3�R����4=��N�-��M�>A��k�ږ^u=�n>|Z�\ޮ��76��VTr.���TB`KQ��+���1�(e�\�H��['���u�g��dZ�9���<'��<g�L��x��Ƨ���8$����7��"�VWb�5��b�u�㗊�iT��-�I���,��cT�����m+zHD	H��X����E��9���A=ID\eX#�Y(Obz�S��*��j�9E�|���5�r����,�\ ������;U���*pxO�|<3�����9�t8�y�"*����<&�x)}��adЫ��pZH�k[u������p<�W^��#k#��Y�lO�j-K@De}kf�; {��'�f~�} �瀝Q�Z�G��ÎϜ��q��ݏ0˶��,���F���,���%�L��!W����XM������rj��T׈Һ04������v�㻇'���d;��Ȳ�y%��bT�!Q��֢���e�mM�O��5��e������j�����É� f��f�\<ٔrhq�P�9B�d��Q���2���,�|]�?�w���u���-^�[���v��|���I�˯��$�t~kӏ�a���fȭ��p�}�,\z���eU��a��x��v�����f��V�B�g��nS�K(Q7�zx5�r��
�1�mcL�C�YѪ�ߏ��l�ƃ�6�"����~��s B�����ڐ1��VDp�uh�z���R*�q���A��/��r���� ���ǯGdr�~ov~�=?��Ϯ�w�1�s��H�:/�6[�y��GI&��*a�Zi�&s2o����IDL��#}�?���'TTE��n���Z��3";�U�i�XЌo�8���4&�E���Æ�_d���Z�l�� ����GU;`�p�l=K�Y�����,�g1�%ʁ-���Af�~ad/]O]�$��fnz:��E��R<FQe� ��ر���!�~G{�T�mg8י�ro�-@���v��P��͢8kRɹ�9�e9� H�K��e� j�O�~�US�H.c{�Rg蘧u�]T��0�k:�\�Z=.*�4of���,�������$N��v6��%�C7B�����i�A��r^$0P�����U����JSg���_������p51ۼ(���	�<�ȅ�����B&L�L1�n`[C���e0m[1o�������������TcB$�{+-_�Y�' �t���.o���O���M�I{�e��������K����ZSb�nY�^#t�wo>�cV�3���@���G��z��[���������m�|2�v�S#�F05ĸ��-v��V�5u`V���t8ӝN� �:�˟�b����6�!V���qZ��g�z_�b�������OSP�[��{����+{�7	�b=e��(&���D�nd5��j�/�����O�����q�-H#V톕 iU��CP���p���K5+|�A`@}���\wdg�A�R�͸��`�4t�#���V��%Ȯ x��2;��
�Qw	M(���Lb�����Hf8�C��g��p��)�	eP�P�D��߁&���^5Q�^2l��x<���	*h�@��q�b�*��`�ip�Z�?��o���[3�1���b��x@O�)*:��*�� (+MQg�*%��w 
1Rq�(k����4}���zj"�� (�L�}�[�d��γ4Y�H�7��O����"����1��@����^�iiUL�A��y�3��Ns�O���%8ˎG�jTA6� ��_��ޡ2Eum�0��V*�u��d1xYEu-�͒�����Ѫ��c＼j�ίv6/���9����|O�j>WMH끮+�4�V�j@�/�=����57��m���4z��?�������Hf�����������P��Qga��CV�9�B�f����e���5�y���h�D>M��49��g�ON�W���fK�#]}mڀ�����wg�O��ZŅ��ɕrbwW`���Rj�bJ;o�;n� �2ʮk�QcK�H�!�.*��ն3�z����q�ُu��������?��'٪�A� i��(��I�nӺߢܕp�]�֤��8G��)�~��=�`�9�	�d��@u!M��'���I�f-އ"��P����/��X�CSs�	e� ���T1�*�({�5�e��_=Ȇ��}H��h�����!���{9v�;X��q_��&��o�*����XQր}� �s���q����������4w8��jMp�;�[���*�!��(�L��pH�7�����}��%�sjL�=��$�ɦ�xd
üJ{�n
{rm҆���,��"_OSĄK�)����f�ؘ��:VK*&��鏝��}�uJe�Yb�@,��<����r���^N���\׼rYǅ��x8/���p��_��zl�=���V�a%	5��-^ϊ��{;�Y�7�-tx�Z�7�CllM/�vN�w��Ώ�.7�绯����g�'BSE���82(�`|�n�VdX}R�%�Iy�4�n���;w�Nxc��Z ��X���m����8oX_��"
��f���Qdl�A���_�:|^ D
� 8o��!���!Y��P��_��S`�����-��n� 1��ݹ���ܻ�l��|�:dK粨�E�;�t>z�R�[v�i�%�{�J�F�)�]��LQ���#8��}C���-~��<��A����J6�>�O�϶�<��Z�t��B���짣��Î�\gV��b�����\��pk	Lj}��B��L�<�s`�ɎGZV�'?Kx%��PYI��m�j_�!'њ�]���z��� "9Q�7tg�Y_��a�l�g�c�4�J��힨��Y�xU�d�����W�p9��	zB*�R��`��L���Zm��ښ��S��<p��/Ź'8���!(u:�DL����	`�&ǌ�;�p�I�;�[�WZ��Mw��'s_�v%ĥ�2}����Rik���4�5�ʺ2�!�A2��K�/z���o����sǳ�y�6�>��]F ��8��ʲ��[    !D;PM��#l�Ww7���_�}�s�~�Do;<Ngg�1!��
;��慳>b����H��M�9�3�\|�(\+�#%n���x�˱z֌�� ��@��J��:������)�G�~$��Y$�#�G��OSjP�G���E�H����#y`&'���7/g���*1�ރYL��+�F��mrџ���@�6ٶ�6B��M�q[YfK!8I�����ql0A*�����x�������n�kAl(H�=GN��|�����|=;�R�z!ѹW���L��j��. ����{�s�h�w2u�v�!2�Hp�Uv<��zӉ��"�s:;u�Ti�bXr�B*p-�z��o�2ejʔ����p��������@��{�����jVa�]>h1%k���E!%�Xݶ/�s�nK�;�vNg���MJ����{�A䴵�t,�;#ں3���L��q�����G�&z���X�9����Vt!�0�sW�<��%�xEM����}�U����w�Sպi��Ę��Ĝ�������)hn<v)��9�Rw��3YH���XA��ݨX;�ե���lES�3���c-{Ų�{�.)�ڷo�٣'�Ϗ��ҳY��V�jQ���
�0������cMV�&��MVS۩�p�j�M�d��`{�r��5=G��>�5m��0�NO*8F��g8Y3c��6��D�������8q=��"�� bw!�@�ނ�t��!�E&eV@*Z|8���wp�>�6��Y��s�t~�ß?�?O�[y�p�_�B�x���r�_�������vQ�[}��K ع�K`�?nM뛇����L�n=l�:W�CJAk�0� �%��*h����h�����l{���PZ�m����g�S;*�:c��&"���c]�w��@ј�uX�ձ�t8~eP�����-�rp� g����Ԡj����#��?���"v����)5A�L�U�DL		��@w&��e�&,��EP���:�B��J2�I�J�����4�����?n){���|0�����ⵣ�k�*�Ӧ�
��ԘҳYXm�UP�X��R�.E��u�Eu���v(%ݟ��j�g��A�1����{����*��=�o�Z�A@Ӣ����R����+���S̎�O���g�����������AZ��+��y��g<�Ph9_����Ļ�_S�whxI%\SPg*>�S*��hn���?<N��ʭ>��/�6\N�Y#����Jm%�7L��x�_��������__���O�m�{4;�_�L%В��O��jb��+tg��j'����祃�
i5KYh!�-�	��QΊ�����,A끅�?"M7�2��K�t�_���������ͷE�*�9���u3{(���#(Y�]nCY��P��6��v|w���xtם��}��[.}u�?":oVE@�}�J���b^R�8~�_�������`z����^ǩ�Ͻ�T{��|6�[��M�g<|�Cy9���Ȅ[5eC��g[��SX�{w�	>x�������W�i��V�<3��t%rz��j�����8��c����-��i���<b;ޓ����a=�{���=\���ܐ~
��e�� zdbx�Y��4n׹�n��Ѱ+�V("�ʴXv<2 �#������nS�S4a*����d󠇍4�kP	`���뇷�y����n�X�b]�����s��l@��"��<��G����t�p$�`������c�ь��mu3�K�g���.kUN�������{=9�u���D�J�@ᦲQ�j8Uf�\�jۜ�������x\/����"��A��Z�Up�.0�Wh-U�6*rQg8z��9Г�]l~��o=9������_��q����[/ʢ:�nWE���>�m�}�`���>�=��t�F�+�b���N��7,�Q�,����Nk��.Ĭ�n�y�'����IM�������rd\	*{��#l^٤#�n��y���x�[��4m�3�4Hu��k����j�%2ñk�,��i�	�4Nd����.�m�s�� �V�p�	0��hmҵh�������`���:P���p� f��E  �SaR\�Iq^g���x0?���a�lB�V��T,�y5�G=e�pb����k�l]�d낦t8�]�fi�� )�!�KcfV���*j�,�/��s�@%�V!D��.C�p<�&��J�c��l"�Z���~�
1D@��wúW��p��R��֓1�GӦ�As���}l��l�(����5lw9Vل�?���^w
�;�{�TM�;��nw`E.a�t��
��MRgR�i�Hk%��2[e��(s�����u�L�vk=���)g�h�Š������GP`�ĬR�CG�'n�t�Ղc�%�R��<yS^;o�e�#�%���N1�dz�5k�ZN,�>\�2������+�� �����V_�9�o@�w���Iê0. J��g���V�zf��,�Gih����:*���c����A��a���z{Pn�D �{ �q�9��cCۇ����2�+�v��	Gp9�pá8����y!�}���Y9?��-�%�|.U�@1�{݌��w�s>�J�(	��1KƩVqo+�~��Ϭ��g�x�Gj�S��jЄzF&������ƥ���+�2{<�7��!߈���TϦ��X-pE��4
o�k�����շ__N🩐!�%)�|0�����`Vh�}�)��t�J�8���="[��Z��K��\��]�l�6v�e���_�@��������
g�1�v<�������ʫ=�~N��_�ZLW�.�lW�Ӑ���sc9�=�P�H *��Qd��:�V���F�O�V,#��Z���H[����nx�H:a��U���*���|���(W#	�3���}�5A�Rb}o��8���=�Hbpq0Yq���\��Zܵ�o(�!�p�0�߅�݄_���{�Ⱥ�fT�x�s�Ne�V��O��	V��8���B�_<,���<�8���xdl�����B������*�u���lb.%?D�TA7�$Te�x�"M������=�Ş��
Qa%Q�J���;ƕ�fw<ڈ���L.��<�[6�za�(�71J$ĺk1�}	��D�x�`���p<�n����M1Cn�d���b�Y;C���ݡ`�Ѝ�C1s_��j���͑+�����jv�3�@e�݉�4�t`�QK|�Z�^��1A����yi	ٓi�͐L�q";�e���R��Lj6�����AQ�=;.�_YG~i�M��g�J��ˡ�֣Ud�?.�>PL*-��z_,�[&E����XpMl�g��z����m�=�6��N����.��~�������Qs�=�Er'��#I�^��E�n@���G�aP6o�=���
�;*��v�Ι�P
ͱ��R�̙�^��)�U �!>@��\�$J�ح��%֮��AO�V[������Od!ߍ��(��$1�y2��5�����e%���`�亃M��g2��3���42%���l�+8�6�R��sw�6ۊ!�u������a��i�[��g�hV�[Q�Q�	=�Rh�I|��AJ��)����w���|�'�����} x5�Y�^���E������^�P���;��`�U���^��������z�[}�:l���]g��"� �85��D�g<2�����0}�=�-�ռ�	a2��;�'�/���jR��'��s�F~"��sg���2������b�ĽA��bʫ=,6I���lf&����n���#�g&D"����~����-�z ����{��r��Δ&!��1�[K�|3��ȸ��\M�n���vϳ��ϫ�էF4�m�œ��*F��^& ���:,*;���p�sLd���_�}�?�����O����([M(ܔe�U(��^�ݻ��l��?=�]��#�ɔ�OZ�a�oT��I����M������k�"����݆Q����8���I��mZUæ���ķ}1� �*�ח��WR������uSY����@(Ŝסs��L�-��
b��p���w�x�ǋ��c�j��s3u��b�((����1k    \�.��H\��3�R ��X�)��0k�q�e�XI��xl����hh ����j�k �@mR*�)ֱ�g��GIQn��)��a������m6v�p�d�h���k��t8~��SI�*�s ޞ�N�*�U�B�!�]*[����9���U��`[Z����O�x<��:n@��P7�:����F	e�o�u��TgX�R���V�N�on�n��t��l�`	���I!\L�s�&H*A�j�����7���Zj�ֱ�A��M`�~��z@ec��&�Gi#U������_�i��R[@��PC��V�Z��>��"���h4P��|�x�������"�*6D���֚Aͪ�8� �Rv�S�T�M�"P�Ґ,;��,ݗ���b:�JWf7*��cB�|X��i����+HI�L����mg�OW�W���{��2�F|�I�YA?�V��A�t�Z������p<��җ\��@U^j~:�Yj�~� SJ��O����L�!���Y�3����J_zUx��Ǭ�*��X#U=�����rڪ�|�&����F�D�U�%���C��N[,�z%�tH2�buB���e"+8���/���hX+��%�{ƣ!= ��i�o��J��������vP#��T�?)��:Un<Rڙ�����t�����
���H�Ϋ߁����(ֿG�3�I���5r��ey���{�d�{ ���U��o�w���Ԙh�iR{�T[5wbSip���ϛ����x����0J��W�4h�ZVMK�؃hn<2sp�ݱB�M_�7�����ҦO݂j� ��0��:R���.�Vn8~��������.bД��CYL�v�c U�@j�#�z歋J��j>�免����]}G1��b����p�m���|��y5nQ��Ƞƪ����k�
w�iX})�'��T�'�j���OI�g�CV�b�@\<b��P}�X�p_�hp,!�/A���qg��z���
�4 !5n����yҧ	�QM�5��������_�����-��Xv:����0��e(��ذ��9�����x�x��$J��5,����,��:����I��^�s�p���49��
��(��͍aA���lweH���(ޚ�,� g8���.�a�{ �]��C�BU���Ve�����f�6Qb���"'��vG9��D��}���I)�7WX���Ky��P�}š��E�-���A�����,��k�	��M���TN�lF�!J�fRH�⼺�TW/��E�4Q�вH ��p[��`f��Ʋ9��樣�lub�7���(�w/ ��m���d�9�������,�#�
�^�(�(G� �i�E�z�%�X�K!+�@�ݢ;U�k"CwA�P0Rk��D\{�"Z��͟�Se�z��DwOvH���{�*��ՒE%Óy���v���[4�&�'�|�V� NxL�L���Ԕ!�K�E������8z��`�����Xv�ǆ��e
�%&��8N7��IA���T��q����o� ]�^����G�7vǕ��𽣵=F��Oj��ް�2�`�n��4��v����R���@�D-�e���p4��<Wm����/>\�s�Գ��G��ϪA!E�6S3�nP��u��X�mG@e���yL����j���x���<_:t��
���l��܌�+�Ը[�X���pӣr�Ԣ���T���󼒈sq��ΌoMH@��)
h�����{��)�u�{��=b���ySږ
�@m}�M�I�n�H��k��6�R�V3�ǯ�MVb{�:�	�]:Ёs������Cp�z~�u'yC8�q$��p���7�����=�{��N��h@�L���z�ұ1m��K�$E�
l4�z#�����e��W*x{5�˨cgcڶ3?1�h��y�ܭ��|2�m �k�v
�V����UR�M����|ݟ[�|��+��bt^1�o`�t��L!��[��ܖ��3�n�f��?`,����n�f�����<&m����Yo���z�����#m����{&}I��0�eDvk��è�bK�Rņ�B�nmm]�G�|u�vI%�Y�����Q*�kdM9 ͣ(�kK����!�k�m)������{i���x�2���6S#mX�
�^�"S#M���"z>̳~j���ƚ\��UW���=�"�4�q�*�$J)�"e�@��W
��BDm�B��Ig9�Ŷ���Y�O�����J��i�������c�qa��� �� ��ȧ��`��;����VKD�ZP!-/��.Ҷ�"mjM�t8ֳ�j�Ҍ�n�DʳX+fK�bLC;����Rx%�"t`g8ˋ�߲�l=�1[dKe5�����U���M*x`}T���0"�(s`˝J�!�Za��r��{{��R�+r`��`΢ʁ-�K=H����%�2�+m�J|�3�䕜�,o|^L�W?�c�g�Y$�"-�mJI$����="l(ט�6էk�2�(w�6�G�U4�H˪i��d|^� �B�	
Wm��j	�C�(��q�0-��9H���"@�_R�5rg�K9Q΅r��c�����Up��� քS�M�v�ů��G��[V??c�d�x�hqt��d�ێ��KGsb�L6k	��;��r�D���bɂ�j��D@������=#��c����h������cd�@6��X���1������	�Ff֧A��Q��na�R��Ђ����4���T"�=��}H�)�k�b׷q���ͫD_���C	�ھ�XU`���دU�:���ב����������m"q�9�M:µ�����:I:��2W�ϋ0w��̖H���	�I�63��a?3��	�s��?��#��#�ޤ������g�͖�X�-�g����<��p��QG�&�f�P��#�����w}}�{9E$2I������G
d
�3<=|\��7t��|�YD�DIL�j ��= �b��>�it���w�)6߿��Zu�{�;ӿ7��!r��G�Z&+��E�8����^Y�h"^�~�
�$O��{����FgB)V?s��,O>\�nmȅLKC׶�zg�ˡkӎ�󬸧	PG��a��=���Yt{�}�9��J@�J ��_R��j�<݋#_-s UI��$|M�u�^��*�1�C�+17b�rk�qq�H8���<L�Ww~P��ߧG���x�}\?N?���1F���{hN}pi�6P���1�r�aP[?����8�rvy兖���̡���Tg3tt/Z~�`e���i��j��M��G��IN%ԛ@�V�?M���<�@Ϭ�j�+u���m�l��\��ē����,�P��9�X������?�n0��r]�C��P�l�<^>�E��������c�&�_�:�,cB5DTuDT�y-�2&�AUg`G�g�3��UUa9֘8a��o_�b0�/�;T|�OX�_��g��\�\�X�	���մv�Pީ�Pt���:�-�� {��/���am��S���E,_�����М7/����nq�H��`1��7�ъ������6ŁnSs�r\ �*���M��QC���ay����zF{��G��p"/�42�v��=�duA6�V�<Q6���1B�+dS��	��џ�:9���x$�;m�m	��d����>�����g��ѿD62���M�.,��y����E</R߸��S0=�6��|��WםD�DZ���Nº:Q����׽������ԩ�^�}�`Y��d���,�c��C�f���&%�v�>�j9����E�h��sW��Þ���<��}Ӂ)���z�'7W�׬�*"yS��v�%AǲKY8Ժ�M�N+�s�eۣ�9����??as���q��64��8g�qz������:�����L���L�W�ן��? �w��؛~Xݭ�o~�8�_3�r�9�H��XY���wf=�C}���������bqzs1�>>//�D�u��p%��S�Z��=��o�� Z?R��`��e'<̎��8��q�R��u�M�B&���z���޷})    F��9\���l)k�gB���L194	�Xzȷ���4������L8�#´S���	�kwKV@S?���aR΂���#����ƶ�@�{`&�S�(� 76n�}�q�'� ��sN�xo�a��n�	��x�~ש=�u��m���x�w2�W�E���/H��6N���UX�G��Ώg�Xm���)���T,Ԕ3Å�)�	�z�%C�n�mv�� �]�����h2l�
;��s����BK;a.p�3N�%}m���)�g�� D��,W����v�L�
(M$��3W�Iy��_��-�8�(,u
X �����C�4r�P뇔��U �0Ki(	�8dVޙ32�G��������㊻����q�3`mP���G[762�#)�@��O�}fVp���/���s�9���qq�1=��H�JBi�Ѱ�:�V��3��+0���w��χ/1�^8\��õB�dq����h�A��0��3���9��w�l����:d�����;��[`	��һL�h>3a�ɜ[�4�Ϝ��!����cEA���HDH���fq��N�H�����T{�sx�$�c%���F�[�ѻ�[8R�H
y`�jK}�CH���S�z|8�U9�p��Aç�^���5�>��<:�OO�W7ש����"�'*e,<b������-$��읡��r.��:�+.�2,��YI�� 2+������d������������zy/����,�~�s��T*��H6̕m<eOH�1�|���Mљ�����Ԡ�������X�q�'���YL���EA�n��Z�oSP��L�ĵ�)(Q�֟l�vgz=�:�9X:1�\]\Ϝq/���vP�b	2����(���� �����t~��1m,BI�|�Q��*��[Yc
dF.!�4�w���Lϟ>�o8ei�N�W�j�'��>��Ua9�9�̮���?1u��lE�D�ye��M�I�Y�#�[����v}�w?��S|���� �s�@]�)��sC4�xu��?V\�E{��.�w߾n�Z���4xg�'��/j�b��,����v��L�Ev���&б�i�����ϻ���� &��  B������h�li'g�������� �q.p����y���Gf�r����W�g�Uc���
�U;7�����~��V�ۥ��Z��cB��%�X)t���B�)�Ǌ��4�/|� T��E���e1iK<�C1mF%��`�2��o}'<�N^�{2�-V��%�[�E�Ժ:��)�]a��Z~�
C(;(@�����S_|T���F���q�c�4�*��w�ύ90�&���i����8jw�6:C��J���s�0�jG`#�@M�&��a9FDz�p���j��xv��\���T�ɒ(�U+R�f��e�e���|P/����!ܶU�_m�{FHf��,�.�k$:�\`ӕ����]R�ja'IK�	N-��؈�2f<���sU�vd�eo��9��|4��?9�ޛ�:3���I����T��^�����')���'z��6z��?���{]z���?YT%F��O'u* ֋����	q�*�*ي��{7���!��n)ѝ=(��A4Y�:Bu�N���zk(��	���!z����ezYM����"�V�r&T��P���"�1,|+��޸�֟��n�#[!�h���,{�P-C[&����ZL�P�s��p�^��
3Ua�]4��l��rr=����8:�^$�;w����l�H6SB�[-UO�<�6�$ۡ�^{p�t��B�v�Twh��Q��r�N9�=����?7�6U}��R��+���._:�H��+�FWh�s(�;�'��NMs̺?5�PW~40� 0>�Rn�-]T����ca�L�����~�>V�k����͞oQ:\��X�Ӱ��z �"���ʉ�n�x��#"���s��O���Dd""�s�²+�`�ezN'���F1�C��\�?������x��@u��:q�n��z�^�7	���y�����)��{93�:aa�N����=������!���'�"��J�4�V`^��1��tS��n]׻���Q����GH�"V�9'�{� ���ӫ\��Zw�cA��YN8F�\qp�y�6���+nx�)���Vn�Tq�������g
2���Xp���l��.��w�OE ��B�TiZ�*���pȮ��9{��uu�����is�|\��|�^R�v8K�*CB�`�
*u�g�#A�p��~ج�=�@����#%p�������\�\���K�=���=��)�eѳ�h]�T*tZ�c��zr���~��ʃ�q�|����i-�˞4\;lg7��م�Id�0����7=_�X��?��
j/)PXa�����`y@Ŋ�`�-�>�?=U�U�$X<Q�d!�8���ƓPo�kAُ�S7�b�&&
�NF&JR5��v�����;|��>�wf�O��o�~N��P��sE��J%�PzCڱ��[�O5[Gv:������l�%����6Vr�@��\Z�d+&W'g�l�5����Z����ο���{�(g�x�uKN�ʆ��P�a���.5=Y߯��w��(�}�ܭWw�����!�z��~�MJs4�
F/B�ԇ��:=QL�ZB
:��`Ip����;��/p�� �^~\�a�#w1���	k,�R૞� �Ja�-6���?������eR�� �͌�!<qd�c�z�O.f�����~�C���(��u":��s��pp����&��~�o�ˆ�q���ieã`=���h)C��V�I����
˱�4Ad�OEHh��&BZ'0���m��ӆ��'N/�tB��T�H�6������_��6����G���m#�j47�yL����!�E�b��XT�N�
S\�|�/��|�>=��O�ߋ����#찟�6��ݵہ��|�霆?~6Єosc!��!���1B�'h�?���li_�~9{�q����c�jeN[7s�e��	�"�u�+�i�(^����|CݵeI��U���8��B�N�"���Z��ZIj"� �N��˲Y�,̈́5��) �*,���E R�����]+=9EY[������q}?}�y����s�l�%�/'�yф���%��t:�f5t�tBW��a��=�������.gh4�Q@���tjw'���1z��w34$�Sƥ�P�4�J�XK����r����z<�Gdr�s���w��S���y8��b�RA�^|:��o�F�&T5�ͦ�N/j��G���+db&\�D��*cczw9�c݀��f~�=0Pw9(���Y��F褳�(��czI'�����X���x��t��|�93|����`J�1�[���ݭv7�� e-�?*ƹT����j�o/ǃ�F4�0i.��bN�yF��a�m:w�h̴�/�%A�Ya9�7�O�@P�aӚ�7?>��'*x7?��=��w��og� lz�73�k������?l��<���-د`EPK���R����7�\�����[��u�g�"�t�f�#+p_�
vX��M� 60q��^t o��� ��8k�[)��8D�u���4Ͷ|�9��2Gʰ�Z�&�LzX�6�0f�jX���S+h�pJ�EƮҧ�^t��2����N�l}Q��jH@*`�5�g{�J�ͨYH�>�G��v��#eD��d�R*������'�Nhb�ӊ(�M_��xP��M�t��\�r�~%m��͕I@�e���B��Ȉ�e0r���@�0���w^+���@�+|�?�l9|i
Hlǎ��b�*X�s�xO*����<��O�`��,B��5(4jc<ܓ�-�@֠���lۨ}�JR�"�
T���3둡�7���������a��[��G��7�Р�/��%��� jVrT�
��Bi	�`�'{���ė����5Y_B�$�U��j�C1U�����vh��	M1,�n��{+��a�U5�Ur�Tq=Z?�i�C6�|.��������Tr1��C�aD��?K="ň%X��P(�`no����+��I:�/����%    �U���a��A�m��yd2�z��p�t����X�A�!�G� e���F!ê :R��a/o�Αj>��ҰF.�?�"�If7� Sp��FVy�dQ�~'HPE�@�@�?�`�'�vA��zk�c�y{��|��FŢ�8�{���"S2�c�^I?P-ǭ��d�X͠8�h4��J�ݝ�x���&��L�|���k���LѪ���.����d����K�B}�H�žU���u/[��������9��T-L��-�r�[������x�N�r��<Y܃H?��hG���
��~��
��`�R����-,�K�ig�SU�'�h��f��4�4G�����<��U���,ǃy�Z�1���V?Q�HE0��*��0�&��Œ�%�[IZ�S��P����<�W��ӆ� ��X�8��r�!�j�i%�F#�[��j�=!���\���WOȥ�ȭ�H���p�P�0�w1g'`���]�N0X�)�}�O��O��.ui��*�(��_ |��6b��n��3��_�o���t(����b�����C��JX���(��&�\�a�y�x@�ƆHM�B��p��r��u(�&h�:�`T�3�ڃqp<�2�7�F�̓4����ܴa��E\�q���Soڅ9_/#�M��#���Ŝ�&���h��'(�5�0(�9֊�\b�u*�|�� ��"����qڃ���aU~���VC����8i5�)HD4�] ����1s��"��6�2�V�I$t��)뒺��x��O���ן+Otz�G��.EY�Lzpy�4i���OF��N[h���rԱ��X�� ��1���Q�Ȇc??�ZC�����5/X׼��ݍS�?6?�V�U�X�@	�j�E6�\�3n�?o*���.�34	����ccH����qX�v3��E3C`u7�]��������~6XhC�bF��C0	��<�{�AV�7w���5�?X���@�����@���G��8:d0���q�=�
Ό�0�΄�vAk�Q#�T�E�����i�ٗ����W�?�����m�כ��?�p����%���Q�Q�a�x�#.�#�~�������W�����l���2�)���C>�.Dd8˭G;-�0�����H�][�=�%�ލxr�Cb��>3���#�P�˝���O��l��5���' ��s�sT��	���Pi!��	��N^&Ė�	��߷�ܑ�4�8I�����d+�1��v"8�r+�=3���f����<�� �枝�9��N�B�����l�~} ����,l���.{`R������#�N�����!��q�dv5�q���Nj9����JL�U�x4���cU����w�OO�hA�3G�ȝ4���2��
��$r�V�&��N�ם='�{@ֻ�v~��u�㉤�ݫ�Z���[�c1<������l�ߦ�I4�Jǋx��F�H�%EǓ�C,c�a�[�Y{R���ˌ9+�"������3ȣL#oof���CnU��BO�Φ'w���ϫgѽh�s�!���F_#ҷe���dx�]��Gg:��k?��V��lJ���Pu��rr�؏ַ�L�CEP/+�0P�5�s�sn�1Ȧ�Q��c�}�c���X2�w��##�jA9�ő� �Dͮ�S7�#�p:�N���x��	�� Midz�i��=+��a���JN�*#�Z�G�,`����_/�<t�t���۰�S�)*� �5�M��k'���hۂ���xes�8R�9�
g�87��)�v��@8�+���SĚ=��J
n�����3�.ދ,ƶp���{Q�������z�c�~#��*P�j�� �������C�f�	�(H5��{6AYC<|`[����O/���ǩ��P��3�z�@��jJ��-������P��D�N��������x�x����L�F��e"`�2��u����������(�S�����LB:m��f3� �=L�rkBz��>������.~�p7�4���ф4~�V��[�%k�sU��4�U��J��r<֊O��AU5�%]߉�5R2.��gj�d���!HF[�r�� �g0��pE��8� �A@e����u�>���Փ����?�w�QX�HS[ٽ�
a��FdR���3�1 �B|t�����dJ@�*ɖ�$�H��[�tݖ3���/��d��XA�pYA�Hh:�ƨ��=�m���-k�5 ����+G�e Io �	qr�s���yƔ:��ZHO�k!L���!.�j�?�9�~F}/;lW�1�r�N�=g�"}��x_�#ֽ���&n!����C�철B�J�\;����lc&��[�T;Q��U��E��r=l`M�����a�0���i�`WV��x,_�Z��7�E�^�0�=äH1��J��B���6��+/��1�����6t]&���J����&^)'x�W*��@��a�fR�XQ�z���]���Fք�hY����n�*���z�8��	��W~���T��\'s�th��#�,�F����u
9#t�����6�F$Ӵ���`WJuIS�������d�~Z��M��w��,�;UTs��N8L>�����R\�qoy;��lu(��9L��� � �
��@V\w!g�:cI&�������l����"�KR�m�i:fږYk�}�]7z@�W.�9�!��B>r�h�r�8�U�k�^���7ΪIͦ�tWL�4��pT���+���괤�7*¬���W�K����j��ۧ�Ӄ��)�~^��'H���o�
�ѬJ���-\^�V7�.o�^~(/�4\��\���\�_�@���3�����t+&ic�Vq��r<��<�����{{.�*.[V>Q�rA�ꗪ��u(o��U�ꏻӸ睽~V�a�{bq����Q+OK��H���ۇͯ�o���^�ܡ�V���?��{�L١�?+Fn�q����s ˸t�-ӁÆ	�:j`g+�low=R	�uwz���i�����q�1�|�$�p��~�S��[7*BC��m�1BÛx�-��ΆH�r���Vv����:=�M 	�EX��Z���}��ʶ�.)�g��+r_��s���(d�}���4�Aᜨ�r��x{��X*��,f�&���"��1w����J��E
-��m�dm�Ј��r<�gr��t1����k��e�;�%R�l}͈�/��mLu�/�:��ؙ�Q�����P^Ž�J4��X�{�'�Ŕ���ImUD�W�_������m(�v���Ɓ��.�w�ş��|쫾uފ�<��\$^Qi�r�`���dy~VM̡��E`�gDF,N��s
x�����,���:����0V�8}�>w�1cKfl=�m^9x��2����Yګн�iB��>a���Ԃ�o�9��Γ�u�4��S%�ߑdpEm�yEa����4��.+3^hJ�N���%�:P+��$vQ�(����5�-�.b�W}]���%�i�k�R9OS�f�ȩS*��������7~sG����S�6���=>�����H��>�����z�7g�ӅeƼ�=����OO�����p�`�WTX��j"�r���0,�Ya�qel�O�,G��d۸�ϸj�-�*�qezP�J�A��Adøz�kK��ڬE�[�^�G�)�W)F뽫T^P>SDS�Tx -�(��%F�6�`�x��7ݣd��m,p��n(�^V��`d�)�G*�w�"З��./��Vh�
�B=(�E�.�/v�0+�>%KW~U{9^^�Y[qz^����:[�u�E-�I���QCW�
*T�z�0�ܞ�h@��Pv��Q퐫pZ���(b�HUD��jƄ4p��^,56w9� EeM�m/�cy�ӏ��#S�~,�v�W�f�iW�`M��WtOI�:!ݡw����ƭ�:T|��̢�R_Mw=RW���4���O� ��E˿<��ߎI�V�$lGz ��󦓺@UiL4���X�Y����B�}�Du���ۣ�\� ��lG�v�
005D;��*�
    �;��*����~>��~[��K�@	=�v-cY6Z5|�v��}	��0%Pt��j�Yh��YO�[��~^�Z�m~�7�W� N����Tp^x����z��~Pjr~trty8��T�;T]5k�����1�T��K�Tt0e�:x'�nol�@v�h,�w��&p	j�=��e�TE��Fż�Kw��6;����$S3��&�R�a�*�{� ��wg��|`WHdafU�5��Nt�4Ev!=�Q��>��t ��m(֮n����� �CZ��g�1�jp96�SNL.&�X�<`�����%8Z��1���d^�Z��ë���AM��������Cul`E�a�T��5$S,1%��=c��H!��R�0���*�X��yߋ���]2��~���56��>S����2#��W��:tX��+S�V�Ş�Lu�����?R���������~@ix��L����x��ݡT���]�V_�ɇ��� ��O%�復{ x�=��=�n@�r�^��a����A1�������Km\u �HP�����`�*�q*�Gnhv2����p�ƺ��6�c|���%��cxG�ۏw�~AI(U�{8�B�Gɰh �W��p��f�o!��y}���v���e���
�P��cx	/��U{�q΍ڪ����`���o����b� b�2H�ASv��!o�u���Q�A��:�K�� r��}NbR��qk��߯���v@��˷��p�`@�u~P�!Y6D	�`���l���B��5�RUQF{9LNk
)%=�>Ya���$=E��m��"���ĺ�۝��V��3�Z��>��P�%(J�Pg�B��8Du���!�PM�T~����&�T���5רi�0�iGz�rO�1GS�9��r\І�c5�Ʈ����6�d�1=VU�'g��y���mJ6$ҩ~ݛ	�O��)/9	�s	Y��؊{��/�g�ϝ�B�Է�����g���vF��9QB�,"+w%'T�e�����NLi�hC�$��z_qZ���T=�Mc�R,{I���{)ژ���X��$���.��bd�;TD��Qh�eo}�6���Ү�ƀ(<�g
g�#�8�Ltc4$|@��W�ƦG�{Q\��Z�c]l?m���Ym����?��y�л��������Ղ4#5A �DjX3U�3��]X~]OO6���X��.��AJ%�4�j����a���&p6q�#T�=�<�"dn+�_�t{jw�Ie}N�u��ڪD�"��
���Y(� h���t<8�#�@ 2b��XpO�̑��ƹn,A��a�q����~���AZ�KGKo���u!�����ba���4P�	��:��oN�֟ig����%��H��,�z��ʪ%�����ħ�ݓ��?��7�?ZD���WxVQ��N�5+�6Ϝf��y�x�litג�P�Hx�L��F��z����ؗլ�����N�[�<��1�0�������V;5<��.q����iI�
)�Ƙ�ʬG�����mj6����C%8�
5�D���[� 8�0q4'�9~��U�����p� ����1u`�;ݶb|P���n�Ce�69i�WU�	�q�b�վ�i�ë������������؃^���E�Y��'o�?�(Pn6$crH��$a8�����-_=�g���Dd�H�N���K�v-����)��}��k�3��I�'���ˀUz���NٶR�w���_ߛ�كE�9O�.0�&'h�,'���@̮��w�=� M2T�Ys?��:�P�v2ˊ�qNme�i;�N���v��p\��3H;���a{
�{&�8m�B�����
�5M�d�@�XX��Q�
���M��GP0��6A�Y�GS��9h�@�X1�h_}��w�ѩ0��T/7	�~'��iP����[-$��kn=�N���EHS��}��9@Be6�	РR�wC�$زP�@�w��Xq=R��EGm%�c�·C�達��S�Bb������^z�/}��I��ְ�z<���-��m�ǘ��QJi��
1$��f5 ���F�*�< @�:�^i9΃zm��=F�A��Y�KO�0C���b<ABJhL����x�6|y-���O޷/Yk�8y��Ѯ���˷�9�)<u����ag9Γv�-�vӭ��x����.G�P����d�����N���*[S�\Kg9�W�NA�S�azr>?x�i@�.�*u��Rgb�u��5y�k��twR����$���x\�D�oo�O1=�0V��7hbM���� ������a�ڭ����%��$�`�ѧ�����C���BO���}\Ǩ��̡"������]f�gC��lB
m����lB[@�����J���Ow�� �gT�+�^��? �w��OTRԧg���~T��#	a��͆�UL2�zڭ4��.e��"�K��=P����.H�B}û��ܡ"�7<B-�Am!��b��7t	N�v��"���B}�l���Z���zڼ�)6�CE�?$�V=h��h�F~�W�w	��s
Xj��%ؽdl��rO�g��c
�:�JpO��F�p��u���CE�?�������:��y��_�5T�	���j ����>Q�qY*��GD���8�B�!L���q\i't[�b_-S�[�����Y�u�}���u���g@s]5���4�E�K��]�i�$U?d{9��c��l5�؟��h<ڧ��jq���wo�»����������(���;����撐�	��c�|���]��!����z��P"[�q�4B�*b��r<��M��:q(��E(m$D}�}�);��I����p�|���C4	bg9ȃ���������zPe/��>���x����ߠB%�P�T(M���xT��¹���BB\�:������N@���ȉe�X��b8��{��3e��	B塢��gC��u2�����^�c:�}���q|-&��ݓ�:�p��E<_�����'X!U-GN�&��	+8o?���:���P��m
�5����8*��B;E5ۢ��Y;��M�~�>]�!�b R�>;JH����0KU�/�Cb?�����MA��r<��8d/Z�l������1r���T���8��T+POJQY��2I[��^vhPT�/Lm����}f�5�P=&��~��1U1qI+ ���X^Sȅ����(6�?O�W��?���ܜ��ldhC���N��C��=�.���)}�K��u�<R��D��Ϭ3��-[����rvY��h},
�B��/fv��Y���X/=�'�=�^���O���΄[�	cJio�r��b�vփ�m�]�Y����r�<:xuy5m�y���"��y΄�=���o�~E���0����4�x�8��U`6�+��
\��:��]��ɷ��� ��Ҏ�y�d�戦�g�ρLZ��/�뀆LN@#���9 ��RC��RE��R;e� 5
v��hmh	Ķ"߷�����_�/,V߾��H�p�rZ��m���$x��W��|��*,����9c>R��u���G�O�|���v��o�a��SO0�t�X��Tغ��ق@H��O��~�vJg�(I����¡������G�j�����Rw/n���]��,��"[�i��j��^	�u}����mi���s�D��H~2��0�Ir�2�q~�E���z�^�M��U�,�o�o�"Z��7�6����6]偽QF��l��������Y8����a �^
����2{� ��z���Q�����gGZ�ںh���"��/��BD#FZV0�Y�5'#�W�w��������j�{���6Δ��X&F*���r�h
*&�����xY1Z�챒
�kT*�틨:,�c��"�al�n����8�����G� ��u1�#,d#K�:μ�`��ۉ6�7�6��~�N�p��"��a)S����xn�pEW�� g�g��v϶3��	M�,H��0�869 �0+�3����B�SBX�k'���|�}l*�I� ��m�    �Q�_��5b��Z�\��2��E����L�����PN�÷C�c_�3�oP)��אq�_R�̰��Պ�+��Cj;����r��3�0X��و��ǁ�G7���R�m�\%H�f	��z<��6��t!�E)e�R��<��
**H!ר�
)U(���lf��x8�����g�ڏ����5#��\���&����&iAq�EP)XEB�Z���]-�2�p���W>n����EM�W4��4&�RH\�$���x4�:��nq�)�o4�:�����ZZG3S��d�@ @�T�!U*��,ǣy���Y�������k`��Z6(ｭ���tϑN}�F�&e�$��r<�'�E�9P��$�0��F&����rߴ�6�����9{�ӽD��R�C{9��n�����qwO�YcY��uEf�T�a�|F6��QD��̀I�l�W�'?�V�ax;�
U��F�)h��+�(0+��4%��|b�B�Rb)�b�6~e.� ����*��c����?��"�m�K��|t3�0
�|suT��o�lw�x ��S�ƻ��i� Kgt��.�Lg�,�X�p/TfJ6���BC�p>*��.�$㌃�/(Ӝ`��n�% D��FP��%�W�")_��/������@,�v��g���?W�QO�P�a�,�)��������-��d枫0�� jٺ��O�0��1������]�]�9R�^#opvc#5�Kq�m9�g�`��3��d�����l�4^��B�2Gʠ�����ݭ��
0UuL%7�?��tia��.�a��i(*�����N��쬀��
��l�8���ݵ��_O���
	f5���pMU�Eu�e�]�}�o�dq|9{X�޿����q�;�u��n��t�y\�s��?�~By��&��zB�����R���SD��'��U6ڟA\[�z��Z����g��K�c��^��	s�i5Fp�n��(�Rp��i���j����'���ч��E�=X����FP'I~R��m�[TA���E��ݧ����δ�Sݺ�X�xH}ݗ�~�J�5�Y��m�혵,���N�@���`v_���֩�*�e�lE�_)D	����r<�ƴ!S�ş��E\����\�T�0����YC �b�I1�h�;���Nk������ډ"�6�)�5$	C� "k�|�K��R��m�l�'
��X����r6�M������j��-O�.�)����a5�]J������5��&SIЪ ���D)�I9	~/Ns�0��H?T�r�A��t�B��M�sڀ[�BB��κ�����;��\_��N�G���󣙻��p,�� ��	`�����5|jf,q��_<yp�������5f��(�At����'�Vet#�YgdZ�c�Cp���=�>�:S�����"�q�;0�1Fl~��p)n�0g�s��w[��+�C��L2r�%��J6��RȐ�%R��M�hEj���zD.��'W���D�e~�BU�!im<�m�CTIc�H��
E]�ր��^�Lbb-7���+�ÔUtU�J�Ѫ[�Z0�\0�3�}��3�e�n;���6�Xa��f�D����i􋣳�{G`(�Z����@��E�����Ud����g�Ax+ڞeؙ!Y��o����hR�ذ�YWwt&�l����g�4�|�4�9΀]��x5g�(�N�~x��@~`dT�812�]�N���Hu���̑"�Gq_d�9.�}Q��Iה��갚��<n������ )�2��aK�a�$V�8ı�DC3�����E��|������u��4�\�OT�'���jg�K86ߌ�sm9Z�R�-������{k������|��g�0I� �>4>`�'�D&���`{@�Tb�,�N;�����x�"ox�_!�}��+;�X}��}���V�G�x���*"���+��@f�nLV�G�����L'�8�ųf3��,���p�l!,�UX�0X@�|�t��f♺O�u���D�<o��Sj.���bzx�<�v�����W}}��60GMXp�۪��i�z��h�/��2s�(�Q~eM~_���_�r�U^Y{�Eŉ��a@~�u_�2�������jr|r0�_-G��jb:��!_T�$�W9|wV��i�Vj&M�sz:Nn�y��!v���7����W��������lzpuq=��0b�ա�Os5C��y��.Ϝ��J���q�϶���DԼEQ�r��o�^M��>���u�Na��"��U=�O�kS�	��dϻ�"U�0�ӽB3��J�7���'
Z�!���	\a��&���ЊL^�{����*��3�J�� :"�)C�7EVVɥN�Xm�H�y����zz�����������$R[��`2���*-%��3�W�fr�����m�p��T���b��6c��)��{�jֲiዔ���{bu�1`�4F1��O �$\�>� �֣w7}$&��������=]��d�#QS ��"�
���m4�4Kf����h �'����R��*m��J�"&y��Y����;��g��>��<y�8�Lj~XY��'�:�
����>`�g������w[0�����dH6D=�+�,z|k��>��}�nm�\�z���|�]����L��Z����ǪՅ{�����R4���=ok�7�r!��O?AT3�=�Lq=�C_C�ŏX��5?�o�5_{Ŭ5���&B���7�C���_������
s7�dk�/��4�P��a��ZǑ�HS�|iwQ��B7T�[+�N1���o~a�1vag�uQ��O�˄U7b];�Ҷ%��8�x���$�rN�����~e�"�l��H)5@{�~��yZ���~�u�)ڵ��Lg�^�*��,^(�m��C�2>IW)��p�Ν�qZ��L!|���q.�бx[@ri=�C�	���~���u^J�x�C��o\Z�}_�,�M�u�h��j�;^�9p���:/���O���@h�q��x��3���)��p�����;V7o'w0�vr������ϕp:�C��Eȏ� �{E����θ��������4��y��Htm)�a�0��y%F
ψ��6�UҞYBa�/(���!����d+�r�Xbw�)��\��B&6�O��͓p�M=h���e��8�^LwN���ns�5L{��b � ����cK"A~�7�R��:�BV�=�q&* �`oL;Ô9PD�&�f)ғr�ٚs�tS�$E:� ��(!�$��E6z�	0OSΑƞ��y�NZl��r9yX���bh.!
߭�/.u��	O�6������{���Fz^n
5G���8#Iq92�c�6��6�m�'g�c.�kpJ��PL���m�srx��A�������F��B��=���3�{ۖ��aۺM(��ˬ3w���"��噄��ˣ���d��l �+�dN��!]�$6x'��j�Q����L�Y�v�ݞ���svr�)ym�,b�c�&��iwf�ݥ����C�@[jglG*I�Sw{9ҙ�������!g��O�; o����EO.%������`T��{�������?������4�`ҾV0aݖN�ו�&#2�&q/:4"0��3�$�͸�z6	�D1���8��뛄`�u�4y�2�|x
��Z�9D�Yc�Fn�z��jM���E@8F�����Hmv�۹aR�8��(��#�B�r�K��!v,�+�ĵ�|M!�tV$*Q�gt��5�켓����G���ډ"��)��K���4�-e���˰t.�	��������,�cy��!�̃��"�qP��#x�D�A�ݬa�W48� ��y�r:Q�w��Q���n�آ�{�w���u4T_����C�u���x:�չ�
�
C���Դ�^��si&����5��p+��T�pǥ�wl���cc��jn��DZZIʼ��ùG�sz�����;�J	����4 �,�40�@�����(R_=���KS�9F)�Z�-��#X3��\-g�ˣ���٫���l.��    �e�i';<�"0u� u�5��|R�k��o���E��CCR������H�`�N�U�B�Ե�OM_��r�Co];�F{�;�Κ�F[�]�}��_\i�/tXۇ�����C����3Ʉ}�@�a�����8��?_߃�v{�	j`��W�#�{���m��\���1j_w������4��>��o�����������-���y��u���fP�W��h��̬ǣxԦ��m�.^����>��[rϮ�k�bp�tS0�^(�XMm �#@S&��K�q[f��(�)�^����VW�v�����]������:!J��� 鼉r��A�8���� e���B���h����2ߧ�_8�ʿ�>�\Z���&קgӳ)��UF��y^�>�_�~L��� ��c1�Lwܝ�-0��%4�x:s-���>0C�;�N��A�ư����Q�b�J.G�H���zji�����Ѿ��I�����������鸬��h� +�0t�C~;-��>��0�t�|U֒d��$�Z2}��D�ϧǧo��������r���H�����u�O�~o��/�L'&J�0�5WX�e"�s�p�j�[/5@0�W�0]E����X�07R��Q�15N��� =�� �j��f�@�V�{�`%p��vzAs�NS-��ŀW�0��LՔ���jT}����p}��J���"܇�n,�<1���Z�=rl	Q�~\&T�gځl*'RkJ���A�8c!��H��=TP�b�q���u&��8P�\ᤆ��i��^C�6@ERʒє��,�+�y;,=��Q���u���<Ձ�d�F�AC�e]��R# wf�I��V'���r<������֏�?�C�k}*���"�<��q)��'�Y6��Y4Z�R����+��.K�p���"����z����͹�h���\̦�}:K�d�m}j��(#�X���*u�7/�W�`Ӷ�۝���ӗ��-�n�Z:�����i��6N�0npP@�5v��#5顳�=v���"���ք�h�� l��/��/6Xg�վ�:�=k}*����0��#�Y�r�{��p�}��^����"���i�Oσ�I�0���}.`J�_OK���'�������t�s	/-c�.�Pna���[9�nm�R�����}����gN�D�����r�������x0_����iuww���H�pM�ǋ��5�:̘����9�oF!��w����������tv>�F��������f~rz���^�=Z,/�ܷc����I�71�A�ʁB�Si=V�^6�,��~s*n�����P���typ^�����=�nLe���!ܦ>��uG16�h3ɹ�$6�C0�AGj�����z,��dr6��}�^/�Y�@Q�#��ٕ*Ks���aJ��=���.�*"y��t	̩���n7qf����"��R4��߻I	$�Ǡ�s�a� �5�|�7r�S��7���R���9w����_Un#�����G�7�t튱��o薞���S`���B3(v�@�u
ƾ#���l�])�Aj�W8�?ֵ�$�����
��MNg�C���,��d�%l�[�^�o�i����"�m.�W?������Ӄ��������������w�2&�"�C���a�#�bn=~��!�O����%��q��TaL��ܐ�1����+r
������Wt��}ۭ	�]���1�:�a���"����2?���;l�3EV�$66E��Y��l���{��=��.���CE�?�zJ���>�ٝ��n�R;��ީe���p�ڪ!�iL1����ci=Zn��S�4
������i�P�u�h1Å�.���)`9����T��_�P�˿eT��3*��`Y^kl,��:M�,ǃy������2�0f6��d��Wi��a�㚶�&��֦h����u�������ê��;�K/9|7( �����b-��K�ݕ+q��Yc v��W�w�X���;�HhSG8��Ag���7���he�B �S�ЁLB�Iq�����0�w=X_b+���{6��>=��,�G�ǧ�wΣ���i6?��=�4pIa�	 �l���0������2���fP��T�&X}Yc�N
Hxg��$��Z
����&�YaPs���1%�rf=^�?j0��w�OX\
怚g���c�J*�g�mg},���m�S*g#�f^��ڭeǇ΅��P�&�� � �nq̳6*O��@�T���ψ���i}�}�~�'��]L=N�H	l�~�*�$Y�b6���چ�u�T��,,ݮE����OHWL������#����0�R����ˑ���� O��h�ã�f��9�zi*�'��X�yrBS���4Y3�a��Ź�,�^
 E�BD�j�୰�=��'��̱��E��������`bc�CטM�r���
~f�vR��A���R�8�+Ŷ�ֽcG:���ۘ&֤�6Gk�5�zNs{���z��$:kR�"��r���:�9��v7��pŀg_���Ю6OZO��O ��H�&#�X���Y��s�ӬfK�jvk�\-`��!�%V�P�;X��v@�L�Ti���x:��` ������@�F;���Te�`��h�%� �^��h�n����3�%��>�n��%Z���j^�^F:����uw��΂��6�S�!4��s�0E��"2q��R��}�4�/�
U�F��Ѳ|���ER�}]��3h�;k偅�B%J bg��<R5�������
uON�.w��W�7ˊT���)�	�KYy':w�^Ǽ�j�����к�׋��4̂ȥ��C0L(�L��Z�ܺ)����_�k99���\���xzq�8�z���s�(�ױ��o��Ox��|iz����	-D�����x.r��mϷ �`�9��7Z`��׹�����Bi	�\����z��ho~�I�@l9��+B�!��u����������Y�8�_/p������n�c����0f��8(�J;�B<�(�_g��=��HN�쏡B
p�%�RNU��@����#����?��m9[�%�Q����e��Sd��D�jj��2�)e!���D�0*}ٿ�!�(�ƝuoEb7�j��۵�6�D�6��("+����~&�4�ud�j<ŘOS�l����%DՅq���78�I*�*F��Ar��� �XY���#�y]��������"�26Mhك��VXGZPPH��~`r�؞fj�k  L1��`���476���	���1��cnN�lcؖ]ޣt�(t���D�@u������x��0��gR�M!6�vE�vH�MAO���yU{�c���S9�ÅۅݞF��"��AH���y��������X{C��/��º�Xn�Vi�����@�q��b��k'�c���@a9�:>�t�,ɋ������EڧrǊh[Z�S�*?� �D���`���=?3U80,V{�\A�׺:T���u�8�u��S�s698��B<דd5>����5��m�����Zj�q�hT�˖E�l1����<Ժ}?�;~�����B��c�Ԓia��xsh=��J��:��/�K����AWt�ؽ�?Y��ʌ�����hc���~�k���d��D���C+�I=E/�I��5s6��8tR�o��k��k�5O���4|�ы�w����3��]�5��qSe���r�G�wL����
��lp�u�WvwF��.$I�0��C$��J�X�C�=�R���L|��4.�)�
�c:O��a��z�J�W�m�ϗ�ڗS׃I|�$9��`3��8��ј`u	�����-�gӃ��ߗ�OՄ�̱�p�ʖQ$�iO�W/�}���0	?ݺ���'������矟�C�=>n�����@}?N�Rs,I �i���$V\g6ݳ��R�m{��"�*�|i�c���:8������߼:ԓ�P�2?���j8[\AHb^N�[h?�[�bpK�NtXxyS��m��:    j�-����z��žvOf��l�f���v�O#�S��._���ɛ��x<O����i����'��j}*���E��;��b��"���+-��Q͚�\�{�"���5�>��^j�\d#�*�C:��.�������rvyp�̡ܼ�.y���4��v�aF�ի��9a}�@ׯz��P�TN��6g�Z��6CC�5���D[���J�����w��c8Ȑd[R3��(�^�k��)V&;k�+��;�:S�sL�L @o$י���@�W���q���o�O(�[��9]|��׽��.�*e��4�~aFUAJ+�����Ma9�#ZU��~A"�����Y<>��..�P/.e��$�1~c�+$�T��okƦι�z<�g��5z �C�hQg��|x����G�1��G���B�gq�Wmi�&RX���-I@&4��o}���*o�Va�B�ډ�Vy-:�K�B�f�Zih��l�
5���TDʹ��h/�c9瓓�/��?��6�E��U��:���b��2bPk ]�� ��S����Nhrv��:��!�Aӑ��ˑ5�g�L.���W0�⢨������ 3��+����	y��wgϝ��n��X=5?ZA�S�#kZ�x��<����%4�f��1�YSW
���+�\CbA&��T����G~������K����ዟG��g3=��u�m����c
}������YE.��*�v�x�e㭷���\��|�>����⁬�s[���%)����XEp�r��"�'"�����!�˪�c�)�B�u�6d8�
Ν���ˉ�ϴ�H-�G�%�p	�`|��d�F/^o��cu�fğ�6��_�w�X�V[��|m���ȑ�o!��3Ը���ԡ���5�����GZ��x6B�rPM�VĜ"�P���
!zJ������F�2<�j`���yd���c���s�/X}�ܭ��'h@c%��� �⋌	� ���E���`�й����o�p��p�s
�1Y�k4`�w5-*���:�"�v���6����~q�t��Xd�j��.��Id����s��S���ì��ǝu���b�pŀg_�68�v�۪_��x*x%ܟ�ve�Fh;��x�6h�T/�zWp��e��N�!�U�2�q�X6�W]�*h��HMk9˓NK��-.ӃW���m�����K�7G�;?(�C�ƫY�����[���&��� ��h`/��D��qO��jt��`��Db��`Y�v�n��U��G(I���y�{}Y
�v�
_�d���2Ƀ�`o��#-�g;�z7���ܡ"�\��I�T�Vd5���6l���F���ݝh�Z��vέe�L� s2M^�����z���~�œ��U����G��.\(��:��`9m:_�vB����x_G�3�6��wA���l�р�V�z]���+�74;h\�E�&S������v�	��/x_�������V�a��RVA��z,��:ƕFj9�,�(��.V�����a�V6��<�1@�P��P�u�Y��s���z~:=��sz휾{ؠfWS�ܕ�\
������m�Em'�"�������w������3EZJ���,����2����K�'�W��b�ݿ��k���q��k[P$Qn�ˍIk�5ja�{X�ݫ�t&O֣n���y��u����v<P��8��`2둊��Y�O�/�	�*g=�x��p�����E�}��� lڥ�=Q��A<�3S�
[�%�a@0�FZ쳢ιucuS��	����e�#���}��F�GE��T�ו���\��tx�qkK-vin�#C�J-v]Pd�В���ù��^N�TYE���Ǫ�H�c�ȭU��������~sw�b�E�_�z=)U=�ɷ�lP�����`W&�!0���Si4��s�,:t�1Q\���/��Z��O��GS���{z�^��"�ױ\� %�y�B��x��� {w�nͱ�P~��'���?ݔX&ȷ�m:��,��6�o���I|�^�~�
�n��Sx��9WD���[�(Ŏf�l7:)�\�ǧ/T3��Ӿ흩�s��;5N��	��B��v���y�`p�F�/���Y�X諭*�}D=�0o{��!{�d���;T���$T�ʳ�f0Ɣ�E�UF�1&<����i�	v �É҄�k(�]����8ͬXq=���h&�ͯo!��O0��=RD�<>b��0��!1^�,߆��2�s|�ϱ3q��҄\�����L��s��hC�o�
z@��dP��A����5�TQ�RD�l�_��
a���qK������:�`ɸ?I�Ec���}��q��K�
G�(�H�~ϴ���(�����*c`E[gv�����9��Lkgb+cè2�����h��	������Mfo�W����Hۏj���?`)�l��v_�l2����df���(wZO�Z��sxX���s�1(D�6��z�N�>$����-�O�_�@�CR�!�z��6kt�.20UA����1������Xy�A��g;��vh��ݦ�\L�+�]�pR��5�B�,
�U��L6ʩG��ǹ��bX�}��$i��M���y�O���	��+4`a��r����7��K�4D�~<q^�#��7���fh�������8m�}��N���1���1n'�޺1Z앵i:��H�;���	o�
�=P���SR#�I�A�#vɪ�Q�]}��-AդX6�8U�^�(����v|�(�Zt���� s�*��9�����/�3��ܯ��pN(����Q|�R���I�Ŷs� �	Nۥ�̐KX5��E~����?�0���7�`J��������2�o�}���T٘�1*/��RU�s=T�l>����+�$Ee��h��@��p�vb��0$_��ǃ������0��1���^��7���<U��E��W�����ȷ�ܐ?mVu�*����=��X3�|g��64.R��D%�EءXZf�����W�{�L���}g7>���o��m���2Ah#fP=��C*�R7iB�G�J>�8]N�Og������h9�8��NϮ|.JHÄ��^3$ +z��rd�K��lq��d>�|.�_����~i�J9RI�VC�&aV�j�_��68���X	Uj�f�P(�6[?�����D���KwW�E���8�D5{c�^1��_e�$m����VX���td�r���x8�Y=�=P�s�E8u���a��4i�i�&4)8��mC�Hq�#g��= m M�@�5=���ԃx��@�t�@���(Dq=����{�顉��>H�&��yz�"]W�˂��RPRUɩ�lv��A=j�M�\Qo{P�{���7���x�V�?-t��L��z<���>��6���e-���,��ʦЭ��i�W/����n��������}{ztv���~��n��������ӯ�t��(~&����(B�u�ο`�DX��:�psӛ���|\���'��T��^�`Ei:�.�Z�aq�-D8�ɗ��^y��⇉`D2M�������S�Ea9^z���ۻ���438�b�e��δ*U�s��U�	��5o�s_��
�iH�@�-Pt@� ���
�c��J��~��΁�zn�tDt_0T��9N�X}y�܅� 1/.˺���uiL�ho��]5`g��치A�0*ÀȖ�p����ƪ�D�#$��R%!����@���a�Y`�A�m�>��7�:�F��~ !�Ci�6R�}����͕ 5�[���(���p{���.0<�����TN��^���ڍT@Cل��fP��U
�2t�9��[h�T\1�g� �H���DIb��^e�c���O�Ͳ�b�7o�����_���V��A�y�����D-�{��uސZ���|?�s@�������*�����#��p��q��s�q��ĪAc��x��ZZ� 
�"�S=�
O� j��s��SH���1w��S̝������Tè����×cx�Q�X�j�iڰ}U��)AY��4v��o~˜9�fʤذUa�������[��PM����?V��+��    ��*#��>S�~�L��űT��L�+�r(S����ƀ��Ow�կ��������)ﴞ�r�~�^sA��84�Y|0�"�cA3��	�P��|1(�9s�5�VZ�he[�i�������)r��龻��ϩWB�gK*
�Ug�������Ⱦ��v����7�"�p�w��c�o�ҙ�=Ym��T2$�tF���W�
�!���3둙����\��6G�_n������E��녟����!xWu0�,�H�2p�>����Z=�O�Xu�����C���GN\��V`G�6���/�dv~<�E�-?�-w��"�Z�Οr�b躡��`���<c ��j��x8�2V���+<�6�հ��,��:E��l��'D��e_^�����,���Η�'~lBL��΁��Z�>�6O>�1X4��L����{�tJ`e�Z��+�=Y)� &���]�D���3},h�2M�
�G��k���Q��E�F�b�˲3ձv���M0-��cvtw����}Z/}��Ldvk�E�A���M�k��x��iCh�r��SE<ߚ�g��QŔ��A�x��.�x*�@l/���N�A�X�r��]d*��g������w��1�j	$����
L@ʻ����<����xT߷yA�@���E�T������0���	CZױ/�HC�ES=B���(�,����MN/�G��S���ܱ"�X�%�&O=���K��vu�n�q��;'������㯐��Ym� �(2�5�����Ef�\��-}k�i7��n0��`2��n;�{�5��1d
�U
Cx
~x��CSd/7X�-��drx���{�$����G��<P�g>R�e�EJ^t�Ee�luɢG�ݷ��߈Hdb�IS�v�`�c 2�/��xUb�O�D�{EUq\��֚!c	K�d�Z4��ɈF��u4：UP8mD!C5�]��ר���z`ik�V�X�d3�8��U��覴��.0Y�A!-6L�H
*���Quxg�0b1���i<��t ��z uvi�4����Cq/A��Lρ�a�wZ
���1U�[����4�y�A�%�Q�#�-�����m9�eW��A�&Qa�Q��y�r�����t�wp�����`��w���%`���R�!�����F���xXwuC�:��u���o����_�Ł�`��t��͟���Nc���j]�j���]��;+�l���>��j4�&�������t�w�/�7�$�;i�)�~�[����3�]'�S}뵙�W�?~��c;\�H�l���ᦥ�ʕ6g��r�^dK�ɤ�;�ѿ�$Ę"9�^{n5G�j62^�HN�X���^��<ڹZL߬�>���J�A���Ъ�VL��^�B��Ĺ,|�l#���E�]/��z�G�x��y/ ��0=O��%�����(e4�L�#�p�s[T�4R�����FM^J�@W'�e�A�uq1qQ�����+���f8�Y�a��п�XЦ-૔�!�#[ �
�A�]�qa����*	|����q�@̊�,},���rI�A(�0��h����u�cX@L@�!!V�1�`��/V�_�/�� ��t�`�@�	��'J��ezF�0�!����	qN�}���k778�_�pW�X�9R�� Z��a'q`��6Z"�8<�+���c�[�3"Y�X8_+!y���g�<K���)���,�&�l���;p�k�Ċ�Y�'_��ƈ��V�@�I�k��Mx�Ī	���XC8������P�u�m]�Rǲ��2��Dq9�rpTI���t�E�~�d5F�8���▗� ��E�<��]`���QZY�WX�eIu�I�4x��x�"����2^���x�@�J"n~��KL�*�<X��
eil�D� ��i|&� Ɇ� '3�g��<%�	E�3� �����t�/D�@����Y�|�7����I�q�V`5L�q#��KVQ��H8���qb���>�)Ce'!�,���|R��篥T�_�8l���(w0T����a6T�4蘃lJ0�Q�h$�����#�(h�u
|{�""��3����7wSV K��,C�Z"�~1�X����B4���H?��d�q68����y���2����(Გp�.�`˔��t��y������}�����G�J���p=��/a� :�e�l`�E;<�N�<k�P0�!��h�Y;���,pP�q�<��PZ�{��P��$��r<�Kx���7g�q��Oũ��,��"�C�B*Ue�j(��6�Cf.gk�v����V�z�"�ӧ���l��ؔY{v���uf�n�*�M���;r��o��}����k�Ր�i�N��ab�3B��,K�����,�L-���r{�:͑���|$�*����kAe��!�c��M9�ӫBJ�P�LJ,T��
��z<����+ۭ�2���.!�k=�Iah�	_|�'�����H�aT�oG8�/�g�Av���%�D����;�ΉA�L�"}M8YH���4p�Y��S��&d��\�`��Ͼ�s��|��gQ"��S�<)8@SKU�A��eJ�����b�?=]?����O_�)ǵz�-�Ng��U�4�V$M���x��z�N�R��Z�vqQ>�S�&�b��X�?��"�~*K�s��؟����S��nF����,�'��ނ��I�Tt�X7zz�"��	�<җ�K���?~st����HJ�&�h�"���S��/�Y�wuѩ;չJs����V֜�9�b�����~q���PM�U{\g9^Tkϣ3&�l�Nd��-̠s}�+�Ƨ҈�sב���`����,�tմ��r<��N��F���.bD�|$���D��ڀ�/����2 *����G=9��]�����mR
|��d4UӚ�=�l�l�M��d�-�X��^M�čCO�e�j���Q������;�Q��ϓ��Չ��lT�}D�뷇c�-I�4��
��BE�8l|�,�C�g'�˝*`�)`�8��/P#
�|
�4��fÌ�6Cxg7��7�c"+��Rb֩�T'O�F���d$�J��#{�ك\����v�+���G���â~������DӨNm��۩jk/���[{�E_�S�l���f�G��Uʏ����j���xZ����r4���0L�k�ᆿY�5S�N���g�ȿ�v��̿���ã�r,�Id�aX���"��g��@�\�8 �iͿ��3���fQ�<�i[����d�GA9���Y�^���q}E�dl'A�q�u�	�����;69_���2�c5oT2��5�Xɼ7�U�aW��Ѯ]7���+d�}O�����(R�R��r�&��zw����?������e�fݩϷ(��q�酆q���J7[sz�ϲ����R�@I�TL��'j�{��X��k'o/N�''�����9�ꮭY���&���a:�*G6�բ#���e5�����_�����_����t���8��z����8��w��%x��(��~E5+��5������蔪�Xm��wOׄV	������2�	_�|�?��������P(��Js_�k���K��������ib�Mʂxjb]b~:�懬tI4ݍ����S����@�D��K[�j�Ǿ���r�t7;|���{�,*3G���^{	F���g3�xFV��m��ƥ��J��x�
��"�JZ�;�-�,��pd[�2���~�'�����n���[����w����{2��z�� ���f���@	��ȀL���O��rU>̧�a�&��$�T���:�bV�*�, �&�˃˓���b�\��tw{��`�/���7���p�X����/������!�������`����I�(˵E�O�W;B� yܞ�-R=f*�g�*�_	*��13�VdC�, w���g�^�}In�_����'�de0���5���僅����52�H��h�M�(>6�v� �BM��){�5:�Ȉ��6�i��Z��G�@Q�鵎s^��7l�J>!�uh?������������ל�4g�D�;��N&���`v    G,U�۞���[�y��u�����VD��X���8���pja�߈(	�B�Z��`w9v�v����Ko���,��u�4��%U��2���7DSq�u3��E����v�DFኈ�� �����r$������p��fz0w�8� f�p�+�p��nW��Pl��ط��n�V���&�U�B�r��y'4�$ڽ�e��(\'.Ȳq�Ʃ,Ԯʸ�U�(�Ĵ�l��M�k���R��H=8�� gk��v>�/��!�cF�f9�q;V$��i w�q���������4Wjzt��z��5���)�B��,z�cq���0�7�Jݮ����m_����p堂�P�;L�/��ي�f+J��6V&��!}����,�oY�T�B�8XX���H�d�$:I:E�j%��!=n��vY���[��%��o\�.�4~�҄�H2p��T	�Ʊ�<��I�LUw4A>势]B�[]m4��W��c�*v� �rQ2��vl��|u5�v	iu�t��X�7`�v�}O��<���YGwv�6_^��]b�W^�K>� ��C�¯؟�%�^�'b���xH/��`�𰾿��@�c΋�0D��	W^w���׺�y;��
w��C�[��X��R�\~��-\��Qq*Ub=��:/{�r]�#��ۥ�n���� �zI�@���=
�7�K��xH?�mQնT�x�C����)S=�D�7�Y���)�-U6�M�~��~lw �ā,�C��,�� )�7@*�5�
S�Z���z<�ם�� ����hI%9�B�ŲaUҿރ�s\А�ѐ����z4�Y�V��L!z�Da�ZL�#?Vi�m�h�-�m?�h
V�۪]W����x0E�
Њ,�t�TP��}��\Y��5@fe]f�x�e�)P���s���������p�N�Of
�k'�P���-�7����DO�x�l�#
ײE���"��:��`*��Le����* �-�gJ�!�F@G�&�����b��`��^��� ��ݥ��L�s �݁������FCT�}/t��$�^m�.��uk:?�(�I+��l�s}�a£��c�tb=2���P�D�g���H��.�T:y���i��oC�d�&�W�KZ��f�@�^������zd���cӋlk>4���6m��1���נ�;�L�V�w� _v��lC�\YT�{�̮��~k�����ju_�đ,���ʨf�s�x(Ya��,&��(Z�.�U��hT]�e�uB��D�g�W�"	5W���Kl�ĂU*:Ϩ>x���R��`�Ξ���_m��zQ�*
]�P/���c^Uw��*��8 ���{}�$t� �X��Ciuj=RN��t�-�i������W���~OȆծ���^lnaQ��<Z��	kg9�<�~��4��$��SY@�Fߪ�uE3�5���Ѻ�1����HB��ke��w���癝�_/�.�������9��J�SY<�B����LT	�ūeC>7Z���t��������+�^b^;d�o��T-����KC���(��q��X�e�o'G��ب>���A�4F��Lz�^5�G���&�ǲjk�}����/8�ߩhL�{�njĜ[h_|�-��|�9�5/8��H��
I,�6NT�_2��jr~qt0E�=̂\�?�.��<��]_��V����~<��Z��/.+�U�(���F�x�0�@�����>g�2��LT�~��Ì��h��<��\=�>�>�>��.��҈9�i
�*���NÑ��x���ڊx}��7�.ڙ#�EaC�vC��'l:r��#�.��U�e�۶��x�ޚv=l�b6����.m�S ˆ��Ep��(���&�n�+�0��G��T�4��!�Ef��p":r�Fb��=Z>�P^Y,�ɛݨ�|'Q�L�?��yQͬ���$��0k�6��;�ߔ�Z�\QV�8ࡰ� �bE|w=��SK;�������7�L׿��<>Mq3�=g�?~�cP�nm�W\\�O]����+zB���k�����>>��~�}q����4>����	 b�Nc����0�c�<�܄��z,Ɨ�ؖ������_�������A-ݦN����t��m
L3YD{���h�����g=8˟�by%�}�O3$���PV���U1fv9�w�������&���,~��+�J7n:)l��fζ��c�vs�??����Wj&5ge�!��0�P*I�qȭ�C�Q��y�=���c|�����1���}��>�;?� ��ر��)B����e�K3�y���`��Ϗۻ����HY�.�N��+�ڶU���ޛ6ʩ�J�:�=]��?֟g���e�	������B R�LEj=Z�X���O]�WKړ��ʱ�t�~\�xVx-���M��s�ȒsE5[��
�裿tһŦ���|�ܿ��������g�=֕3����vD�O���|��z<�;|�\}Y��5(Ւ�a�;���j��5L��.֕�a!�Ѓ�".C��id�[A��"��V��-9���/x]1S{�U4�1�q�"����@��^;���F�`MGMR_*֏_�{�Z�ԵWd�������ݗ��H�A_������}2�̣�0���/�g��c��z�Tг������7:r'ę3��f��і�,���[?g��p6�j�b���d4,���B	��;62�	��~��*u��"��L�����r@�_�����ǟ�����d��>����!
�.���d}è���(�ͻ���1��F���`��Y��u�Ⱥ���U]g�L�cQn��Aa"*_��UC)��a�^O����WO���8%e�~_�3AR���>��>8�j�>5$6+_�W��~����ˈzLUL����(�MH���P������e,�t��=�Q�&���-.|�L�E�@әm��[h>y�����{��,��?�<8n�M�s_�Е�'�����M���(p[�r7�S��3ٴ�B��h �Y��q8��f�]��{�w1�7Y�~�v2��Y��2���&Q]�$#��+��##J���{\#%R���
9p�%���h�і�7*�ω��8�ر�����lvpt6?�ݯb�""��N�tJ�L0x��ބ5Ry5�[���4T��\y�u�+I��~L�f�����'g�����o��>���Z
6�'�a���~j~v^<�]a!�S�����C��Q�Gy�������~_�Ig���y#����b�[᣾��X��9��m$uRbm�(h"�ACs#B��0V�+�V�+f�>)M�A�i��OQ���_�o,�/B�4uK���ӈ#{�M� ��I�	���z�~yӞ
�|���������Z���^�Nq;�K��A�����5y�ZWLࢢ�n/ǫ��l�<��Ù����,x�Y��3���^@\�ue��F�M������Û��C�E��e`�<M��^���È)v`3 H�F���������倈r�wC���c79���+N�X���~X�.����=٣�Ấ��>{{�V�ÿ��&d2_�m��xH���N>�D�1f�{�� ��Z�:Z�2�Л�����"������Q�
�Ư��L����#�c6?�F�e�~M�gA
�X�=��U7l�JHCc���k���~zX��3z��ۇ�uY��4�&JO3*'N�mUkr�Y��z�V9Á�����eI,��Z%tmn�@���^"�2��,�y�K&L�ķ�UR.wM/n>W����v?�̭�`�������5>��z쎇�������_o�E{�l�ȝȂ{�̲Ȑei���% �j�]p�K����[��Pڨ�w��4�������r$�8:%�7�J�����f�^HϨ7��m1t/�n�I����}�)k� (�B+� e��Z��`���j����% �fK��r��W��-� �i�@G1l��,�F;��1T_*O^�,�������L�c�q*�������8ƸWjH]@�ߨ3�:O��:	��8�8���v_���܈��+�x���Y�!��5�4�j    X�W����h۠��[�6�ex��-�k,p�Pf�cы�h���`j����"+vg9�뎗+3m/�Y0����7�E8��� 6�E�x1���x�ad�
P���`�͛r���x]�������
�$�Ks|����5�[��z�_����A[_��I琫K�G��Tg^�IȢ+��ܺa\#�!��W��1��!�pd��b��ǋ�j3�6��R��o���Q�q����A�jd#�Ql&pF�	F���6MS�@R8�މ��"	� w*Lp�� ���E�#�����xHmG(ۼM&���o����61'��W��5�$���ȟ��&T�\lDOd��!um�K��m�Y�&�m���m⌫A�x�7�Nπ����q]M���#:ooF�M�d�a���>�&P�Š���)�a���F�������
)��e���f�eRݷ�ﴩm{���*u���>*a㐗�O�_z)^��!)E2���+{�^��ݎDv �'g�KD���9����
����74��XV�E����^{���c��a�G#��|r��'V�_��+�:[�O~r��d6��A'�'2Tm�Y�b�����2�m�M���1>�qn���"�c�"Vg9�wl2�����GTc�E��#�n�:E��*8IZ{C�$Ie'�m�Ż��B�i�Vp�2�����F&W�Ҳ#m��Gg Wo�O�0ī�R��gǄ�è�LOx�y|v��a{ƾ=�Y����%�d~��^�]�z�x�hE6p|uu��fD�Q
Pt�L�|�b
7ܭ
H�U�@@�uQ��=��\bae֗�¦�ӭ1|�q�X`���'���!-6e�����w�g����֧,�g:V؆�i"�4hoor�wã�UЬ�L�����{Z��zZ�Á뛟���3�s�
	wj���0��*W�a\Zf�#MQ#�����l1=\�_]T��:"6^̓�g˅�4�)ӰyC���cb���$��`7��W�J��J�u҄�78v|;�L��v���I+د�̦_?���$��y_��tE��gे�X�+l�RS�4������r��5��Y���q&��ihW�}�l�;>� ���	�_!qB>�v1q"�lIg9�3��76��}ȟȂy-��ĉ��8ym0�&��Q6�v����pm̊t�D̋Ѝ��Rz̩At��4ַ��5�8&�H_sW%����P.��bwg��ݫU�����x6;xJ��{+�{o���aʻw�����1=[��z��ႁ�����T�e�n�Mf����o�\�t��G;����|�_�O?>=�x����������Ɵ	5N���w[7����>zR�����n��Nww/�l���4��ͽSp�ѓ$[�ax.��+
i�	�k���ڳ/�׶b��eV����ҩ� o&������KH���1X6�NX%����ٹ��<�x����&��w�P�߮����(6lO՘���������6�ԟo+��6�w��",H�"��Uw�V�0F��b���vQ)&���y#{mv��\�h{V;�������{2����k���=S5�z)�j`�k�d-T%u2�����9v���$�������X?>�������;�d�C�LN���|1�BH�S�vŐ~ݾ�U�ϵ��$��P��ο<�~�qGC_V�(N���r����B����ȥm0l?]`g��b�3D��·��vC ����}�XO�'�����ثr�:�����Ո�B���"���-���`n��zs'<Y���,l���q�ۣfϤ���Q��󅘒/D��S>9:۝���[�?g>��bw-g'��:jؾ=����B�h��?���g�8���ӎ��n�V=��C�[�FϦ�.���d���|q��t��,z��*`��	˘�Vؠ��[Om[��r���;����c��s�/v���킵]^_e}���N���6�͂�(8J����]Ò�U���F��sr�*@�C��r���]����={y>;ٟ/���u֩CY�>��ާ8�9��E��T"��":���� �uR0cK�;G7h(� �Q�����Tи�nb���zj��zSVjӔx�}�Js��O����V9P���j�&�ؐ�o�ˑo �4����M����.�}�+lL�o�bn'�˘:����u"��o����+��,�,�p�+9��� ���/r��˂W����.G��s0��Ύg�7�o���=j�cY4E�KQ1;K$a�u�60*��d+����bo��&)���������N�j�$�u22����0x�r�k���Ay�؈�K7"m�}�T�+��Yi/�K�~'�����Y,�(%�Z�8Ҥ�\5�
V۩`m?�1#�;{�����r<����Φ���^����*H�B�����h��cESa�VEM�`f9�C���z	��Չ,��"`�[�SԆ֫WFW��|�h���=�Vg{�Y��MۊgE���y*�h��NpĴȠ���|�p�0/>2}r6���ikU�l�� �n���(������(Y!� ���Z՝2���[UPe���}�o|��؝���p�%���S�H+^R���V`?3����-�f��A{�}Eu[?��W���c�0�xX�s��)��l���l��z��,R�B��d��H�����1^`э+�!�?"��8�2�m�Z�׃Xؖ��/�%��vrz����jv}s��.��/~�d�\�*;*߀A|#�6BY��-������Ht��s�[!�u���8�g�@��`�A9��h�����
L���������ѳ�Ω �R��VY�
V�o�auȍ9P��C��oD�n�|��O������v�oR��g��q�zrx�����h0��q  w<��]*s%��b�~	�3�2��n�����o��~����LbК �X"F-i���7w�؅A��[�U�&85)C��`��&~l-lO�E,��v��̗�����7�S���j	���M�]+���CJ�X���[V�������E��*1�V�� �!��J�]�b0aOv�;��e|�۟�B�Y#�^8���q��0R! ���������p|�H# ������w���ϗ7O7�O7�[h;��9S:4<��+<��5���g�g�_�)CBLu�Dx%/+v�.�F[���^j%
T!��Q��}O3��ϭ��u����㛻�{�����5.P�ܲ'�sx=�+�1��z&!W,;���p�O���C)�?�9͎�H��	�,tI��ض�8ɱ�7�i��\�������x�b�Y)���(9vm¨�E~� ;��MQ��lM V���SO���Jgt�';ˑ�;���rw��8��B��%�e��P� �\&{��VNM�9Q9E2���[��ؚh�%r^E)���\T� ��� �+��d'l3�'n���B�I�L�2v�X�?�l��f��zl>uk�D!n�p�)(_d�3�d��~jQ {0�ٳ��H�w�N�n���76���Ӵ��{������Dþ�"���=�e_����QCd����]�z�Mg�`�Z�Sˊ �^�`�9!� �����4"6J�m���gh�rV�]��!v����g�������:��~_��
��hU�8�3�vP��*���B���XB��UA����y_N뿰!�̀�n������X� �ky~��(�ec�Ř���۸�_A���l1*�§B:���f���<`�����s8W$d}g���w8��b<=9^DT�-�h��L89:=��ߛ^��>N���'G{�&�P����N�����W���`����'�?g%�/<�
6�������p�M[޿GҀ2��Na-� \�VkA��zd�~��M�aLlD��1��q5�[hU�t�E�I��1����������YI7\>
�j@8���I��52�?8���X�<q�
1@�f�=	l,��l��� ��5�y�c8��5��8�m��Y��[��25%�Y�������+�+�$�2�lJ��Қ*���W� �y
�    ��=i�nEe"G��<��s�QE_o/la�W�����*!VBD~�")Jg9Џ�]��G��L�w��OfA�x�Eo���q��!��2���Hv��-��7��T�3Y4�C���k򕅖z �t�����O��8S�9�JW�=��h8�t�a�t����.�~�Gy���v�>��W�铘w�E�)�ld�J��Cj:��9m��������q��@F�_)N/�.��~��lv=�k3Y��� j���,���t*8Ċd6L�c��j\�Sb�j'޾�򌁆���w��z��	gv���>�A��(��� Z�ГʭGO���������}6��5��뷞�z;0*[���lZ�уy�dr���}ȋ���W����n��=9;����Zsj�d�]���Xw6��wH}e��Goԇ��0����	]����k��r��9Nn�%���r뱚dY�m/�a���Ȣ��)d_�S���}u��
���BĘ��
}����zpȓ�EzF���x�@i����b�%t��;@�����* a'�ρ	CMg��Mx0��86�k�C
4�q�t��Q�"������tD�W�'D�:��&�D��+c�X�2��ɆYg;\�cE�ь:WT-X5Ƣ�/�ǝЂ�zmz�׆�+��kX1J�a�Vx�	ff�� �0���.r�U?��x4O�q�rA/�1�W+��k�b��!A�X�Mǀ� ��jU@k9�f�5�O]���K�P���K�!��m!,���mNR�b@,[�ꭻD�O�
ň`ɡz� %��ܔ����Gcw�����[{��} 'w�ە��/���M4���>��p�[��9�K���(5��kTJ�=��2�Z�4����=�U��������dN�j���>頦33��߸�P� /1�;�Ѣ��h9N���Z'��6^V㏿�W%�R\=�� �қ�F��A�B�E�ٯ�\��B~�ظ�؁;��"�;��0�?��FU�A.B~�r�� ����_�ɻ�,$�����~&y0�^��yj����2�%(�R	�c�gQ�U�O��aq,{cO|¯�f���ܧ[�y0a�qh�T8���˴���xg��|!{�D�l�DǢ)"��Y���P�a���+�W���,�We6H"_n�+��p/�#�:n���U'ښB�
[��u�.��-֮R@��JE�DO�5��P�?��I�B��U5�Y"6Y5���k��pBKi�fa�����)ΐNHg�#-�;��w��������j�K�pG��h]�S�ͮ�w�'88��럷���We@<y0�A�o��i%���FW��k�)X�]�y���_ܭ��M�j�5Q��U�s^8��V��Kb�nv=����ob�����[=�q[,�b,}0��oe�"�D�D��n-� ��Kn3b�vM�ڸ��ୀ{�:R]R�V�d`�Nf�	�e����h���;���)k��/F�N�FI���5�n�)v0L�?�v�y�+c��.|'�r𧉝�Ψ�}�X�6�޾�q�.�vf�H6�:��=�%�����B���z�^�bA��08�#X���n�4��z%n2��ډ����T/�bQ�AS13f� �*?=?�C���\��,�c�Ѵ!�Y2�Ʃ,���Qɾ�/�4T��"����7&������*J�,��<<ܛ��O�{����×OT�������bo�|��;g������r?]�Ϗۧ����jiA�R�m�@/N���srdg� �������������(*J�C�f����h���Z���U>���\�n�	�*�pn�3�ђx;���������5p-���:���cVoؗ����N>��#�b�AcKg�7���F�Y����@,߯�����T�ۉs�ev=d������×���ǯ�;���)�>�ݘ�R!ESt�&=]j��Y����m��[�[���V�z6}��8��T��w�f�v��A���TK�sgy��Z���J�~Ъ�/��]�Šٸ��a\�2�`K�m6�R�ĭ����ak�0E�@�P��D+���G�yi���B���I����v�!���,��fbaO�1X��� �8�P�Xԥ�j2J� ��z�3�;%�����'��ǂ�WP �6|P2W�E5E���$8�}�=)Y/;��"�)(�:g��F�q,(P}��
4� G �>LΨz��,d�à�h���X������l�z���ԡ,~�E=�"U��K�������Ǵ���5Z��=t�V9;Jބ��u�>��㥙\�M���r���mY�����.�ᅦ���ܐ�&?�
�6l�`<}�p�@4�R��.�+:i�uf92�w|�&a@ɛ�/_�u�	#�� Y��,��!x��ОQ�_��g�*ܰ2��~Յ�Y`��zk� U�T�6��I) =qJaTǲ �5���� �W�:Ng9�_|�+a˳�L�?S�K��O]�������b6����2uh���aEdX���V����~<������	:\S*ȘӉ�N�?΂�p@���\=>Q��_:aAnѢW��mN������t~6?�?E6���`���tA�8S��|�
�Y<��s�w;l�䡬�l�.=�ax8kİ���n_�Gas���X�&��%���6Mi(��Kbm}����T����p���*�\g�L��M證ŰNF$s�_l'�Җ��~�EY�3L5@��/�۬���Yn@4�X�K�zK)2F�����p���Hbeqg9��+�(��vs�\��h��v�&Ԡ�mV��+�+T�Ylg��f�������I�A�Q����q{�n�LM�^�f_?��84j�_��ԍ��s­�:]�Q4Uabg9M�w/���n��*�����(tet	i�1��%�a�&r�` 4�����Mǂ
�K�2�S�P)��Xn����Q��������<z�ەɚ������n�$�Mѩ���`�{� �-���rr�����;�?W�%M�J͆T�B� U��JO�f�=L���k?_�6S	h4^�V��P,�Pl�C1U⤵��rW6&7s��c�;'��.���Ij���&��+���������|눈~S@�ϫ�/��ԡ<�p�2 �I��^D꼡}�iٸ�7ĘRΪYN�`��&�)����u��{b�ql�rt9s$*�	,�����_���e����)Z��ȣ.j��9�"�*�Vh���>e�t��k�m5�\ݭ�=>��=���K�W��4��W%�}e\{	^иP+��R�>��Ё��������v���� �뽊�^.:��x(�\δ*���%̂����KL�Ȇ��[���h������"4�l��w�􂽞FXH�: "��:���%Gq��+�Y8������8S��3���G��U-:��8,��pV��sJ)�EG؜\��p�s��'=�,`Ms/ t_��0�:̃�4���T���:�ed��+������&x_�4��df۝|��s�>��Z�{s���d���9��b��i�5i�ܬ|�W��'�c�I��Y$�ea�i�e�C���p�����Ƈ�(��̃��d��l҉����y��P��&rT� 8��a���z�aw��d-fj�Ǎ:��̋����jQ�x4?e>����<y���C�A,Dha�Զh�[x�p������窪A��'X�Th�8�.���b�d����Y���h���M���|�:��~��,��hfOda>mL�0��3S��R0��ؽ��i�J=9���]~��X'�q�H)ɜl
�I�,��,������wq�+l��u���5mh�0�x��V5:�M%qp7��՛8(��\�8�n^I**R�p̌c���
���%gK8p��K��yS�Yy�lf�M�+0���@����J���d ��<ѱ1bSC���(x"���O��g �ʑzJ׻�`벑�_�FOt�#ӑWs�$4�i����&�yN����D��#��a#K�A_��`EL��Ŵy    b=����6�Y�D�Rȑx76�����X�ؚUsW�g��L5v��l���h�z�ԓ۫�����L�VY��:ʩR��O�͓����J��qگ�����O���ןn�.�����������O ��3=]���O/5������`PLO�����ӏ7w7��?�p�Ly
��EX����|ߩu�[P}"����`7��~W�Js����Iir��)o�vz����o쥓�����H����+�/�t���ud��n�h5�7g�1�9ޘ���n���x�*sd8���8���U�z�DN,A�g�q�9����M��DY=R�7T�����R��I��B%�e#�x�8-��+�6Yò��nM#8���-��	�K������h|'��e=x-��Yw�U��1��w��vjA8M�Ή-^)�	{�GA�,u��s>�X��-�*QREؘ���8�=<#PRA�a�%�q����ښ�����[/��T%e���f�{�xx�"��FI��ths�:�u�-q�)�LH�1hr,u��<�Ʋ?V��5�Ņp&'�)��������Qo�!C�ш�\���N�B�1��= �����һu�-I�b=�X���'�|p��h�fI �g[��v����dT���8#�?�*� 㤖�zdv�ݞ�,Χ��?��o���}�s�=�׸p��o�TG�ʡW4��ܦ����ma*��r*5Xx��@������R��jƛt�	��j���fĻc��<��Բr��&�M壇�Սl>�~4��|4h L )�b�Df9ϥ�F}m"l����0���=�����OW�2�P�ū��))D4��� )c�6�T��*H#� �Hj���R��k�?���A����wd�~��N��3җfͦ���"�ߒ	��}]k�aXu:еJo&���L1Z�]����dl�=��
�Z�#�Ul��Ǖ��n�ӵ����-8��0C]�[q*��~+&|��pcu��V��K-���O.3������L���b� �/�mn*Hb@�K鿣a�R譵�6�0y�&�Bdd.<+�BD���%���P�e��a����;W����A�7�=W~(� 1���� ��.��[tHUjJ���@�����\���:��Zٺ�k��zSi�!��+���k�k�v�e�v���#7�)|�2����,G�����tzV{��	�y��b7`���>�����M8ۦf�*��b��9,�C����R~A y��U���L�3c7���d~�8���E��{��`l]�OdQ��jL2-g��ꑆB�Z_�*Z�3�Vv5����v=�V���8�J��B��.x $�`��z�T���d��l��2g�=������<�,gi�w��Fo�y�\ ��6��wӛ���ÛǨ��w7?q���/3�p���6�P�KwF%A�u2,|T��$�~������oY����B���Q��R��a4nP7��*|x9���^wAq��
{[��]*���ь��~۫�%��s~�|S��Y�H�%o�D�0��Ս�>��4�1��4������l�,��E](:�y�uBW�q���6�����PJR[� ��BƓ��}�7r�:g �K}Xtg������a}��������D�!!MQ�ť���/�6��z?���K��gs��uc)`+	'�*�$�)$Cگx����,	簂Uht�|��(1�ˑQ������,���b��^�d�`������O��mU��LG�۱�274�ЦY>Gإv.j̉AC��d@Z1�]�2|�f��㓨^���uU���jw{^oL�+�m`ȪD4�e��Qn��n
7}{��*�o�u?}����B��e�p������g2+�h���DDt�
��8
�]��y�3���I��~	c:E�%��P�*�Hv��#m�.ڥ�c�	8yΘ0 �o�'����ֳ�m��q���E��|�F��}��|.�/�}�Ň+=y����D�X�?��=�|�<�OM��Q���vagh��a��tO�R
k�rEY+^Xʬ���R�?��;������b�f}�}��C�G�ྯ�8߰}����̢N�@�"���J1���J�楻P>�Q��%��&wt8��9H7�4�,�pS���"�4;D��&��#�C;��_nv.����FS�%4�O���«�;��M��7��Q+$��D�����XQ,#��)�(>�*i�t��ӽ-vv�'�`��������F������s���s�?:��r�/K������,��jV�*y2H9B���������2߼��>�j9��z�W�%&p��Ls:��z�R���Mo����V|͇;��#��2G��c���	�+9�iӾ[�52�����١~���Ч��B�!k���I�ͮǋ�[�Ďg��}�l�Bf����Ⱥ^8�	�~"� �j���z���$r"s4�'\�Ti<a5f�`>&��6r��ĳ6�+r�T����z��Nf��=A�wl�O
{�0�l0�\%����+T�Qg��]�����v�����O׿oOE�X���

 t�u�!�%y>d�{bk��4�OT,� ��B��95Q
������z<ė:5遧f̀�P/�{�?�,ɩ�@$"5T^װ��9�Ax�	0���2ڰ�u�>^ȏ��Ӄ���Db��?����=7�s�i�yν�c�v��O�o��=�U����֦��h㝆����*1���hᾖ�9#�_�%�:�l�B���ό�t�i�(���t����w{��(�q��J��h.E�5�����4paq�&��l�jp����
���
u�]j.����\��'e�"�Ec�)]�D�)]E Ty��m{fϜ���vO���Ķ$Ri��P��D9��X���v����f��׆Mvn�����]���A��Y���:�$�`^�H�>Io:s�[�s�l�p�A��� [dU��Yf9�R��	�n�mO/���_W??}]����5<�g��[:B�@P@'��X>�f�4x���3|%T3㜪��'��?����6,VVQ#��|�B����r����Ţ�9�<L��يF�d�#N��4U	PW�gE���#��r�!���
�`����r�N(��A6���D@�c(�-\��hq�OdX2$A�{/�����&��Ū�ms������O��Ӌ�]o��/b��/B��L����,Ys�vW��v�Wy�d��5��,��EҔ^�P��{����!I��X_te�I�sb���3�
	}�����o��UL��Fj��c>9}7=8:����G��8������\�Np��QͱV2�f[��CWB� �V0ʰ��� VK#i,�Y#E�Tǅ�R7�y4Q���S:�x��\���s ��o�4��f��R8�?j�P+ݬe�H?w.���,��� ��rlK�[C�P�X�uƔ�Ҁ�#
��X�(7����b1�kn�<�1�ұ�l�z�on�۴]2_�"���#N���z����M�1t�.D�c�w5KD��Y��!&�B������Yi�B�i%Aש�Ȕ�$������ݝ���n9m�ġ�t�`V[�'�g�oE}̪D?o8�vv�GȬt*,NW��+�.ala�v�|��[�U�xXZ=F�d��51XC�P9���3!4HML�L]i����2�D&���U����x�xAvO����������CרH|'E{��@!G�1��ѡ�'���&'�7�H�'�H�@�Kɱ5X�8E��Q�[�餩���LΎ��1 �j�����C-��*�H�F4ݶ�I��h,��߂��y�,Y�]� RVUt����jb/������tq���PU�J��� ��kmL�mt��c4�QH7�j�A����?��=A[l�~���U��+�v�D8�����J���q�AI�߀���2��^�495��1��(ɭ�Y��H�
�����-�Ƶ��H ���_��7|���_�ԓ����1�U[e�5��{I���r�D�����]��d[p���+�"<2U9�^�    � q(;3�@�D�/.�9c��e��PU��S � #���5��D�l�S��tI���]����K�����B�A��>b�w5x;�y��<�8�^��r��6��Bd�4Ne�4qr��^�1=h�	JDU[���/ē^w,r+3޺�Y��s_u��]���ext�0��UZ�Ѩ�� ف�8zV�?Vԣ9�!O޴!2sp�(+ �>JJ�g�h(g��BB�.E���7�Y�/�)v#g��b�tX��*�HjY�,&|A����l��9H�Zʙ�Xe��9v7E�#�a;F��D� ��Ȫ��u��j3<x�@�Zr�
��,3톊M�M{PN��P`h䇏I���
�i���tSf�	M!z�v]4�OX�3��}2W�A�������)�qc)�*	���/���5�B��V.�-:�s����C��ur)Xv\Sn�n�k)u��,�i���C�H�W��p�I�<���b��:��rL�K6ٽy�����!B]}�L���lRI�d�V+g�A�t]������V�=���ly�,!U���I%�w!�JF����:!�=ܛ�_w�0��,��6�}=s��6J!���l�����$�`�����U^n=Za, he�rȉ0G�S�g�zE�~}�28\����������u㴚6�+հyqT-�A6q�۔mt�^�mJ���7Nqt�s둡z1?n�t7;|���{�$�2G�@ϫI��.��s9n�h�U�U��M���lx�T-��GiC�F���V�2}$+��z��*�ug2G��^H�2}ں�6(6V5�'���&(%J�q��x��'�����<�p!Mx�w�;=4�T���l��7OS�1���M�Y���M��\�f��7�q|q�y3��z�նm����3/ʲo����=g�̭�C|a�TzB~2])���0B���V5�X�ͼ�_2
��$����o�y%�W5��BLV��ے���)�>�Gc�sO�yP}D��$�\7�T½��792�pp�b
?pl��M�Қ^��K7�X������M�NcMU�X�KW���ERG��Y�wB������jOA6�ZY���cA�j֭��|��z\m��T_��o<����������Uǘ{�UIU7�ւu�<�8`�HUIl3˱��Ó���C�r7>d��}c\�cr�� Q��6=^��u
o����Cr߅�)G"� z��He�I�)J|-Η�Q�39p�zeJ���p����V�3R8�j�F�-��r���`�Pg��p1?�k��7e�㦞�e�A��k�0e.�Z���Ri�mfзj��&<����q�b�=��������xHh����������l�r��F�/�/�QY#��P�([ʹx�f��
���Ӹ��KEf/Qc��Ǿ�W��Ꝙ_��~��$���c�%�\ӾN�D��l�e8v����X�޳������)��>e{_����(�����a�!����m�.��I��G�2В��CG�,�Z]��c%��=VF�����f����hH�4�z��š��^�ÕU/��q-�/?t�
t��@�+�+���ٔ��!��,8�&�^�'Y_�ª�Q������aX?����v������Q���4�T�[��bF���u67S�FK)�eG3���w7�>O2[�4qT��=[����B�}T�e�� "U#��^N汤VN��|oa_�J)798�E+i�yT�k�E�x��P.fR�*`�z!1T�W}�:�M8�17T��
~�c��UXuck{zq�sr�;}{~tv9[^���1��0߆3Η�Zd�+�d������.�{h91�Q�.G��P��;i���U���5�Atd�É���p`��҉o��O�.*}�EI�H��������c��տ�� ~}��k�L6b��3&fLiQ�[a�C�QUF�1�Ub�R�04�7����r�=���[;_.Z��3ˑF�:u����|�;c3�,��σ�$�Lp�����#�j�����Ǚ��oy�C[g��~Q݇��h�y�E�sVk�L򞺏203��5��hn�Һx�@acc>�9�i�Ԙ��Ȏ��Xb�ј[�Z�Ҳ�R���z=� ����P�NG���ҫ�=A^Y4]��Ky��9E%91 X$R��e��o�K~E��c��!Uϥ�������D?�̼�������ܘ��.�`[��E����c[:�~�(�r���R���~�AKe�Լd#�G,L#��˚��z'�*z�@���t���,��,��ʞv[ø�C��1vT��.ƺm�?��k��V���TF��&֣��f��H�{d��������M�_cq1$�9c���_��je'�˝ౕZ:u('�ZU�d\"�M2:Xm�:��]u��5���}=�˝0�wk��U��:4�����yYQ1�v����ڗ��I���_Ȣ{ ��!&"���U1���
[[~j�5K�7s�;v��
�$���м%d����*X�p!(����u=�mU����'ನ'��뉠HO�������d����o��>�ߔ&�̊�o������^4�(eKiρmn���9�Jr�m0�i�5�/:��H/���x.e+؄E<�#Y$�UYOx�T��9��i�%�sj��x͘�4���Ѡ�kp"ї�>X
��?��b��枬����%� G��j�G��>eA�l�60���k� S"@��˱�If�����UO�Q����\Q�@z�P�Ԣ���ܝdP�"��j���м{��y|E��)�A�*|�1�����ٗ�=����EQU"��,��)�J��G�~��B�7�>VISn��Q����UJc��N9Cȕ@" �m��+f$%�
�?��b�qt�o�ŧ�4k���t�r~roۻ��e56%y4'�&��MS�������zecw�h�r]\�ٖ��0����?5v)�8E���A�+�����[Aa$y�����`�����"�6Yf��w��b2�/S_Î�+	O��������`���~����X�1��àI�m�!r�t��P8Cjr�FFP͞LJ/����^�Q�*2��,vey�_[�-���=j�v�FU�%���j6me��"$	*f���M[ڹ�/�ǝ<����ó˞3�/�8fyU�G�i�A��}��_K��EJ��0�J���m��Ѹ7}~X{CYw>g����l��rN����T]=$�F�SpHO�m0�Yf���ƨk�=��'݂��F�Y�b�l��a��ƇK�4Λ.nV��Ķ�!lU�!v����F����ۡ:�=��*~�!v�zbw#ղ>0��z�|�4�p���M[�(ϝ�X]��H���Q}��u?g��1)�}'�L��J������	�tx�_��,0�������Zy�f�Q��#�	g�sd��.I
�v�l@��uH�ª�R���]Kǉ�VV��R�����Px��Ȼr��o��{��A�X=x?թ�x�|�mCli�+�;�mZO���2���(�Da&$�y�he������������
��,[X�a|�g�|��.�;g�QU�x�i�!>ؖ����������5�U�mj=zϳ��6��g�2�3� �f�h�����L	[�ĻQ疵���C&N�"��:�|_Ǩ}۱����w�Ez��Y��F���)�:9$"-����������
�z �:��/��f���!�˟�oqz��,%/��d�cSU�
�x<Nt�������M��k*�ڪG(��S�,[��:���<n�`ӄ
zª�ͼ�iX�S�ڦ3G���h=�G���8���mb�-�{�3ǹ!Q�h�>`�l��, ���E��h��l�0)�Z���:��C��*�Iۆ��1������ 8$�j̿�۟X���W�jwoN������h}� 8��G��~m�H��a��F�@[r��Q҆�QgE���P�X�`MwA�+7tc0wB;_b=Zec1����?������\�x%�{2'�.س"���$�d�҃6�B�۞w 7n��)ӡ<f����ӏ;Ju��H�bLJ[7<��%��zD��u"�/�e9�ϊ:^L���ɀ�P�N    (����KV�L]|%F�S�ct 4�2�������qr$��/z����/V��QT���L�T#�&92ČbM��a79�n�hv���������3Y9�+��g{K$���A�IQ�7���؈���[e�?�$X�"�~��x�q�&D��uru|~t�2;78u,/ħT�)c� ��x>H��O$�R���1��[b� ��-
it��h�D;+.��s+n�v��F�i��(a���Y!?(��T�~c�����ƣ&|���;s	�u�X�3tՙI#/�2z�ؗ� �������	�&
#K�Qׅ�%"�*_%4C�P1��X����em���ZПo>����$�塇� �6=Wp�l���m2Ћׅ'���+�G��yt��R�#ۦt)�5�<fc��9��D+����UL:����%v��.ƢH���]w������U���e�[�S��pHf;�
y�%֩c��H�-�'q#E#�������H3K����*6�̺E
��=qAG�X��,)��2�aOX�E^g���E���m�bK�4�\�8_G�qdX0ԥ�R'�87��ϩڪ �"��Y��٬h.;���{ k�����G9��,�z�X�Q%a����0���3��J�G氳Nf�#M�y�I��f�Ɋ*^���2!�V��AI �4A�:���ec/O�#�1X� �R:$���4J�Uq�tk�{�d��np�*j��ʀ�MJ�WM��֞[j����twzv�8:YOώv�����P��{6'�s]5�˂)5;H���|b���U��z������Ўt������?d'�!i<�n�XUmDQ��Q�Z���Q�4k��A,f{hX+�x�zq䪵�(8���5>l��sk&��OP}ܭ��XA1Mʿ$p	
����D�x4�l�`l�� 3��e�ϧՍ�,���r���-, �4$lC,�1�~���-fj,c.�!i=v�)����5����m�f_��tzǁ2]�Wσ����{�e]�#����ADX���E�*�=F1t�qT�]���0b[ �rFaۤ��E��9��˂�� �{%
��3o��e%}_�^��Τ��L����l_��o�
��6�D��혟J����e���YМ��$�JN�b�j~��F|/B,�Xp9+)^���]��~�Ɓ,�oe,�=)D2w��n6��4��E˄�@�t߄t�7>�'c���@�Fd$�U�7�W��zt0f~��,֗�l��~aȨ�}#M`���~EiI��/�q9��u��Ui6̔�.Gf"�K5��Xn>��_�`�Nw����,��@� f�[��Z=�6���x3�`���&�����狽��pq���+��`,F[���mG~FQ��]���߹���p6�s�j�E7�fpҖ�!�	1(��H���ж��Kl
�=�ù�VR4-ϮǊ�{3���;ߛ�/#�X�H��&�1������YQ���6�4�O�8��xֲ����h��s��څn0#���6�̮�+�
������%VLՖYX?���WX���%����8G������rl-����ф7?R9w����>܁k//`����&���L{Oe�f����3y������p�+����t�������^�c��CW����4=(m���S���V��%)m!KsBb��r��-N?�IGM����#�\��ik�´a�T���c����*���K�z�s2�W!��R>��]�Sc���7#2�D�{Z>��dHC�[�aP�H�'l����`�4��a���-Fg��|^�=�/�Ĩ�vdAL��Nc��&6��	\��@���R�mz�fZ;o�c�]��J`���vw��Y�}H�J_��hI�Qg�W�
��g�=g)`M�`�9h�^��6/+�"��נ=�6>6����T���0gF�3�:fBc,��`�H��Ѽ��E�
�4�����B��A�%5E_4d�U�JT�Z\;�mf��tkt����vY/z��A�I�؍(a�2�MИ�0�g6�s��3-�[�(�q�j���EG�#Q�)����r���N��d��9��8����ɫ�+�^ԥ����y�Wmp2�3"6�H\��r�О�D�� a�������������D
���_4�.�_ԯ-E�_;��4P���&[L��X��
����R��2HDD"���Hj}t��Z���߮D�#�n�؟_�/c�s�sVt/\�M�2mj�U8k=u�dh�6ݿp��BJp�5cFьET�h-��\�luv=^��j��Ld�'�}�����_��P4��ޔ���R����8����h��2+��k޴c´-��*ڍ�aރon�z�r���m7�-�yB9�����	�Vr0fw����Y3Z��2����L@�� ����f��ݠ�?2�|�0�R�!��}漻����g+a�N5��X�+T���N�,�[��tM���qch����C�UP�>e^�l��۹� ������M��C|mck����v�J3ӥ���U�4$����e`\<��A!�G)뺁�:��Q0��h���꯫�?o�^�\�Y�X]�z��^3��ƙd�~Dp�A���C�������[h�K�A��
�;��X��TY�8�+2�ޚ�`"c Z�R���6��@v�nâ7%�e�𺥹�7���F(D�%p3:%�	��� ̮f�����#���ڝ.���Z��9��SV9V���6���(ك��s�M���_�7�\ҝoOo�����VH���m�%r��H4���z�$G�O
!|X~h�I�IB��������m�Eg5
�2���}W��P��Ce���H,۷�ZS)Q��e��Ft{<��������o�,'<�5,n*���bf�
̃+�����TW����~E����»���W{{�n}�c�h�}p���&]s0xnq,���q`�epF��([ �~��R���̇��,m,!�2��}vLo��q���보����F���
i��d�vs.�U�ԝ��	{"�Sb=���=����?�n�n����~<NONv}^ϙ,���!�Yǆ���{�嶑-m���S0|��;�#�ᒒ���(���rŎ8��Y�Nɢ�$W��ӟ�Vf� �]�wW	���+�<�2�����eJ���2����K�G�V�|���݃��):��|��L�otL�,wLL88=�r�t�|6]��7N���V��M�S"{��ܦ��
!�v��^��d���������0ktt�Ƞ����،�n�w�)jtr0����q�9�^l�B|�\���`P�{��	b�����&3��w~U|�W`E��α)\�2�~	T1�W�X-�`�C
�b'LM!V�cO�6�0<F���5��`�����>}�}�Pn�B+�K^P��� u���+t+�������G��j���A���4�zb' �R��o�w���v��=<W4N�y�����~�	s2���r�����;}=���E��2�k�7��>ej>�u�1(i�b�e���c�T��?�3�z�\g �88g��&s��9+Ytw��A���n���K�`�_8*����.ΐ��1�����PM��a��q��$1�#ewl5d���\i�~����<��So�>��G�ND��D�1^���6d1Bk� U�`�*��%�E{�m��2�K?�^-N�GW�$<w���&$���*������"^`�o�#��\?�*Ǧ'yut�����+�*-A�0����0�x�ic�|պ�Q���3�-2w��<�_A��|ɋ�\��ncS�M�z��$�X�Î�҃��x���jh�A� k�Ρ��2z]��Z��H� i�BSgh2�q�`�:,�c~Ϯ�����ׯ�������w���l��6b��Zj#P�g#����*�Dzs�E}}"��^U�t?P�%:b�}H�D�i���9~s�c�lQ/	��ָ�
�"r�:jD������-���F�JL��U�zWv�w��V[o֛Q�/�g�5����n-(�����;̮������=�=�"�'�b��7ʫ$��f�U��J��6blSu%���꾨�
\    i�;ST���]��C�Ѻ��-ttaG��q6{_$'�.�m�=%�D�X���s��c����μ&�~����a��&ZԔ��T�1i[f�m��et�
M�Շ��}U�̕VT��$����fz�K|���~Qg�*��~��,(�������TBz�w��	Q���u[�X���w�	G7l��lq~Z��V$oX�]�X�)ߛ>y��AJRB��X��H��K��|Ya���T�J�D���Ë�dٶ�"�3���f?/�R$*����&�����;^��*��6�ğ���ڦ��0�&����~ΔT<�Fa!���`�b�8X(�7QTA�xle�敹"�����1#���Y]R���l9�=�ޯ�R*�������)��Вm����.?��Z|�|�pGP(������
��է?\Yi��{J�j�٢D-����v<�Z��(���n�(C��v�4�����X�U�w���"���f�lO곎S^<̀�i�!��bᏉI4b���.��x.G�����S18.8'L���1���1S�%@��>�4��qͭ�����3 �KL�g�oZ]I抜a�1�v"{�;��HSR����Q*�j%�7E������މ>� y��+�A�����[�<M�.1&�dQ�R_��R�n������������_m�1ͻ�ؓd��ִg� �Oy�,�f��oUO��дћ)�i��Ǔr���g&�u��rx���'w�>�u�=��"�Z׽V�o\��ƩzM�ջz��`l�~"�ؿ��W�P�V*��\s�o1����ǰT��j*m�]Q~��zoA�:}�sE�c��~�߷�H'���EK�\�r|]Yf�Ŧ/�F�u�>\��z$�d������ �+2MƠ�2./�Jo[�h��SI�}���W��V�ߩ�0�g�(���lWeG�h::� +���W���[��6�W>�"��C��iTypn0�r��z�K`}�fSsH�w���z�تw�j�I��%�Qt%3�/SH�UY��^UY�����)o�ET>OV�95���Pؗ�%��To���/eAQ)F܅��	��]3��aOX�4�������/k��Kc=��^mO08URBd�T���w��u��w�(3�Ŀ��~ғ-�c���m��$����XIE�c��vv��M|2E������8�YP�l�Ҫ��e֙�T��<1�G���Y�Q2ک�`N��̺F��Y,q���hU-lZ�c�����ן֏O�O�b�����~�n���(�؜4���nd<�~�;Շ6�k��h��jؐ���_
��f��?�P1\��,�v��+;O��~�}�|%�e=�aQuQ^�r���"����e" �KƉU�:~e4_P&ND�
uj(���(�/�3띍��U�8i� ����ce�P�V����8gE}�)(�"���B�FO}���\�l"+I��� �$�,�b/�Ɍպ ���ocC2��ش5��|;�$%Z��o���րZ.!�c]����-�����oP+_gX����]NN�h1e"e4�4�`B�/�"~�I� ��{�u���<�g6���a��X~��r�EM��pU�x�^����]u�ס0��qڧ�\i�5��YE��h�E�U�H3���m5�6�'쬡�"�r���)Cf8�Ip8yG�c�
'i�1���Vfq�	S��	��宷k��u���{Si���7E�N�|��������.�R򜗓�l�ь�MȘm��M2�>7ůg|�W�'�N�bWn��2T�Zj7eS;����[ѸU�/ZS(y�����W�o�E�W��Nű��g�7[a�*�Ҳ�p��e�����fO�����^�@��Z)�<����t����4[����7؀��T�:ާ	Ub�A�ɭM�^h�*ڝ��c�Ģm���{}�GW맻gx�JMA���}����4 �� 'j�qo."�\��D�ba�[{d�
�q���韂$���_o*)���կO|�Mg�D�}��*�8���RB{��}�!n3č�g�~��s0�]h¨��qXEa��R`�3�^	�[���gh�65�B3<z�Rs+\�Z��߯|�n?<���U���v�k��y9GO��ZAػnsc]��R�i�ΑW��?_=��~��z�PK;���D���U��h�6r��ݙ�����G���|9����VدDɚ�'kfp�@�=#�Q[}{Ͽ�<5��hؤ�!j���Q�vd!ҨDTz���\0�������V��e��}���<�2�w�f���[4�<��M���G��N�B�F�Z�n,�TZ�.!��;����1ۚ�:�Z�����H��y��܈F�R��+�S-�7�֥��u�.Svdy�6k�/��抢8�1o4�-�50�ρ��&�YF�؊���h�"�.N�(�I�姓��-΀3֔q�����kr��7��CWW�K�T�vzbM��GOH�=!զ'�&BS_�̵�@,L��_�7�iM{-i�-�[qt���ZK�/v��xV����2��n��S�}��APe�k�XO�d�%L"mjj��E���K%���&�tV�{��#��n�D�.�o|�X����z��F���g���8o�}�m��PRd������72�c�TvH�_��3�;a+XR�N�!���ZtCk9��TaKe����HX�2�]�ϮX�49_���_���j+�W�H�C��rx�Vz�������EQ,E���c���ԩQǤ���ꚩӋuT��{���ٓgo�(D�6YO<s��7�p�aZ轫�5T���>v8G�;�gt�dϻ��f�j���>t�E&Ac�w�"�W蠉w�hF~��]c�����s�1�Էc��v�;X�\)l(�E޽��ۻ0:[y	�n�� N�Wo7t@�p���~$h�~Ê̊&�-1��C&c��PՏinK3�^~%7,c���.������T5o���ci�����o��-o���w����S7�_�;�\��4�pGC/��\[�3�74�����ե~�۵�w��zTo�Y/-�_���h`�r���׍��ť��=����
�i]gTC���cO������������<(�wژ
��B�J�|6�&����r�28 �,iM��Z��r^���>|���T@hZc��K~��İ� l��Q+s��|A,�A:g4�U���������ρ[.W_n�W��G1�R�\m^���qc�R���9�̼׶V�_|�h=**rJ�8*�3ehL���Xq��Ap���zG���A�~�����1��V���Ę���W�tybb�X��ޥ�l�U0+�{gR^��	=$���1!��\�is�ị�^�[|�m�j;�{��ny؞z��7�����J̾�14ķZ�/�]�(Z���d��ljWo)j��hUP�י=�_����C������N���-Vw����UҸ�J�KQ�1�e�_o�\P&$�����2y�S��4�M*�3h;�0g^��wG�=kJ��n�S�{��v̫K̚o���CQ�7�M���:���������`�bSf�Y)�P� ��Iw�%/�^me�ڏ�Ƌ�G�:E����m;O�c���{������eK�Z}G�ƎX�>�s5_�o�*�'�K��\D���� A�R{`�Z�;F�/�U�w�7��Z!7��d^��>�d�d@�m�j��e+
�a�k,�B��Ē�0+P8�>F�,ݕ���r�-)0�d��� ��������t�v��.�:�y�P,�Q��
jlTp��!�J�Vx�_��ғ�����<�Z�i��u�M��a7xL/�n��=���V�p@�ص�aΊ� U��B7�(�T�F�U�-8ٌ�5d����!�XG n�r�mo�׫����k(���ϕ�iU�eF��5ˉ�#��K��I�/���Dly:�.����t���\\O�O/��w�m}	��@k�ҳ��;��*�'�}�n��7c��璥�*�C�݁h�۴�k�w�퇍��j�/��ˎ;���Y�Vw��    VV�[F���ɪ�Ŭ1D�u�]���Ŭ&h^W�{�	L�������8�/��˳����lV���n+���*Ƶn�Gi��KC]!צCe5���!u��X=���{�t���X��s�y_a�cG2�����S'hxF�6}�ȥ��L$:i�Ȃ�b�F� )�J1�C������zV�r�Հ�_d(�<W�j��˛Xy+�7��:5� �il�q��Hl�/w��y��U�\;m��9/e�Vu���j�~#����aŰ)���96�v���XW�6~y8;�|{9>�nr4=8?�>�-�Xг�v��*���d��v�{�F�m��<D��ݫ�w?_�+���g�
�<2V}���Du�m��j�N�j3]��w���:j5wA9E T��٨��Sj5����T�aaB�0�.�0G�[M�(iph&i�#�Ws �����������������&���m/�f(g+[ �a@#�۷�y�AϹ�Pr;�z�Wtq��q�{ts̩�,���ٺ�kd%�p#D,�'7�ԅWݲ^_�,���}|����7��n����7�/�(���]�_��l�3�#�U|�W8�ۚK+���"$��&�\��u�S3'F<ee݊�4�t���-**�����U�M������.� $�ܯ��1�����ڠ����E%f��T�Bs%Qt�`9��XR����29�Ce_�����xy�a�B+����*R:�Z�L�蜗(��K�i�ʴ����bqz���||<��`�Ϗ���1�Z�dE�H�<�D&{s��]�����n�ɞx��8~\}BGVl���o��U�"�����笚uۻ2���V�m�0-"`���M�	X>^��Oq�����3N���x,��!����������wy�(2w���g���V��7�h����b��~_��Y��ߏc��b�`8�V�LD�lď��1'�	]����(Es{��	��؃%ؼ�
�I��*U��w)�J�����7E��!�����������!hcP�C櫤�j���(�f����bQ����0�˓���������{�W�ߖ��Y�Z+�g�
j�>�����U�׵��T�ѾX?}X�5>}x^}B���"K��A�*���.?�_�c�!�~å��]�ƹ��\�-w[�?�E|�ݯ��?G�ؔ��P7ǈ���_Eɶ8�0����]_��w&m���:�1�,\w1���-�)5O�=��GS�637q*d�rGg���s�,���_��"�t��V������,M�l�?^�,o�w�}�JY�-UK�L��_g��x�T����_��5�6X�r����\�W�]�з᷀�ڑ�8��l��.N�����d�C�>�����al�v!������7�22�]��ξ�o���3�'S�w�Ü��c��M��JΝ��΄Zx����ɻ@��YחQ�6��p$�kd��浭w��.��w�R�X� �:��a��+u1�eװ�u?﫭�!�tF����^�^�7������a��f
�Rʏ	�xя8G�ۦ�ޑ�\5:Z=>��B3��Y+��<�S�.vƲH&	X֓I82rWռ�w�(]��F�IU�Ma�������Β��v�����mchG�.��9'����ʡ��;?�[�Z�2�i�\��-lI{3mj����3�륛奜�`^��Mj��	(d�������VB>1'��� �{�R&~���:�Z �E'ZS�x�������Z�
��X�r =c;{lދ�p�"uA��&�����i�^�&}|v^�<TNZ��)��j��=��MM�6ZuO:�fD�)�^|�T�����0~�����������<~��+@K�Ժ��:�Ёs���i���n���OSn1���}Ɗ8�Ȳ���J�B��s���L#|�W#E�fmD�.b�e�ӓ~c{7׻jW~4��q}�x��T�se/��zU���8/@��@�f�@UXk]~����4��K͍A,����S_��;:��7���rZ򃊎;�8��.`�mV �������m�I��ǽy ="�%}�	h�ϫǇ���j�
Dzf���R���N�m%N�9J8��74v��vJc[o�}<<�u�y������������'�燛��<{��e,�)!��4�Y�����)�i�.J+=	��H�l*����T��a�7�����d��ך��j\h��=Oʲ�vI�����ʣD�J*�ۦ*��/�h�u�#�o�i���N�����V>���=&�I�mS'^��$�q�uQ2��eZ�;ko�ݠ�Fk�^�j+�FCknd�g�?�#L�34ض+�c�i�t�u�<�dCˍ"Q�+5׻�6�>����؟O�����Vd-/e!(�o���F�	UQb\�5����K:}��3M	��F��eƠ��蜠�^�k:G�`�玤�$:s8��M_Y��W�l�7ΏN�../�˓�l���`V��������-��G�⭄+�x�����G�Q��? |�Ѩ��v_qzEQj*J�������x�U��+QY���K�3�S7�'蝖�m�JC�2x*��S����|�p#�
Ljϋ������OS��O��� ��Z��f]�G��� ��T�z�]-�7��ǻ/����1�t��7*0�����{�է���a���v����A� ���Ķ���?�ʧ���ftv����ͪ�sS�3����c��S��!�Z��p�?�c�z1=��)ޢC/I��Z�$�ں�]쿓��d��^
�k[�����_
�O}�j-�T_e럅;���mp����_x��ͬ�F;f���R50�I���o�~5����Y�V^���_�9̫��O����`>*:��h ��J������jA��xqy=;)z1F�d��M��$�k�zG�0"�Dе4tݛY��2�}_��S���U��[8�1�ϖ{j�7���"�|��+Y뺥,}��嶀�T����M�<J�1��9�S���r9�ӊ�/�������
m{���ez>
���f����ے���D��g���
��֜��2���1��m��{&��E�L@$0ݜ����ug�"}y������{�#���^�Rf�A�!���b�!��ʏpz�Ѩ��ՉM*m,r��N�\YJrHO��"H$�<���,J��a����A�Z�u��W��ȩ�9��9S[x�6�������1�����(�O�p�Z�
���f��R1��G4i¥����\fĐ�߄Hb��b���5F�V8�����������r{���q��[k�o�߀z~�V��_�M&��>J���(��	g�+��ux��d,n�~�}u��z']m��_������*V:��,`��`��42.H���Ф���I?�����|�^��{�El�l�W��Q��#��S��/z[��d����h����������d|�8/O��kG���ݧ������U�O���F��Ir�1tR�3����(�ǣ��|;�,����6��4��������\6��b1z�
�f�M���^���n�K���������rvH{��&l�����1ʻ`��b%U�Q�Ay�d���go$%�.��Ic�wJ��o�m�h]�7\�� ��(����I�;>ٶ��$'R���t$DVY���HM�H}����A�#6(���1j�6�N���-*�..NU������/��MlS����լ�^l�vz�ڕ����頁a>�5)��Ԓ��W*�[�J{*��U����uq�b`�yH�+�V$�5�0��!x��DG�pn��'�P%� �n�����-r���������oR���閻nn�f���p���Ak.�����Yw,y�����P�M<�Vê�(e���'�G��L��W`�4e���_�a���oߟ_�]Β塟E��N�Ȓa�<�ލW��%����
M��;$ǿZ��£�=^IiZG����e��	yypـ�4���V������m���+�ݲ��əH�K�mЃ3��K��%� <��    �I�Ο��u?J\N�/G�[P	oi�Y`�<C{��&���=�l�=���Lc��2E�ñV�FƩ�7a���~�����>�Έ�<���5�o`�Q�#� _��t$��r�Aqf�%H	���W<��������]����#
�*�N)�<Q�0`��l�����p��L�" 
���q��Ml��������4�x8\���G��$�
[�n�"7z���&XCU3��ݮ��9�za�	�y��H;Z�S�R������F�Oa`UO<�p?n�E �HO������pY�wLI*�P$ҋc`�.tXn?i&�D�q8� �� Bz~^�Yf��9��)�Z�Q�Y�b�q��7��[�Uil���<�N�qr�c.�RG8�Ii�����[��3�g��⼁�]�3[�!�jD�K�r.c�/%7�񟌬�$��E@к�ɟ���7�
l�NqW�>=��y;^~�[=|X=U��m�3����Ǟ75�27��D�Gaf7�H���,��oR�|n���X]�XY��ڌX�����z<=]���g���� !!��~+�&*����(���D�آ��
l���K��&Ml�%�����H��JY�"ά{⸿<>�!�OC�����z~��)k}SFo��H��{wt����p�N��A�A�I��8Jʅ�-�P�k���y�`��4@8�z���fO8{cF24�o:ҷ���6�/'XX"�G�5����cC3��z�`�q�F�T�����)ƀ��L"<=G,����/o��{��1�������Z_�xPѩ�Δ�=��P�ʘy�]�I TK�kI�r�~xZ=�	V�������z")5�cQ�בd}��������2���9)ٺ���i�.{!Bքl���~������_.�Ӎ���:ܯ��C���@��nq�r"���ޔ���U��[Q�F�=pO�쪿|�-�\��"�����pP�G2b#П�U߻i�,�l-Y��������Y}dK�|�=�qB:c(�SX�[��˩��1���i�M�[^(#R: ,%��ԭ���+Ĵ��f����hz�7�`�o���g�N�''�?�_E0{W�d;�]T�T�?N�$U3��������G��-�X�,w�ȫ�kM]��ͳ�i��Ѥ�"_�瑨QCI�M��\:����I�?a їꊉAbK`ݯ�I�g�E�j�$vII�|����F
=F��8�~�`f>>���Q)l��[#<��?���$��4B�%"��R�J���1¾i)��(r�2
u��S^�p���:�a��'����+� ~9Q{|�4q�W���߁+}���~5������n_�V�Df3L%�����^�IB��r��z��a"�q�c �L']�b'��ė�'�#��wtr{�������3���y��f�����x��43=�>�ip46s���qr���w
��� 뼹��`�1����G#_��j_RX!)�XޝW�����oر�>���Uv՟0C�"1�� !����]�c��$�_���Bo�z�5齅z�}�y�_=�b$5�p
h�?"J�>�OK�l��`ߥ���YS@TO����`��L�?ۑvB��')"��#�����7�_?>����[w����[������(ď0��gd �eW���+t�\?���� �T������FY0t���?ՍB��3�L�ˮ���@sj�&xΚ'��^_��J��u�8Z��~�IeAǤ�(�f���z^�����̰×�`�n��I�̔�٢nM�"Y�e�_��°�����X���EЄ���뇧;T�>�}�'�u�+�;;[�*����q^}�h�@}�_3Z����ZI#�J�܅`���2�E�ƋT��t���,��@m��X��Y��D�]v՟A/�F�C�Ӳ���ڗ)�w�
E]s@�3�
��l����t�^b�X��I�&���BX�F�I-@U��""'|-�)R��b����ByϷ��}ê���Ɩ��l��R�yj�QN��z���T�'AC����[���,:�6vNG"A%�I]��'}����; �3�A�-�r��_:��<�?u�[>�v�.���.�
�ߞ?���ׯ4ԥD����7�跜�M6g Hk%s\?�3��Yޝ���=�M��w�*��T�%���'�n`�I:�L9�G�#����o�8U��������Λ}�������A�)��]�Z����Tr�j��{�HA�|����T�]�'͓wH�ןW� ��Y~����o
�r;G��i��H]#Pw,s��j[)��-*h֚6ڠ)�*yJbȭ3�RňU�8hyp
�>�6N�G����������]�I��|�G8m(��ԫ���;5��D� ���>��/3��Tyx�A���O� �`�V��O����@)�O�>[N�]1���u��L��L������ѥg��AF�M|�Te\��Ǐ���m�sQ*n/��5z4�XL���e[=�D�2/�L�X�Y͝R�L��_��rr[W��@�ӻ����Uw�ΖB	��0	;!9��X�#�P������T ���z�H����"ʭ{����1@u�����f��b�Y(ȓ�p��#������Iq�;o�̞���!e���1����x�N_�4�z���006ґK�E�����ӱ��X%��<����`���Ʀ8p=ą`���!��-Z�,���<:����*+�!��w�ǮFi�w��؀-�TU�w���֭�V��=�:b��	�oFc;���y�8�F�ŬU��G�pJG��{��'Z׹ O�Y� �Ѫ�{��y|t�����λٖ
�30�J�v$�y�[*��~V��꒑p����жh��\��{<� ��>���4>�}��z|�Q͂?v��ł9,�n�JF��i3�~��Gp�'JG��T2�[��{�oN�v���qQ,V;�+�7�cVԎ�Ij`��ҠE4����j�j�iE	��D��>�d0˴,{z�=��i��Ϸű���/�>�g�V{'��x��d�@����ғj�Q���W�^u�"�$�P"����� ��AN�ה��9��d��� �X�:�V��RŴ�� �Y�� ɉō�0��#�.�Y��'��������������6�Pο�9m
w@SD"�yLNi��Б/�#y��rE��̺�*������_w�ww��w�_J�sۍ<TR��d
�$�/��1�B�a��saú"&��0j.�c��ZZ8�)9��' A��ɔMŠ��������O��$6�:XǪ0����YL��Wا� �س�h������'���lƪ4�4��i����SJ���d�֍P�q�>+\�T݉n]*�����;rIL�o��'Cv��;4��@s| ��b �$*-��&���#�OG�I��F��s�Y�p�$%�xsN��%���1�ć�4vj��>����>����8��D!�/���{�,N9��^׵팳r`�g�nZ�v4N��(iA�V)t���������A�_�������a�� 5���Y���ŖƶIT�a;��Ӊ��O4��;(���8�����ܺ��yM����b2^~���r��z# �`6��-h����P��f��'5��Y'V�ˌ�gSV�̳'=�ɳ�_�$� i����v#�"���d����B	�n9� ��&�����*����q}��n;f����d�XRxS�� ���#���x�7�}<X��?
I��D�B�MS��_�%�����~�5>�_�Z�=c�������f)����E�E<�K��[��`�dA[�(UC����q�ۧ~D���߾�j0���ߴF�� ���1�Fe6p%��B�M�rS��ڭ���HD�A�uݓӟ�G��������)6��u�쾝��1,��)oG����o�ٌس����i�x�����N<��G��?>���Ŗh��L�JN��[�a�VB��B
i��J��>����3;�m�tz5+�����PO3B=V�t �HS�˜s3�5�9y7/�    �8̥x���Α��u3�d06�q�jI��bh�!ۇ��G��
�0��$��.��)%/ί����K4�1�U���c�����Kj-N��0�]�O����^���CM�;+V㗍�I�J�S+���0���\ht���E�g@y���px��	o�� �1�M��Z�q��;��+�x�����ˢ�5�^;ˇۯ{kjJ�RX?nX_��,)���5u��1���q������Π�oJ�~��-㑌,ipFp�gTm��T�_K���gE�tٍ`�����PDL ��f��*jt��ۈ��ޠ�u��:?�.׏��=�Cf�� 4�U�=�5�VQ��b�^Y�w,�N�aXs �؈��W,���
��:�O�O��cxdo�J}Bb�q*p$��4��:���z;%`����&e9wG Rk��b���Vb��p���amze�Q��M�Q�8-л�~Q���R���4ꀳ�8��d�q�öoX{)�Lp-��Љ��E���9r� =�yQ	z��S,�X�_�����ק���c-�s| '�c@r�"F&��I�[�*� Q GfX�^,�W��c8+���'+�L�g��Ǡy�����H��&���t�=�GSc�a�5�2{�0�P�v�:�G
{A���=���yL0}X7�-s-+s�ž��a�p���zX�P϶�Զ8Չ�#���u��Gn��0�����ښ�їM�U[�����w"�����Mݟ΃>��M���9}�8C�o��,f�c�P��Q���Io�����MƸ(�6р�1Qf���i�n�@�U���m.a��_�(�}��E:$�F�Ke�
�F㑈Ǽ&_hfݻv�
�NC��'mM��b�]�7�{3�E�3�Ì8�X2��In�BV�L�j���s�[|T~�!@0���v4OR��� �	�զ'���Q�����ѯ*,]�OyK�ARúm�<ʳ��l��T�����w@��o�?�=��o�o?<��S���v;#^��Ɯ�L��U�0'����T,���9JRP�-��x G�-˞���q����*�v�v�92��3����P����,�BSْ\�qB�Ns�)w�uU����j���YHH����Gī����5�V���zbp�c���[� j���@�P%��tJ�͖?���u�d�|���MF���r2M�۶���o��c��Eȏv؝��f&3GJ��_�#�w�'@����kPOd�/~�g�����y<]=��߱����r�T�ݶ.�X���K�R�)+�f8��q�ȟ*1QZGچ�!oY�eg�C�hԆ��i�B����]�3`gFa����~ vV�즬�9_X�@Q,��[��H�+�[�}��PW�(���|v�@/����[�^�ԃ]��]Yi'&ȦT��=��"�Z�.�Ӎ�Y=͖R�9ΎڠAn<�A3�\�/��K)(�y�HM�����/t��IO�|q�:(�_�o�ןW��_W�@k*e%v����I��R9r�z��n��pF����#�<��֊���IOs}9��c`6ӣ�q�KK��v��JW��M�~RbN��l��b1��˼(4ڴ{\wSZ���v�MDKl'{��-�qPM����`�ͼ�i��rqS��+ab�Ӷ�6?��%b��ґ���/�uݓ}]��׳�����|zqz@�&����\�q� 6
K�o�5���zep"�
��6
6]:�>T��TښY���^�c�?�_��a������kYg�욿Si� Xd�������`*e���b\p���0J
3v�[��7������{�kI����Ȁ�PҖ�pcb@���um�J����W9d������1��Wb<Y�v��k���
?��Y�@ �X�\搷� C%!t};�<����GL��5��Ȳ	��Ä,rd�2�����c�RxI�;��#���)m�
 ���t�G�Oz�_S~'6�^�߇����ۇ�O�R��꺗R�B}�fjR+��|h
c^��6,l[A�֭fVP�vZP� ����Ξ�ԉn��/��8Z�:2���t�y�a��`���%���7������}B���9��k�a�Ua�[�F<<$���(���w�r�q��ƅZ�#v��#�B�]�<J������4\�>t�b�s�OSt�,Z�GA�p�7��gN!&Qۻ:ӕ�Iϣ)���V�T��ĺ\f���<�LT�X�8P +��:x2�Z����7��{ pB[ �s��On�t%8	�45"�� ��IM��F�������S'�1�U�
��%��K"F�2��Ō�|o䜥q=�Hl!��X9��#�v�fL#�E@|�^i�T�d���vُ?[��z���1�� bgbxLLJ��,��'�䴗��-���
�8��a�6Ӓ ��	�U?)�.�ɉ����yR�����?[œ�3��[=zO�,�Ĺ������$5O�N� A�a�.E��Lh!����(�%<M	N�N�\ԩH�~RG��f�u�t^XM��;�ɓ�!-dM���V6^+l�t�����S��*�&�ؗ$ō��Q�5U�ǂ8E����mP�u�荊��QsZ�V; jb�Pc��� �6Р��v���e�l��G=N�A�8�{SԖ�D�������P�~�qR��;��e���S����qDB��uz>�:e�N��iNm���g�R0T�d��y'�e��L�Zˢu"�A�UF�7Nj��� )U�싈�4�]��y�l�6�I���N��f��i�(��1�ړ?)T"s^EҞc�4&��:�J
�8����&ҋ�*?P�`�� �tQ+� �^��v�3X��P�Qn:��#����G9䉝X�_�g	ӝENY�����x+��X)�s!'u@��Q�/E�A�Wɏ������ty���\Q�F����T��E^�D��m�jx�:�qR����7��h�ٗ!�Tl��_�lT@=I`Ȥ0)�-@ [���x�`+�w�Rnh:B�qd'������T4OpN������4�ݷ����ö�E���P�E�ݑ�h9ЌP�W�sY*pV��KB��y�'8�I���4t�� �l�N�j�Y$�� �Ć���@����=Hz�]Ȩ�у��9Y�2���|� �5@M]��qR�����4/go��>Mt�������f�*���i����$�	d�CK��w���&�h�Ԝ!��Q�/�Z�)	1�Ҟ���j��@sSb����z��t�̔O�0`�q�#B��P� aDZye���Iͩԙ����펎��Kn��~�ݰ��iGcU ?ݠ��8N:N��A���)hJ�08���>�J㤎��N�Q�"�&|Ѧ^z_��j�~�4 ��PR��4v�)�U����z�P�6�JCT��<��qҀ�H���}�<�G���89��G����R1@�y�@vlͅf��426��{be8y�04���@��qRG��=)L2c 	`F��h���t1��V�M�z?OsU=ڗ�<+B;G���NKԪ4�(4�*S�Ty�+��.��h�ԃjN�Hf��;�%��F�R��e�9�0J��y%���;pJ�ҍd>��=�H�<6��9���")'���xf����R��%h4|�[rY�hs+ܳ]��vٱ3�,1 ��;
J>ښ��.�I.<���IU�CR5N�h���Q�/4�qcG9��ó��'�	���Mg�$���a��H�SLQ��[�m{]׽JR7Njh
7#�._.�H�O��	%��GƲ?M;[��Ck�5��'��D��{r�`�ɞ^�:���T��qR�s��� 2c��F���K��X�wS�@��!���G'�A�Wf��<dV*�xh����.�e�u4mݥ$m� v���.36�P4U,��)W����w[L�ߐ�����L���S-���;rC��=J�5Nh�����DC�ԁ6oA��0�iɃl���%X���$#-�y�NQ8A%6>5���/���*��K"_�I�8���y�e�"�� �\��sXv��	Ɔ�-���#	���H    �ch�Zt(�Y��N��H5O� �*c�SF�=�a4�A�<�9�E�����S���>�dȭ$��i��ѧZ:挔���p'b�:�()^E�7Njx�_�R{�j��"�'�y����Y�Tp��zD<7d(��n�V�=�"�1����Y�PPLiß��J�&V�bT�l�f� �-Vb��SC�W����� 
����;��$0xY�-�1$h�Q�1�l4�*qx��w?�gP[��C�8i z�F�Ͼ�,�4�`�,�l��ǌNqa�)yX�Š��� ���<����<�ޒ�F�����͓�WrT��K!4x߆(^�(�5AQ����!TQ�Y�k����|�����/i�B�8i�9w��g_Ϩ3&��ӣ}=Nj��ߠK	��f �薗.��p�L5�H������J(r�8i@����Ͼ�&�"qYH��=O�u�����9ZD!G߹��%�QfD�-�a>& F��=����W��:���>&_�;�+F��h��w%lv+Io��:��!��Q�"gUf3�lz�ꛞ��I̹&9�sY��S?�&���/ &Z�8?	5N,�D�gH�Q!K=L!;��D�� �����I�#��vT��KQf�HE�1ʴ:
v̲�!)���1n�5�E�mH�j��)����q�@s_���}Ҕ�}�yi4=z���!%euS��^��-)3ѣ�My�����2𳍓���0�����nc!5��?@�,��!�]#�I�t.��pr���<�N��/��z��Ja� �k��ќ� �^.�.��YM�}!4���2����4?��y�SDӗ�F@�8i�	ߡ�����ES�B#̮����1�U�+
Ex�s��^Q����ե�`���_��?�2�gUK3��)��'߱�"�kyps�\��ݬ#�=s�`�͓�gi��Nϥ"u|&���@�����h����pE�����,m0ൡ�������\uu@E]	�8�z��q��V�l ������꾺Q�eH��T!y&�}�d�;�݀�6�4NA�6C�S�����:��Xg.y0�2����m���2h�$�$��?$�C�C�2��'�J�� ��2�\7=ӕ�IK�uZ�����k6Pz���4�
o'�΄&�%���@,$�MZ�Ղ��Vk�T3���3�a����y�5#C���3��D0J[<b''5 :5���� y�1���o��M �D-��Ak� ��	{�K��r$�ZaCkL�
͒8F5mE�AQd는�¸]�哪��x���,~�&{� kC�H�iFH�*�)+��zÂD>dt�P(�)8�>���9䘆�W�ؐ��e��w���,�DE�挻:?ѣ�g�+�Z��מ��L�L��I��l(�˒��"5�dc��/ZK��K�{<��ۖ�pZ��ߵ��(U�D�d����܌�����6ɇ�x}Cb��^������nb���$��3��U�?EN����Q�O�c��8�{�/N���Y�fZP��XW�XS|��R� �a<M+E
�Ԟj8Y���an�&�%�����pka[����G�8����]��"�R�3�@1+��������
3�p�hL�.F�y�(�jB����QɄ҂��
"0r#�#��qR7���gG��i�����'��eePf���`.���#e�ڸ��\P6U�VH��X$�Ш���T��z���/zT�,���?
�,<p�m7�m�&4��X�%)GAI���mEX���b�	�.���+@2Vr�?��B}]�]�#����5�ȂZ�CW�����h����n?�Q�z�:ƦK�4�I�W�n�j?V��1鿈A�M����u޽c��'k`����vѪ��� �����m}]gYW,��qn��V�oS����?��W:<������X����� ���ڶT��`�o����A(9�Ã����:�E����ܙ�8�|I��y�m��O��x�Ԃ�$��|O��v�����t� 8&;��E�=����������3~�����i�<��}����o�zy�r�0�1G��t�Z,NJ�M�vZE�\q��n��"tSc���U
D@�.�f$J*���[hz�z�/���z���i<WʥamB�w�c�@S��{�N�p�t��0�c�b��橛��7��<?�����@1v�&�Fr tD��X�걫�Fs�c�t_1����x�Ҡ�f+�L6f+
f�ba����J��4�};�-�\=��g1M��暧b��X
���:v�$�	�:�^�4�2����tO��*׾7�0^��aےS�>!�S������y�/����:��^�`{?=��-7�n^���C9�?wl��P�L���7�������L���#�KG�vÁv'�M-�Z�����Ä�/8���w�����榇{����0ǋ��O�'r("��a�\:�m��%��Lp�@�Hi� ���Xf�#�;�-a�W����(%�1>\}�c��A��v�=��@0�����6�hᱛ�dgw�������'�����Ӟ[�F2�H���_��?�� a�a�A����w���15�&?|�@�ؿm��9��Jd�c�;l�кΠ�kg�n��}{���8"��@��:�e�hع`�n��=ۙa��PC�`�`�Ѳ��S���B��)Z��rS�Ł�>?⌿��ޕ$D׽�ќz����2���������uӒ: V�)%Z�8��lB����>����ͪ����r�i��x!0`H؜6��c���F�ZhF���bA:	ȱBP�Oz2��a������̏�Y��@�b�7�U���A������3#>���f}�������~�i�}�!�L�k�>���u��Ye�a�]����cyj�3�Գ��Q��J �-� ������H*VΧY}�u?~==�y�������gzиs�:�^f
�Lm���y��Ɗ��G�5&�� |��0�\�Ut�Ð���=j��5X���?�_���-w3tf�ą`��r�R+��r��уv�U��4@�tD��3:QWn�s#N�����/�����J$͡�Nv�ǡ�G�A��;8��]��v5Zѱ������U|���@t=}���P7_���)�����Cf���C��U�:C�b�h�u��`}��$���r�m� b¤��[o����#��{Ajs���8芷�3�c�2rtɉ)����4U~O�V*�8n��{Dkgo��>�]�uƃ��BU�=/q�#E$#p�"��.�i��ovt=~���q���`��N'�s�>}��P�R��X*�$�#����7X(Jh�(�[�������B�-�G�Q����'��xd�UB{C���<A�W4�&��N�y�@0���pce�A���R�+��x�b� ���2y�1��*���:,H�,��TAZF�^���f�a�������h<�Y\�_����v����C��S�y7�̹1��]�=�����4-yd��[ir>Ұ�f�V�t���r�\�U���#�3�}E�U�
�������,��lTv�
'6Ѡ�� �,I]_L��He<�J����P�`�{��"�2'�0��ݢJUDQm�{��rJՍ�-[M؍Ȅ��Ic���Dv�~�U<�|zp�q�7Xo�1U�!;���������B�7��.`M�?�b��W�=��Oߎ{���3ĝ�;�>�B�������
.��������rvp�8�~��vB�c*���X���0�	AM<��(�q�M �c
��"X�i}%(�~��N��%M���l�0���tR(���ma%v�-��Q�I��uY�Q�I�CZ�&�L��G飠�	mG�P��T �u��,�zHSG�W���5n���Λ9��cּ�LEN����O��g�ߑs�`�9P$l]���^��|yxz|1>^\�\��4@��V+/��$zY�Jk�6��wy�s{E�Ek|����ņ���Y�=��{>��    _z}x)�������du{����\κP=wX��ib��s��ɍc��֔���}�yRr�.��ei����a5�}�8>Ľ���Tڠ����v»��pY��M��m�����֞��
X�"[�}�������Se�r��:��Q���Ĩ��f�G�Nx�"���A�@0��&���ɟ�ܣ���~T���r��#�T�y?���Ȣf�h$.��~y�H-�DDY(�2HS�-����cf��Ԕ���H��������x|1]�ͮ����ֽF� �Y��j�����3�]�V�f�B�8��PUi^nQ=,��QݼHP�J>8�֚f��3�p�
ˇ���ʦt(a�@ߺ���ȏ�����{�f���b�y��~�נM�b���nmV��No�w+5�� �!%XX5��1���zhO?�<��ab���{��"��.Hz7�#o�'�����l9��v�;��1������X2&T�7�Q�����2)�<���λYM�I�!8%�R9�@t�tn{��p4F�Sev<P�Mj;a-�~��G�_F�Q!���y��m7��ډGZ�Ch���5����6�������KR�~�_�7���cE��\nS�<N���R	����z0u�ZH]�^�RP�U��\����E5�ӄ8>���c���l�������n0��a��P�%�VRqō�|�8���J��a��.��n��OƯ/����n��W����+��ח�����x6�-�רD���15�Nq��<���qh�P���	v��G&�8�J�I� �X��G�$l�~9����M���>*��nT$��}z"~������O�����a00˙�b������QU��ݫ�vW��w��Gd�ǫ�Ut����D �` 1-%�m��^Z��K����Ex���0�b\�<�p��q|}�&Ѕ\2����1f��Ȑ|HY�X
ʓ����W0ƈdy�l��r�C�=�V�yxl�v�&hA��6���$`kCqx��l�:ǹ1l�@��������x�-d~�k�<Jw�� �;W�0��<m��3�|�����r6���a+	*�𦺢p2��^t�e��)$��� z�L��Y;���}���V����|����p�WW!^/W�g[ �H�y��*�{�gKks��|�h$�ۑH�@�4Jc����\ +q��k���%^@�5e��0����ߵT��+<Xxg���������)j?mbi&�E�j
Z=?�GE�=���>j��߇����o�!	>$ڢ4R[�����}!������(����$mD�Q?�OI���[�_�빌���Ó�+�K?�b�ӳ˶E�e��)8�GTĐpn��r�����W���q0�Z��O<�2�x0(�ZJ<���|��D�]v�۠:�����O��J>�R��3l�~3h��(��-ȘbMekK�T��9��aa�V\5q�R�Mn�Ӓ:���G����t~8�%p����S�.,���1E��'��3)�W]�N�~��ϫ1,� �\��׳�'�a'�*�X�.=��T�ԝ�����4�yY#�1zk�#�M�^$��NzR��M`������v|����V�ۙᅔ�Um��!���}o�z&����0�5y��ț#!�/�0қ./N�3���= s�;
KN�_V'S��,�Z���Cn X��y����`�N�ϻ9�kB���뾔x�������	�击������q7��Z�f���Rq��P͢ľi��O	� ;��F-��t4�]u��H>�r��d���k�ع1vUԗ^=.L�c�.��6L�!0�YcN9����&Sth+������dk��<��*m�b���MȎػX�vw�	��I�J� �2�r�TYo��sG�����7z���0�Y�b�M��?�ϗ����r||��|9^Qqɫ����r�Kss�FGg�ւ��Hɗ,v����Lh�Wٜܠg�ˎ�Y�=U�
!��ć�KT����x6��`#��I(�D�/�~/��n�&.���_��?�>}}\}\��=O���Ax;ne��]�z;���+\t�([(�湗��v�5�� ��D�h;��P�'�����7��ߔ�X�-����C�C�my�W�Z����[���n���-\�c���V��ąn������׋�G�xUKn��8ɼ}�L�㋸��v��B|]M����t�r���Lb�S�N�=��#(���SY��ǯNB8�n|��lE��S=��v^�}�i� ���<b�"���$�t��2��˞
�UH�����P*9��`�aO�@�zm5w/�q��U���"v�OG���K�ܺ/x1����7��W�����r�U۝|���7��Nc^�.b� ;��n�Hć�7������0	*�YU�u����ӼO+Z9�b�������fwL�;�o`p�t�I��4m����� �Mm����@�Tu����>����Vg�Z{�΂��l����gqzJN���oO���bK5/e���Ѥ����.�0b��6��Lu�--1l��TGb�Gј�uO;dq��ܗ��W�ּ�G��=�k�1�c��Ų;�a�>��lN��d�)&J��{&[/.���?#!�������}�L�l�	z2��f��؆���C�ђR�I�Xx�����
��/+؛��l�W�������Q�k�%uS������4h����8p�y�xQ���#"`��8ndڌzj���7�`�U�:���� ��O���������R��M�
lHg�̄� �Ҙ^l`񢃅)�Rнع�U�pd炖J�%g%0����#�86VjD��$���������1��0`7���M^���K��R�?���|G[~�X��_=���yQq�~+����J]�`���E�l��e�ڌ+�,)_ۚ%1�E�8w
S��18��8v���g�����$n�����}��|p�o��2��H�O�(h0��>vb;���(-p��� )�$�L1v�X ���ezog�6��Ζ�R���Y	����d�B�� 
�3n�I���q�� ���A�͂��X>��PeOz���2"zp}�/o����n��-w�8
��~StrD��S,L��������|�,?��W, ɤ��Y�?�i=,�Cr����6��K묕�[`jj]� ��tVj��#�Y�l#�2Z/�8ii�ɔ��M@h]�T�������l�/w��}������7��nok�F*�˴@��'���
������enҾ��\R�����<Z�?�ƕ�y�b����ԼQx���ld]n�v	z=
X�`IQ��J�f��uO�{y��?
[}9�8=���W~ǽ����*Š�8?X���R
�$��m�S��!�*�6v�w���;�r,��my������H��N�news��_o8w2�l7�ͰM�Ϩ��=�RH�C�o,�J���#�����W��v��Pݷ{�B�?0#쁟ͅ���ڕx��q*|DuԸ�?�BnsU���YN��Ь�F���7��L����1�%���h6,��A�6I�:Ϲ �<��R������̊4�X0Bo�U"8HK������يŏ���?�������lz8#��q��칠B��|���2q�9.|ĭR$�UW���[�]O+����ǿݭkq��[Y�l4[��J��<��vH�.����M�*S"�ؘXNfݓC_���y�^}|^�N��Be����2#�q8`+�=�k��+��)��K��I�8=1�e���"1����j|�z��&�;��٤]iH���a�x6�>���$��*��	��eOK����fu��c�����\�j�*���TsG�1���F�+�[�I��{��C���_���t�|���X$����Nちإt��2��"]tO�dt\�ޔ�?V{��)��x���t�\�����-w�;T1����b���9�����l��h�C0,��A�sH1��IO$��y���y��#t�����@��4�X��    �}r�#O�8�����B����4�>T����.7���r���_���?Ҝ��V��������r7����4��Ch�<]Ģ��Ԑl��wڵa�*|ӻ��?����������`+(�F�	���Auժuݤ�"��Nx*}}w��_w�w�2>�G��v�ME9�n��w5v.p�����e����t$��kJ�ȭ{n�ws�8r�~z^==��TeE0麗�K!�k�*f=Y�{��$>QL��Lr���1��};ϭ{�+�.oH��`�������=�^Wru".VK���~",�Ł���L��'"����oѵR�[��HA��m�q���'4s���T���0`����!@�0�ޮ�!K��F�E�� &��<�sO�r}~�����+�*R�R�-!�''Pt��Z�ƛ)\k�(�@ڀ�uO���0����걥�`���ZT,��O�e�~b#KFnv&U��A��PTX�O�Qq���;�Γ[�л����R�j���|wԙq�M�K8*��f��[�#��K�ܺ'\Ӏ|�������c�d.e�II�3��N,�Ŷ4Mo(Eu�3��~��LL:����F�[���7aJ(wӻ����\���ST��,I������	�RHÁ�~���ZA�P����@�#)UV��E˭������e��OJh�\�Җ��|�;�;dV�d��*�v��2�cN��ő�)�x�Ϭ{���rI9l�g�T*����7g,�G	oByc�خ�靓�b�˪��*��Hue��mq����W�e�mI�Ϙ_��_f�Ap��#Eɶ�Z8�$/�^`m�"uI�����qr�-�P}�{1*�V
8��X2���=���w��BƘ��X���ˆ���6����zT�+��\":�D��}j�޽~����������O^��v}���}4^�O���5r!��[�q{p^��ی�2����&Z~�Τ��:�f��w�~Z����?/��}�����]XWPe���9�H0��T�(3]�ģ8�^��&���h^�>5�����3������F&&TJ�?�5ؾ�����sUhm�Y��u���ۨ���맻��~y��L��t�B2ٷ󴒚���]E�G��gA�H�Ѫ�<mB[�g�f����՛�7�?.��S��isu��s���<���L�l={��M�d-�y�<�~�Xt'���:������d�p��p���3W�9>�n��aS�G��^�T�]6\���*A[G���@���8�V�k �4�i�#���c�?����4�'&F���$/<b�^ۘN�_?�ޒ܎�]?sˁ�K�W��3��;�!�i��hC� ߜ�'���Q�q0$~��`�|�2��7O��n�B�����U�!�y3a�tEҕs���s�8'U�)���[y �cl\?�Ȕ�7|���ˏ�A�gW[�lp���	�\X�Dhٜ_cLکұ�>���|��B���^�����SN/~�୪@�f��ML�{x*�6��I'���~�o���)i�5�;hU�I՞���{}�63I���c��h8��T�u����Qo�����C-�)���:1)W�G���!&�x����f�Fg�o ��ۛ5l}l��h���$�Qh��in����m�Rz�MV�17փ�`�	��P��	fIG��I**��#���ˢL��P�+�Р��塂��55�=x�hl5�B�gV��#��tf��m���h0�)�aI!�T(����˟mo?�	t��������W�'x9�Z=w@8�s��� �'19{\�A���R�2?�C�ZZZ���\A�>\����?7���l��{U��Å���,|RjuX�⼛P���j��t	�h�~r��!����a
J9X�_�����۽��=�����S��/=��&��,��Ek�Z:*����ψ_e�|��8�^�;z�8ܻ�����4F�s�*��d���e��w\����i�������?_^^�S��Ƭ���%����/�7?��꽳`�"MBVQ���/v~������ٛ'���ݯ7�����h�K�>t��
��/���a2_�|طRU���7�_)�g����J5����q�����B��'��$H���عOONH#�xJ���ߊ���������?<��v�7��!��|%Δ�7UV�#���rt�c�t���^Y��;��r�a�\]����˹�$ye!��	�*`>F�d�RA� �g�ޙ�$��[��`_q�������?>��{4��CG=G��@�aӓ����_>�r����P#��j����Tz�!�Hn��y ����α�1�����قK#PgO^��2��g��b�+f�"{gr�`k���� 0_t�F��䁮�L h"e�A��w懓���_m?���w������*Tз��X�+�@{�;4�1��ܻ��]Oص�G[�Y��� ��1EF��8��M���fm�#ܾ�
�%����|�y�Ot��hr7=���~�M�7�:��`��C�d��gH�/8 ��!�^��7uI�评�7]A⥩l�5�D(l���HN;*Nfߝ|M>���[��ғГw/��rr�Ak�J���Ab�\�	�>���>����� t(���J�ɹʗ�r�//���/� T:��UG��y�e<yI&��.����}�����?��_��_�X�/�Zn(�s�<�n���.1[L����`�O��{2���_��8��LV ��U�9G�YVѼ��S��8�������+&�
�!�sï�;L�E�5��{�^���G���G�߿��cw{�,>|���v�֋�&��7��Y��A�rܿ��M�0"m8e"��"��42�ɷ�n�������#k�l3��^��8ځ�aG`0���b'f���:��j�2��������}�CâC�S��MNY�A���ph�I-�&��X{-B>����['��oM��>�.Ð5>�cꍞ�� �\V���n����H��Cm��%V��r�~J '� !'�� �֐�� 'B���6�? �1OTRSۗ�l߰h�J,n_���/�$�8����&��C�h����� 3���h2�����%�R#�����X�^�ډ,�^:��̄�/ސ��"`�R(N�X~0gt�N�=��0kL��\��\<��xL�e�0�7gx��-)P[��Eh�	2*�t48�����W�	tȷ:Lg��1�$v��.,�Câ}��Cr$�4���f��
�&�G����A�!	�x�xd���&4�&��S8�h���#�sL�s$7�oQ=}��:�aс= ��鋖H����: b\�"ɀ�`u𕶎D���7���&U�V�IҘ�����|\Ă��gz�_Xt��-3N��@�76�f��G��0���|������ўF$�s\B�*��<��6A�}�h ���A��Rc(q�	�wzbX�"X���{@��$+`���ۘ�M�B/�s�d��Ӧ��y���N�DS�c��P9�Q��B��w�7��ӗjj���$�7=�/.:�/[#3o8x�ĭ|�i��h���]jQ!o����^#��*�p٧Edn�F�@C��<�>�3 <O�Qyhz 3���`�r}��ج�nCUwP�m����+yN�'T?�*�Z���K����CBӒɯ!%Li]��+�3�s.��^==y������ˋOq��Wn��^_E_�i�x^�a��H��`Q��u-���v8�$�u��@��m%�bF �Gy�_��x�\Bf��M�Yc�9�oO�W������ۜ<|��5�K�s��6dB��|�~�/�[��^*�dg�wo��s�$-KV9����TN�B�p�F[�e����D�3pX#���z��} N/�ԇ�O�����{����Ƹ��{�"����֗�l��w����DŌ��Úʹ=�����[�B�����b׋��Vs����tFN�`H�Lh���_��.LQ5�Xɚ@��*�:Dp��˻mLWj�j�$�s�d���U�q��ɒ��.��.��e�0���FqH~)$H=�h��Rs�?�    ���+��_����(� ���7^*�=�r-v��U��-���尠s�~�9-#O0~,�/AS�T�<N�������ס9���K�h뱚�Eے��ԾG?̓m��a���!y��C`H����Gʯ,�O���T{����������7W���z��e�<�yZ_����ȻՓ�{iSOg�rʐԅ*�r���_�4�j��@��#��Tw���i��@�E�.[I�>���+ {�J�ĵ�聩-9nB4�����铓cM�h2[��dԓ*���>:�bC��Vϯ!Q���G� GfzI��޿8%/���g����߬/��/?��?ެ_o�7�ݞ�)�[O��;��q��I[��E�	�2^'ou�����q�o������|���7D��+�ʜ�~Cfg|��Ij�H�r����rR��q.3$aq��w��|.��P|�7���FB6e��=n�0���"�ǲA�Hz��R����1:1�����������USpIa�L��] ��Ktcw������O�M�WB�L$pC�(�:�T��=�sO���7?��oo�}���m#��/X���*z�3E������ẉ��x���M��_��>��7�O�Trr6��2��Jٔ�Ӕ����h�[*5��p�U��\}��!�7����w��vN��߅��w��%x���v���!��y@Qe����w�&�>�H�yy�)xqm�81=uFjC,�t.�zc�C�|��.�G���I��Л,�d��8X�B���j#�ʑ�d��s+�yn�Cn�lh���:��<9���	gl�^>|�wW7��y�#t~���ʓ''�G����6�OsRz\a�{̣\��1�C�����U!#<��"^~K'a�-R�
v]h�h��Ȋ�NV����A��t��ĉ�f����©p����/�n����j��"[�_���@��4���%@f<I�}b���ж��#�������&�v�OLU�Z�~�UX���J�5�h]��<4]�B��H_V�u}CE[T�mb��b�s�*:�_�>n�ׯ�o��DP	�MTw���C�%��q)�u�z�|osu��xC�@yzWi@�&���޿z���>t��*v������֡ͅ���͡=��� ������L�s5�83��:��7��=o;�����V�s�ۖ�	Vz��?,�4�1d�Ѭy4��K�|�� ;�	Jڡ�<�7�ˈ���w���uw�>�� ��uw����������{fh>{�#T�S��V4��TL�x���ς?������֧�gkN���IZZՑ���d���O��s~��PsmG�g��7?D�p���m`d���tX*���i�?!L�8W����9�hS�=	����Nvo���&�}���1��������L��kr�n�	20�by�2��R��W?:�Sr'�q8��k�!�Í>Wd� �!�'�v�t����:����o�ݯ��f��z��c�3�5>1��z~m8bqhRE;���,3SE���]��c�[���w��9T�=$��P����)�N@�i'�p!$w��Z���g��z}��tm7J��i:n�lS��Y��1��-��O�veFr_��t�����������F'��|�:2���M����wG��g�X�C%�1v�u��75`�s����C�W51��.R-wy���������z{������Y:=]=L�������_�����}�49����0U�������T���@� ,�U��{#���<��u�#ci^��?s�MF��C�5 �6�3���?$|�w�X���������r7<�NOMU��R|��s�k�D�8���n�,��X�����!j#
i}0S�.�8��z�H�����N����;�C��1Sg!�!�<CW�&3�Td���T�X��CRV/O��M:�pƄ��:Po��d$vny��6#�阤�^�
R�aq(�Bא�Kުe1*Ư�J�pt�`0�?�Py�1&
/~|F���7����~y�����}��
�S���5I{�&����ꤧ<OK��"՚�Ӥ�3E��+�/~���'�[�X��r!��Ms�k���]n�y(�.Y�b�,�?>;�����d��:�n	���y��uހ�(���X��ߑQǓG��������#t=�=V�OC�1ПGz
��Jھ,�;M,]�^�<�:_"Z:��^Z:�l|��؝�2h_��xf�"aM�a��o�+��Ӳ� e̲AAX8�����1TI�6PL���� Ĳ=M+�=dZO�G�5R{ѱӔ8��*��#�4���M�74�7��e,���Ԥg����e҈�7�.tuW�1�j���Z��g{o��=����Μ�ԍ mޓ���s�1�g����K��4����o�yBJj|	�hb���v���^���_��hk��p��G��^v�#�Fɍ=��)P�kd�@`P�Z}�il���!�����BD�7�!%O�ԇݛVtB��X"D�ʶ�?���c�i����}��b�o�$�;nbn�g��zԢ��ZA�����ö �56��/02+Q6C~��I�>������?����n�*�>���G#d>�~�үf��;Y|(K��_ʓ�3�8��P	C/o���Oߜ���V{�~.Y�&np��<�J�.r,�����О��w>F~�!��9�<�V����Q��w�w���{Uy�m*Olp-����Мsd�.�a%2�R2��%��:���ӓ��կ��������������r{�q��z�M�p�\	�qttqC�����ch�M02�	Ql<��׀���tx՞穃�м����m��?6ޛ����t�vo>sL(�e��csR�4�]���<t4��`���,$|���9���_C�}#<5W�L;p�3�߱�!��L�t|:��L�Fw��Uz�=�%ٯ�<��-:~~�͏�o�߼;CG�ܐoj�����b���ZI�n�ZW2�٫�_*T�k<��f%ϥ:������I��_oqw�����?�~UC�F"m���!�e���\��g�`B�S�2������HЍ�� rN5���y)��r����������UO��߮���5d����ģVI��GӯEM��җ*$v0E[3d���p��!"gvu0SW���1No��w��y�����ߩ�F����Cϛ��=@5T;!��9R_����/�x2l�3�x�:�ׯ���_w��ﶊ����n̐/��&�x��C��'n�ؾ25�ch`���C!\�����L��<����f�tw��ծ��81UA����}�&�ݐ�d�(����W�'*d$R��@#w���b��c�#�3O���Yr��%��^�\�J?�J�
�@�����=��2x�:�g��p���ޡ�<S�.�V�����xs�~u��������F�&k@Z.-��
n3�$�ZZup�9F0�+)"�6�� 7���<�W�����'7�7���h��lU��G}.��q�@;'����y��}���Vu��Q����*Z8�����Z��m޵�k�ܷ~s19Wu&�	��L�v�Vz�����^lr>s�##3Vu�p'NƔ,�(���P�=%�������}9��Y�.^���&R��7��ۮ�0�I#Bs�)��Z�@���/�(�]�[��Ν��7�$#'����'�zK/A��><�֞k�E"I� ys�r�~��u.ݹ�5�_Y�:�3�j���=�HDl��ܨ|b��Π�́��z*�h�3��M/j&"#7�� �ۉJj����%`�}I��=�4m�]|����7o.��u��a�~����?��U�O��\q3v�T��q-<E���[y�欒��K�V�D�d�>V�"����Ћ�ߓ
���(T��7����j�Oq֩v��@�y`���>H��!X�T~	f�����L���������������=}�~���l+�Ϋm�7��ic�9�{\�N��Ǳ��C�N~M�'ų�\�C����h@�*�:�3:Q����MIQ�2i�>8�7V�&��=�����F�3�5ȯ�Cs�t-�=ϋ����yV	���������ٳ    �P�11�>H��N1�-��t�{�>�^�t��7�	�z���ܴ�^~t
i� ��66����Hr�@ɘ_É6[�F���>�MjJ{���u��:цE�B��0Xf��dX
4`�-1dD�ˆ�>�&8��������ǻ�����ʱd�5��2o���;��>�Aj��CG��������3F��y�3?�	`=��?�|
��m����$y���\G�0l)�E4"d�=:;���,jW�.�#�2;�<��>{��g��_Aǳ>�B����;��4N	э�=d'V���N�,�9Ⲽ$�/@X>�<{���мI�H���ڷ^v*���R������Ȃa1ƈ�9_^c,Ѳ���</b��y�d���ۋ��?�/^��y}Ҥ|��_�D��q<z���N��g�{�9�*ֈИ�LF�t��
d��f���<Ӿ<�#?�no��=un ���/�X���4�����l��c6�`k�5H(�N�A�	is?���̓��10zJ�>�~�mQ�����>�8�T�N��O���ւ�(h:,����L�GL���p�{�Z�F#%^�OI��Ƒ��dZҚ]:��:� ��RR�kCf2)m�|b��$�!��s���f(F紒�����4:O/�������n���U��'��H�ŋۆ�]y+/����Y���@��͕L�s.�B����ш�`�d�O{����r��t�r�d"�2Hm��lo�]?�c���M�1���F��UB�`�ri�����Y$��P�mF5?0�K'�pLO�����^x�?x��eZ8�R�vX�X�LԸEjb�X���f���B,\:�(��@�#�֢=��ʦ��x"�}�8$��8�ךDE�r�ӓ����d����8vr����=��W休�-RvbM��t� �\C�W��G8�Cj���l��In4)0���9�	8�x{�r}q��-��ܠA��7�A�Y4*����6G��	�4 	c��1�O�$Bc�P����"�-����`���(,=�� Bo��s�%=� ���2�栢�g<̄/#uQ����z������O^�>_�|�����9�&l��o��h�� �ӝ}~�N'�4�l5n/*��ɘo4I=���"�@3㜲�r�N{Pa��hS���B��U�ǖG��Xßz�$�6xn� DR�q���!��Z���T�f��v����W+�.R��ؙ!��fP�����d���Q&�M��h�~��<w�EP"����%�$����6.k8z���iF�NRy�Y��jڣG^(�!��1�]P�NȜ�(Ò�+���D��6$��H�S���֠!Q��M����G��їX�R�`*�݈�m+r{�:)B��ؖ>��������{9l�xK���d��;^]���Ҝ/#�H�@ks�i�$��r��rI���ƣ�[[���]���kfR��=�]ˢ}=[� 3��y�Z��Ŭe,D��=m�F���M��ɟ��#�Π�f%H�4ْd���z�G�����U��Si&��Wt�я����\��Sc�����,��V&�B\E�����6rz�#�
9'����թ6h���bqBT�vI��V�p��q*vG�Q}h��@{����4bF��_ ����~.��竏$eL���A���.�eѶ��Kw��y�§Q
iz��y�<��jfhcFΠ3PFK-�	C����H2e�(#��l
����%Gq=]rB�(�1DIѣ7����+�
�ɯľ��͢��A:��s-��8�}b�w3��dr�?m�47�=Y<NE&�p���t��"�ʃ�M���� 
րX�$D��$iW�z���{/����5�����X��]������W��Xҷ4+����ZB!'����^u09Q#�*aM[��Zt��w�VSZFQ"2i��XNltO�s����)���?���e̤�~� �p�mL�G ���� �+E�E.&G4/�q+��1� d~�k60Y��an͐ԅ)�E�6��va�>�dT�Տ�C��JT�h}
]f,N߇οЁ��<�8,�P���D2����7*�F�#��
<D�����2h��� �B�qVc8���0�[�j	.tT���32yL�mk���M-�N�X����V	Lp�v��F-<*Em:1m<.ݴ��-�f6��ŷO��T
Y�Hp�g�{�E���C�3�[d��h���܅,�ɒ\i��T,B����O�yJC��T0j��{�t������M@���*&=��i���0)��?�q\}�K�e��z���8��g������c�C��B��x�E��d(MS���@�� �@$8+2���d�ւ�!��gq5g&>�>A"���;��Ĳ��|Y$uK'1鰍�=}��t����w'?�|���ۓׄ�2ON6�6;��$��H�G�;W����X�GgydG��?�\/=��FK�RRIN����Wew�m^nN7kaBa==ّ�f�"g�W�t8}����M-��ym��;�O�"!*i�{�Bσ��2g,T��8�����-�K|l'��vח�5��߼y?1ӑ�f��T�0�$�����l<�h}��T����$��}��k��ow���5l�޷��v(Ks�3�q�l��qr��N�:f3z�`����b�gɗW��<�� �e�+�����L�l��0e�����/��!A��mH/�����v}�_����7�9t�E;�����<�&��pCrA���t��̟k'l)�-��,v��-}�J�ǰ
���\�f�Zv��{*�&�J19D2:D��O�F��|#C�G�>ܖ�*rW	W��d2而�?h�d�����n�y���@kx��\��C	Y��x�K��Ggz���Ѧ�nr���Ѿ�Y';��p�(��OrB�p������d�}�}�`�v�bh�ӊq��s�3�9]��vM0�\e���L;�9�Z��b`~���N��J#��j34@S���5܈��N9fC<�ґ�qݠ�!ᐮO�J"I�ȡd��Fg�7
���$�tRpGށX��믙����d�f�F
���#k<Gȶ��<���ɄWH���p�yp�N*']�s���\[�W������|D��k��O3:�A�,ԗ5�������#�d��W}�,h�C���7]�n�ZkU���h�n�Wɜg7W~�k�`�H��;@+.�G+�[���\�}��G-�оN��R҆�nY����g&݀ ��,i	�+zi;�;D3��v��ޔ(��I9�h8�͘-:Q#Q̄�a��ۃ�IC� [�s]$�r�@�߳/�B��y��ޗ��8hS�0(���)�ʒW����r�� E���>Vi�CO1�AK.@K"����%G;��Jf��h�IfIh%�v����$��1�|�l��d�
OF�\�V������q���"��͚\}4���C�&Yk^�6��'��q�p{��}G�X�"\Ek�M���}�&:|otC1�o޾�n3i��!�Wb5�� ��L���U<'��F-�� �r>I�5�U�傷��r���h�^E[O�?�r���)Ͱu�8�����E'���u.��hr��
M6�T���r�7�\m�-��;��0�������e֭Z$^L�͂1���Q�&c_�Oɉ�,��-�������e J�Y��^��OiR��<y���}(ӂ}(�^�r��T�m������陰G���@g�d�%@	 �26ȴ$g���{�!��R8���D�k2��E�S����7�^���^�/΂�v����ݭ}��.z�G�@�����	bʧK���	��ۛ�w����_.�S����헏�_@nqv{�=���Eha�4�( �Y
�51X"�dڒ���_����b�DMO� �vNBdw�9VK��D����C�:���(`ᚉ��Z��>�����!Y6B�ɣV���yE81�S��>���!&2cc#Oeu�����������3�A�Yr����h��i��3Ґci��������Ɉ��	��{e��F�	v}�k�h�V���q���;�4���S��䛒L?R ��69s�'$�9�9ԕ     �4N�)�(�"c���Ҡ�C�!�@���S�~�� [,��ɇ8��^���q��>�KR�3�����E���s/v
<&�ˎ�r��U��iu(���H�I�3c�����������	''{8����-Ӿ8UZɆ~r(��ܳ�2�a*�"/����z�&��pZk�x�0G@Ms؄�gf!l	��w�f��`��	7����#12Z�VB�P�b��~�|j�[Y��V�=��Z�<�Q�l��zlkő{+��.�t�&g�+E؋=�%[R�W�#8�,�4�ŷ,�ap�[r9y/l�Hwl9����l�]�Y7=X��Q�n����s��e��ƕ������6tʬ�.�"1��Lu"1ct^�d�e�qp�u)C<+GFFK�r��%�������C��7�7_>�c�<����3ەƲ� /����o���h0�ڝ�D��W�(�E������/�`��r*�K�nr����b}A�7��Y���|� l�`��0�@�Ti�=�5%+đuHOg.\]�CK��;�*��4��%����,<�-Eh攪D��@Lp��g�c�`#C���(V`m!��_3��.$�y�FoxrV��'Q���qc�Yǖ�1�)&fz8�>�n�׎G����臿�ͺѭW�x�I�RS��т#-�"X��bj��.�e��.�B�@{2���M>�������̢��8A�=�N�#�"�� �p��<���@��@S
�ì�]�K�X�T�>��>f	:M&�����>�i��Mb�$Y�I�&��p/D1<4i���"��_Ġ=�xvb�k^*��L��^����@nx�c�9�	��.�
��<w�-�W�z��a�\�G
 VݛOd�q�8�71ձ����ˬ�DD?x�ͣ��G��L�^��Dr:"�~����z{6S;S�C~�tW�ʢ��o�=�P�425��C�&e
pD������J^GF�'w�+�<�*�[2��I<�wh��ryɁ�̺B��n�Ѥ��+4Jae(��>��V4W��Ѣ��
}��hz3?}��B}��1��c�S:�:xU�k2HL�~4��
��੐
����
`[-E4�Ɏ��K�B׎�5�<�*4�>���6������/��&��b�t��7pړlp�I�z �h���v-zu�B?H$5�|)��I}�Ds(w�셨'8��&�����-����hb>r3�p;�g��p20 �	��71X��p�l���Q�E�u\�v9�>?˂�ueE��
	��x��h3���_Ln�x�tXH�G:���O�@�A�K@.*��S)�L�
��ƘP<�s"��.\S���% [4_ �r������%�U�^F��cow.�t��|Y�rK�}:�ԏ�]�tT$�&@�dnr�'���Uh��#i��3�E�,�F�ݤ�Y,�j��9�Z�J	^ZJ3 \���jD�c:D����Մ7��B��cV�,%�����x�"�m,�^qΓw2�G<cLtlz��Y_��6����"RR$G����^[4�u{���	.%?r➌��0�E�,�����'p� ��r2�K|�dW���L�h)k����%y�f�t߲�q9�#���A��H��ޡN�y�F�@���ĔLw�aI"]��R��m2ڥ�dZ�rP�8x�*����V��̩
R�L���_��T9���L���ӥ�?9�2���<(C�d���q������gej�P
'�|u�����	�
c�Ѹq�	XSs��rtn���J�J��X���2c=�XH%r��j��OsTikT��G��XuDi��M�pA���U4>1�Q(3,2��nMH�&e��ɰ`���R4`��+R�{�����I��~.X���ut ����h�5K�rR�n=r�D�����e��fJ��H��`U���jʌTHJ0<�UF�P��"_�����SK�w�j�T=��qV�л��f	T����T/<���Í���R4�f�"9�jr� SO����G�T�蕊\�4Ktu�p4K������1��5�b��1�W:!�.���Ƈ�Vơ5�(��θ�#���������!?J\ƠZ�ے�$-.�sS͑�pA��h��B8j��Y�,� p��0��#�jI��V�.9�9y��-WHÔw�� 3]p�R��a����4��[�F����;���-�Z𴍀��"q��k�C+��۹ y4n+�m`�s\��x2��r�32Z����+CV�BY;*dY``(h�Zq�4x7��8����F�P��[�X��`	�!�뫱9�fв��A�C�yt�,�����C�)/K`Ð�8=X�!�_���Ɉ%���y���]��� yXm��%c��lN���:79Z���X&��5/���=��Y�C/�A��n~؃��{�udv��/�K��QzE*��Xd`�% u~(�Qt�r �Lpnp2XE�j���콁��X1J�YuJY>���P<)�!��� ݸh�c]�7#����z����ƅ9��)D����B"����?.�@�P_D���H�_����
1�K���� �ׂkC>��61e1у1/�Ҏ��/��Ma �u�� 6��m��2Թr�92Zr Tx5z��xZ��b[긲 �/��U�&�t��x�63I2D-q�
i9�)�f|�^���,����>�JE����ӳ-����`a�w�8�h2���O5�ւ��T/����&�`tB[Vs�d�=�}ϴ,0�F��|3�ѣ���fЄe��06~79Z�����U��O����K�EPp+�KJw,)�O�%{	�~�_�p��v+˵��}P��j��>��J��ba|E&"[Խܫ�����Z�O�n��c�NKTRWPű�M�r�ضM*U�
���*���01����B�i}S$�����d'�Y���E5!�Mf��;�x7U�(��C�X'Z_�:���(ԩ�4U-����,�?�����ɧ�}��O>y�l��Ϭʵ��h�@ѷ&�Ac~���������b*v|�nk��(ͭFǡ�5�&�I9ɣ�e�©�Bj�|N�-��;�U5�F�쁓H^\����2�p�JU�F��R62Z)��ц��^|ש5ݦ�fr�pYn }Z�����=f�h�C��>\U
�'`�נ�a1m��)�l�FK�"��;�`��[�����!Za�Zf�^�1X9"soN���D����M4h�ӣwwiK_,�J2O["gX$�(���pr���Tq��A��:DwX��ȿ��`RiҢg�T���R�[!���R�ЇWП�\�*.��4�
��T$�$���������e��6C��� ø�C1�B�<ڗ���K=���*V�x�wYg��`Bz jv̒I�&K(q:6�����N_՞�K:�V7��|j�jbA5��(c���h�E�h�ehB���_Hs'U��Ʌ�.C�l��מ&����-������$������kG��X:��Υ����|AF9 9�bd�7��������K¥�$T��g+�i�*j#4���
��=������rk͑�b�H�+���#/��l9S�k��ap��F	nq��r�)s#�#�dG��8��-ɯ�+�C]�U<���62�+�5*�;E]�h�FE�5:An����d=� �O�6/�7�r#��h2��=���b��fj�DF�4�iM�����~�3ow}O�w��e�~�����ԯ�3�v�[Kv��P�0�cө'I���h����.��$�lT�F�s|/e����$K�+��A7����4hvf�l�sq2J���h�p9rO�KV\��j i^�)�%��#a�Bڈ�_Oe�\i�,{19Z��c������|�i\�� �4���Hx_�8]8%��LM�`)��Dj���>u_�>��J�x��D�ʈzj����с��M��@J2m�#Iw�	O�jY�a������#��ѩ���/�c�E����g�x����n27ٜ�������	,K7٢�����?��t�Cف��*x�S�%�i�%Z9t
�[��8���Ou������1    3(��ӁMl��G{�ѡ�ɗBy&�6� ��F���hR�k&���S��S���ִ��@-�L�\sS'�vfY���,V�M�A�S�7����؃/��C<���]� 2F7��%<=X���T����5=97 6.�ٝs��Z�X��gb��U�dL��e%�YE�!a�*W���P�<92�ȧS*���x�Ӣ��w��p
f���͚����N����͗ۏ�RY���BW��+�L�k`ı�LLr	]�H'YWڸJe�-�[GFK�Ha�׾F�u
�N��P��T���nM��	K�YJ��A7@K~0�.}���9��:X���O���/U�$��0�K��en��(�#�1�Y̶h-����1FF����(]KA0��3�ü��le�[�JW�� �,�N�
|�9��8�3U��h���\T��jb���e��a�i��|LQ�	=d�*�V�,|��-��{���Mj�K:et�m^�lڅ-�]����Mо�#��Q��Z����e.5NQ����9��ݦ�S*�i��R�4s�z	P&�����L����VSa��cY�A2ٵ�)�h%?(�'��ļ�wR6)������䫠W�ᘾ,�Ry$H����B}l
#*�M�茌�B�x5-����@x$��h�W�oR�v�Tu�J@�Gひ~rMY�Ar*:��XV���oT[���R�_��h�ړ���m�.���>�޽~�vz�n^j�8΢����<�
Hy��V���؉$(�|������5�39Z��!�9P�~��/�7�W���w������Ul�j�>��ձ��h/�9��Z�Idܐn�B�֤���[�)�C't�[^����I^7�ǔ���2n��ʸY�bu���M��Q˔��G���xc�[���v*l}�H*�����ۑ7+�����8��c�BQ�h0,g�lp#7~b�O�W��v�j�:/�P<۝������
m՜�~���s��-��D���ıf�۾�^�c��4��8J��?��9"b�ܥ��țCHm�;L�=�J��%?����FńD{���R(Q�\C���ؾ�SxL��X�	��Ҩ+R �t�e�Rgd�Rp�V���~p�,�X��ѤS���U��N�ZY,�R��S���VE��"_��\����6��Hp"��s:�8�RD�9#7�>Z�g�k%��(
�(rF9.��L�`΋~x��,z��y��_F%��b��>UF��0�����\S�yر��5ֵ�[�������"�|-���B\�(4a�������m.Aā�+�� �֒���{�����)��&�"�h#�_Ԃ�f�ڞS�,��?|	��t�p��cZ�����63n9�Q�&G�8<r�eSW3C`�x���9�'?�$�N�s�d��O^�+#�%�r�;*W���	��ř.�e�>��ZG�ѣ�q}���L�A��\S"�#�E�J�6G�_l��4��A�꟬�B��E5S�p����H�OZE�;rIV�GF�p2B�F�}�]7;Om䚋Pbd����K>Ps#�T��2jt�Ay�@w���<r�qٓ��-�M���hvƑ⭳�a�N��1KK�7�X�RB� b6p���*��6�υoأNM� �
r�=_Z�7_��>yr��b�*սM�v$�%��]���Ȱj��ݩM�+�l,n��A+71X��s���F�ҽ��]�,�7�]�A������\��n#g	0�����1ǹ�ř-��G���f���a��o�eWa,a���b��cob=C�qh�kY��E��-�V2����&�u&�0у6/�2�/vdi*7���Ѳ����Cmkm迹�Mi�u�X��U$���ۿ:�n%x�Q���M����K��z�c\ ���Mv��q�r��D�G�|��U��4�b]��I^/� PbVR��D��F�a�7cR�J"O5]��N "���N�*�H��d�W˫Y`]�ӓ](˂}(6�C�٘>y4i4��k0\y�&��L��=���	��G'� �
�K��щXy�;qn�OM�ՓG�ة��؉!�ʅVFڡ6R�&��ـ��=ӄ�G_D�*��B1���N��H�ޔ���&t�!a�B���:�F}��Q�p�O���ڍ@��q�yoS�5,�� ��A>m���9���19Z��ڌd��r�0ч6-�apъT�S�MD�kd$��)2!�0Ӄ%������T
���/<HJq�b{����gd"�g�+1W3B]?�[J��{�֦��s��c��/2��sӃ�P�j���mv���e��tF?Xb�ǁ�c��Z�lG��Q9��Y�z���e����]�Ne���5D�#�E肼Ur=�}���T(%���P�K~�]��g���7�Q%�u�I��9Z̑��cf!�ꥶ��V�ՊLY�y�g�L��s�h�Q��>X_&4��������[Y��Cnю%��"��+r��ӕ�y�&GK$�љh���&b�%.�����q����1��3&����1��`�d�(�SMd*�m�E��n(�M��͋���\� ���g�<��O�{�_�(.R��Z�pU��q<U	�[�o�B}.m�錰.čejU��t��S���ŕg�;S+iN���r�2��1/W~�FN��v�xZ�Y�<]��g�rgiS��>��Iv�g���x�1A�|�:7��4����d�Oшb;���S��v���8���u�	/��C7u����6[׷���`Ѧ��F�X`�z���������H��ڠ�6���RP����E���qfjX�aF�?X2�R��������%�z$
����k��{He�>��pi�iy���p_�9��R IH���,�S)k��	*���� �,Q��g�����<�!���#��d���P-D��(���țL���ȱ�w����e�5(�z��4粚�O�ј=����R�}�,[˷����/��E��n#����L3sz�r^�C�vI�h�ͩq���o�GFZ��V#��f��#M$U���q���3J\n:)��w���)N�Qy)Ys��0��X(��:X
�%'kbT��Q=�Y�a�)n�}'�a�r��`�t�!�b��HL�H*A���#����S3}t�R3��9������[Q�՗����^��"d�^�Z6�s�/赥j-5�Y3B�^U�h�B�LN����"P���Մ��ϑw{`�%&�*�V�k�cJƾ%)�&I�,�ܾol�T�]U��x���vA-K<��ZVL&�}t�J���D|�&������P��h���>S-sVs��nԼ�p�ty�ԑ 5�ɷLU�afz�L�99��G���H�R��s���@��O���V$��V�:X�Вq[�!�m��.�e��A����I�f݄��mɦIJ��%�Vz�UK���h�J(Y��Sry�.�Y�!۾�<�6��X��f9$�M��~�ҋj�>'�M����˕��kG��O%�M��C~�'�)�9X���A����#VVst=m22�q���:P)p�����1�ݖ�p���(p����܂e���hLfr�aY��0��f�2���RvPFS "�+^��*E*��$�� �M����� /�ūo�nNM�=>�C)/tJ�iL�/�G�Tj<��p䇙���d��R-B�*!�UBd����'/ѷ��8�c�r!Pl�)�����#�>X��CIц�����~Ys{������K�5��Q��A����g]΃�A��7pe4%���t�+�!c�`��� 0%�*]O��঄�_���M��N�Ȳ�P��t��<��`@��3#zIv���n7=X��3V!�������&vmO��Ȼ=0���o��-]�!zL��\(�%{���� x�����dpl�@w�Ʒ��Ô����T�i��H�$,�J��O\���	$Q���R��ྊE��!8a��c�4S� p����N��5��#�E )	3��D���~����3k�����tx�!BeM�x1=X��Ӹȯ�S�jz*��J5K�M�eQ�N�I���8Ru�sBk]|x�    GF�@W�P�z1�jS/4�s=��r��n)�M�	w�7v,%�nC�V^�(d�!Ī&GKP�\j�\5]��gY�A��\��� ILɏ.�R J%\�T�����.�>X���2P�U-���"�f�>��-�2o����,��G$�����WM}��h�^;K�o%�"th�n'���������f���e{���0
��)��c��$� CR�FP +0.��i��b�������>.�y.�2����[��?�����n����e󟡠6��Nt�+���a�:�Y�O��+:��'}\%��z��y�C.K=L��};Ҧ�gT}	#I_;����w�_�viE��f��pi�g��R�Wj�N8\�Ȳ1�9�i�j�i�З%���R��9
�♂�i����m�y�$Ytv��e�*�1�"��o��ꎆ�}^�@V�����"�&GKAu�<��#|`��%t�h����jB�]��i^1(��mZc����}���Ƹ�׷��RV(�;���/�#5�� �@�Gv�FFK�E��(���/��RÃu���?X�0Рv�\O
���,��rҫʻ��Oϊ�{��tm�ovk&����.�e�FW���eJI7��$R�@U��H���]Z�y��}�Ȩ�Y���!����k����]�x���j接����4Ԩ�,.;��2>X$�F����7YWQ}��,�Gtq�j�GBT�n)�d�虳,W���uZ�o�W�^=_�\�~���/��vt��k^�C/⥴\�iE�ʈ�X�oeG{d����4A�B�K5�T9�52Z��#�l�Ufg��{��VY�C/�ߥ�ڟ��Itc6�Fњd|���KZ�t��B�X*}eɀD��E�#����d�*h�7:��J`9g��0B�ٰH�A��6���{��fY�a6�I��K�����D�K�}��䲺T�U{^"��:�t��TUM���Y�8��)�h���~D}��I(y��Sϋ�$�ũj�%�v��=$��K76hr~$4e8>���c��6�ǥ;���8%�t��j�+����Kfm�xL8ű��WRI�����!��"��p���ot�h�Γ�|�}���'|������J�E���aP0�����"��h����ڒ�.����!�BFu���M���0WtRL�.�Wo���n��p`
'��TȼX�n�t$I|Or@W<-�B:��
���ًJ��9�l�?�/�?͔��B����w{@�%d��{hY�G�<K^�S��\�n�!-�'�%�kE�a��V���y����P2��9���$��b����%ϒY,Cԑ�_��@W���}D����:*���\'	�b��q;1X��%�ƪ%�\���C4/�`DU�Q�Qȣ �Q1I�io��,��#�e�j�L�8�բ*���%j���qA�`A#5eL�Ñ�ox��%�rڴ�s�ܯ�z�l��������������5r��ζ@.K��;�H)�s�Cm�-���~�����Q���&9r��'�Ӓ��VZg��,%A��W�a���MdVY�RKk҃w�k��mϋ��a$M]�2��z����z���2�_\� W�^3=��6/��6����ϩL��e4i5�`5����Pm�2׌s�z��`�$
N)��F��&ݷ����m���aC���<��Fn2Y&�2-���Uhv�3�GF�P5��*Y�@tߣ,K|^��Y���^N!Z�J���"0�&�QW�z���y�i�B�o4ّ E��?�M�t�(f�^-Ւ&��.�}�,�`[IT�=����T�-����`�d�s�tjؙ��j�:�,� �����1ڢG�9��+�9����d��22Z��n�f�T�Q���%*�4ꨠ�D��|C%!�����-U2a��w�|��Y������[���隩���41Յ�,6����	���e4i�����c��?��I�Bs19Z��^��ud��QY�A�$.d��4��E�t����w���YoyN)�!J���'P Ѕ�Ұ�
�269=�C7/7��9iΩh!�3�P���5Hn�*�^#7��MD�C1�fQ�EHƝ�66綪Ol_��%�6��!�H5�<��;���F�}��fbz�L+����z�}0�3wry�	P����1�s
�����FK@����E�K�ػ]P��xD�����G��ո=~�	;�l	W����&�ƥa��\ݼ\s:6)l3�3X�[4y4u>�2���9��k�+'Q�i5���OH���x}B����ߝ��p�5w����Y�m�3r��v���چ�zQa�e�����W��Z?nu�϶94`�#�Œ����^U������zuq��]���rX�CƕE4fj�n^����n�;�dR�i�E�o�I��ᧇ�=j�g�S�nI�5� i�I��-�P<��x��̏�\��Xd41&c��Y��������C,/�32'�y��/�w��z'a�ƺ�G����ŏ*u�L!� W����s=2Z����'��ɳ]�D*K<�D�mW�t�xt��o\hrѺ v��-��:�^�Rm����ؚ%�i��w����ō�b6�k߇k-�v�� j�wp���V�����ؚ%��J�q���GJǄʒMugF���B0=B�5�|�t�rf\�a���ѵ� �Û�����:oB&��`�7�U��NA�oo�,� Dq��r�ԑu!����E(���y��5T� �V�>�z�u���}̲�p��l4 ��DA��WH#�5Q�Z���`�t�B��a���e�I'��\	Pc�|�zQ�\0I�/���"P%�sԪ5����,�8�����O������j�`\D8��M�� ��5Ng9��@H!l��7�
�D��Ոv�Ё<Hme`İhf���yH^}h�F������׮H�Q(\Oج'&��5K<L��>3��o�9J��6%����^Lɤ'[\���E�o̗%��D���%4���&��,դ����8җ�Ni2���v�ZmTݑ��+�X�6����X���`	��;mE�i�~��o��,�8�ڣ��^�� 3ix+�ѥg��h�4��-.F���PY���p�k���>
��w㐒i}��*�L� �GTí.�=���v	-��]��d޲��V�� N;�;�s�Q��2�zx�C�^�7��34W�����FV��l���Y�����}�Ң�N�6vetX��g$ᝄ���Q&���d ���[�,e���
r�ȴ��ț$��1�x	�O5�&0,9�L��~����z{����� a���㛖ll�!����"�Ĭ+8��*�Ud����M'.��?L}4O"Y�ˀ$�z�!�]��]�%�G�f���68��8N�#VZ��-��3��}=2Z��	#l�*�[�H����Lѩ�<�*���~m�u��Dd�],B7�d$��v��
���fϼ@���r"�e�ދ$�G'�H����:��67̕;ݱ�"����R�JW���7�m��ph��p��4�#�a�$7�Z	�d����20��#���V��6����3�X��ԧ~���.����M����7^z]5n,�:n�=�]�ˢ�}��������&��8�y�-r�
��,;���"�k�s�W�N;G�ظ����������m&�9��˚�n��m��:��>�:�7G� (��XLv�� ���\t���P6��jlC�Pf�P�z\����qz�0��{��Y��>V�d��3����>(X����JI#a��-�-RXJU��ʠ#��h�%f���ղwO��AV���7�	i�7��"P�g�8�:�����]�-C�-�&�z �����خJ7X���M��׆C!9�x
�|*�9'n%���g�e�_��p��ȱw�vƝr ɀ��
�2ty��bh��E5lS����,� �,<Q�cId(�����B!-'���`�8"��y[�=�.��f�2lPn�d6��,| '�'���̪!|�I,�C�JL�[i��h6K|�%�����8*���zG,p+c�� ����PN��\,B�
g 
  ����ն�Y�,�M�uf���(���*�����Y�eZK��-��dl٪�"���Z��ʗ��n��^��
������>�,��]�Ԯ�?�n?�)�M�!N��{��ըv�� <�j���+�&��Ε�i�5ku�(n�W#GaU���Ú%��'�����R��_�B��G�̍I���҆���"TQ�X��wq��5K<��޻��Ǩ������/7����bd�T��1#�d�>��ćA�ET;Y��I��Ә%�l�	����4�@Ī�XU��v&��������e5�� �Z@uJ�>�w��#��ſ �H5���	Y�W�o��%��}>Ëi�Ҏ�e�|���?X�q��/�ػ}0�}�\v�ؑ����CJD��R����y�FJ�A�%>{�6���ё�5��P���a��3Z��ܙ�6�z�}b�f��5?֩��	U����`��u�t��.�e�CS�$cD����}��jQ�L��=0����m�{ڄ�xlc���
���`�_�i�r]�)כ%*�T7b*������JsP��0����*��X�����'^o�x�*چ��8�Z�4�.f+�����@�@J�C���S}��f��'��9����X8�P����`6�?�|r�j�ßW�O������ŷ������]�z����/![�d�;��+Z1�$��wy:&�`�����?=p~}����������6�g�?k��O����	�ODN3<��zyw�������n���~���*
d䓣�j~�[�h���C��8��J��#����w߬~ܾ}��z{�<��|�ts�� �e����Ƒ�ɟ0��*>�B��6}8Ͻ�:|˷��%;��!��G=f�����n.��I �/Z������s�������}�����z{��������?��7�0����@�%AJ��7�}�T�T�_{Lf����4����&^̦+�SsUQ�N��Y�.YD�YCBZă$������F9�G�!t�˯�A{�sNB�yZ҄nKJ�e�~x������1l^���`����`���:::\��\��mq�P���m
�"��ƙ�w�_��LI��*փ�,>ذ�Q���$n���Fjdm��[V�-�}RG#���vfXo���3w�s�}(�e<e� �O�ҹ��w��:�S�C$�F���6J4@�u�[o?�8���}wu68�B#�r)����� 婊G�Q 5�1�~�Ik^}P��G�����g?��^�<]�H���כ�������%��1��"��$,脢Iq�afKf��@o�������{�q_^n����/���a��M�,4�)���a
eM�)�G>e�	�����iI�4��p�g�td3jt��)Æ�|c�)�o?�_����bT�X�7wW�?���yt�r��g�X<��>�l���$�m�	�H�LLw�67O�y"�L������_����@Mn		�DpEA����_�,�
l�X�=W�Hd�[�ԓM�L���`���@��������Sό!�J3+S���9��ي/��ٸ\�Wy���f��L�{4��O맷��!T����U�)O�.ol�H��Cg}���-�%�' �i d��h��k�phx���3�w�N3|��]^o�ABk�Fqb��fg���hO)��$���f7�GsJ|�_�PdS��}�5U='���<4�?]^]��Oj8�Z��\�N�T�Z�)�:Z�ŵ����*�}�Tȝ@�	:*�k0̭�����<�.����O�v�맗7�v�A��LML��eH�rH���`��ؤy�'1�9�ymHc�:�c���$E��J������$ ���v�~�������ͯ��d;����)�E��Z*ŕ�������hB2�l=��N�ƭ>�)|������Ӌ����������h��KZM�K#�r�]�V!�����k@�3I�֞�����1���E�8��P$[�L_��nF +ǈG��T��I�ێ����~���������L+4Sҹp�qT���O�������Z����n�ͨ�y���;�K�xs�y���u��L�ŋ�1�ls�e-`h�2�c�������ɦ�wJ-�L�!�<㏕Mm\�8k8_�������[�aw�iP�'�����S�2qe� ���T�CC�sB<��5M�%��dcFg��W�4[���ew�-�������=�lC��C�%�¶/vH�VJ�CŮ�IYK����Xx��}�y�]��>n���4����c}Ù��I��#'�S�X��U
�5^�r�R���`&Ho#J7��˻F��F�.����`�W(T{ԓK����6Y�+b�/�a�qQOj�3w���?�~�c��/۠5�SUqz�r����Y��ǂj:�Sn���M�f��'���&:{������y��������֧o^����q�7|�g'�C�#CCAf�gL���6��$w��k/��D�s����σ�y���y�>�m{�i�q�垎�����ٹ�rMY�*���������6�[�*�i6)\��'t6��o��� �
��      �   �   x�m�Q� C��.vB�
w���c�թvZ���',�f����hy�&Z��
����HqN��6e�gu��^�}a>}a\5�Ug����[�պ�Krc(�;c��K�E�<ƽ},�	m�HY��m0u�G�׬w�s����J      �      x���Ϯ�iV��q�(�,��-�+�";�<E�� A����[MHp�0��)U����oo�U�ҥ�_���_������ۿ��y�b��/�K�/V?���������W���_���������������������?��o��7�������_��?�����<��������������˿�Ͽ�����ğ����׿����?�͟��������������͟�ǿ����ߝ�����ٲ����O�����ۏ�g��?�����������ߓ����x���������������������o��7�ۿ�������o��O���~��~��u��/��^�_�_��o��?�����f�Of��n�~m��?���/�K����������������/�r��'�u7~)#�����\�}���?��+����x�o�~���7����D�6�=�,��<��g��O=g����`�-��?���:����:[Vg^gCu[�u�����΁����Y��y�չl�ֹ�:��:�s�:�����9eu��u.T�u�?�ο�~�o~?���i��ۄ�_̱�p�����������d��������|O������zQ���P����Q�#�Y���y��Cujp�Fvj�N��N����N���t����թÝ:٩�:��;u�S�;u�S�u��w�T�wd���4��4�N�4�NC�i|�iP�&�i�������Ӥ:M�Sa����:���?���oZp�$`2�`��	�Q��`�d�b2c���Q��`�d$e2�e��1�Q��`�d�g2h��E�Q��`�d$j2�j��Y�Q��`�d�l2m��m�Q��`�d$o2�o�Q��`�d�q2r�Q��`�d�\��O��"���(�d�E2#�N#���(��?l�Nz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��HNz$�y$��#9��H�'�Л�:��#9��HNz$�y$��#9��HNz$�y$��#9���4H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R�)H�:��{��<R���&�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���GJ�#%�R��{���G���"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H{�"=R�<R}�H��vڤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RS�a�ԤGj�G��=RSi~�N��H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#쑆�H��H�G�#���iui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��=Ғiui��HKy��a;=�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(�t�G:�#��#���(����$�m���uY���签9(ַ�����\ߺ��w��`�V,L���XNz��b)����bI��օ�~O��&V,����XSz��b)����bI��օ�~���&V,̕��XXz��b)����bI��օ�~ϖ�&V,���X]z��b)����bI��օ�~��&V,L���Xbz��b)����bI��օ�~O��&V,����Xgz��b)����bI��օ�~���&V,̚��Xlz��b)����bI��օ�~ϛ�&V,���Xqz��b)����bI��օ�~��&V,L���Xvz��b)����bI��օ�~O��&U쯟}XC͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3O��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c    ��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c�)~�b5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<�\l��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O������-�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0��?p�������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��.vP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O��������.j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�y���C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`��2O�%� �}�b߭ϋ}�P�o�-� �}�b߭ϋ}�X��yz�bu�������[��%��[��yz�X��yz?A�ՙ�_���R����.�4O�'�b�7O�'X��yz�bu�������[��%��[��yz�X��yz�bu�������[��%��[��yz�X��yz�bu�������[��%��[��yz�X��yz�bu�������[��%��[��yz�X��yz�bu�������[��%��[��yz�X��yz�bu�������[��%��[��yz�X��yz�bu�������[��%��[��yz�T��~R�a5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<�\���Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O�������<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0�?p�������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��.�P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S���6j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅�    ��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙy���A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3O���yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b��~�b5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<ů��þ`�o]V��y�o*�-�ž`�o]V��y�o+6O� Z��<�[@��yz�t��yz��b�7Oo+6O� Z��<�[@��yz�t��yz��b�7Oo+6O� Z��<�[@��yz�t��yz��b�7Oo+6O� Z��<�[@��yz�t��yz��b�7Oo+6O� Z��<�[@��yz�t��yz��b�7Oo+6O� Z��<�[@��yz�t��yz��b�7Oo+6O� Z��<�[@��yz�t��yz��b�7Oo+6O� Z��<�[@��yz�t��yz��b�7Oo+6O� Z��<�[@��yz�t��yz��b�7Oo�*��O�>���Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'���u�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1�?p������ �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��.6Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S���j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y���F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3O�;�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�i�b5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<�\����� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0OG���u�|�w ,��ˊ}�>/�mBže��w ,��ˊ}�>/�mb����@�ՙ�w(�2Oo�.�4Oo]X����mb����@�ՙ�w(�2Oo�.�4Oo]X����mb����@�ՙ�w(�2Oo�.�4Oo]X����mb����@�ՙ�w(�2Oo�.�4Oo]X����mb����    @�ՙ�w(�2Oo�.�4Oo]X����mb����@�ՙ�w(�2Oo�.�4Oo]X����mb����@�ՙ�w(�2Oo�.�4Oo]X����mb����@�ՙ�w(�2Oo�.�4Oo]X����mb����@�ՙ�w(�2Oo�.�4Oo]X����mR���Iч5�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0��?p���'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��.6P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S���&j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�y���B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3O�ۨyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i~�b5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<�\��i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O������=�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����(���7�>�; �vež[��6�b�2[�; �vež[��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�b����j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y��XG͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3O��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)�b5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)    Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<�\l�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O������m�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�4?p��������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��.vQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O��������j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y���B>�; ��ež3��6�b�2[�; ��ež3��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�ba������ӻK���LK���.,�{��6�b����j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y2�<j�Lh�0O��'�͓��Ʉ�� �d�y��XG͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3ON�'G͓͓��1��yr�<��<9`�3O��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)h��y
�y
�<f��6O����� �S`�)�b5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<%m�5O)4O	����S��)Q�B�yJ�<�\l�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O�����S�橄� �T�y*�<j�Jh�
0O������m�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�Դyj�<��<5`�3OM��F�S�S�1�4?p��������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��6O�������`�ih�4�y�y�<f��.vQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-    m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O�������iQ�B�yZ�<-m�5O+4O��������j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y:�<j�Nh�0O�����ӡ���� �t�y�_Gɇ}�bߺ��w��b�&T�[f�}�bߺ��w��b�&V,l���X�yz��b)����bI��օ�~o��&V,l���X�yz��b)����bI��օ�~o��&V,l���X�yz��b)����bI��օ�~o��&V,l���X�yz��b)����bI��օ�~o��&V,l���X�yz��b)����bI��օ�~o��&V,l���X�yz��b)����bI��օ�~o��&V,l���X�yz��b)����bI��օ�~o��&V,l���X�yz��b)����bI��օ�~o��&V,l���X�yz��b)����bI��օ�~o��&U쯟}XC͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3OF�'C͓	͓��0�d�y2�<��<`�3O��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c��i��yr�yr�<9f��6O��'�'̓c�)~�b5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<m�5O!4O����S��)P�B��y
�<�\l��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O�����S��)��)�yJ�<%j�Rh�0O������-�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0�T�y*�<��<`�
3OE��B�S	�S�0��?p�������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��6O������Sc�i�Ԩyj�yj�<5f��.vP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O�������iP�4B�4�y�<m�5O#4O��������.j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�yZ�<-j�Vh�0O�����Ӣ�i��i�y���C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`�3OG��C��	����0�t�y:�<��<`��2O��(��� X�[��n}^�ۄ�}�l�� X�[��n}^��Ċ���;��3O�P,e��2],i�޺������Ċ���;��3O�P,e��2],i�޺������Ċ���;��3O�P,e��2],i�޺������Ċ���;��3O�P,e��2],i�޺������Ċ���;��3O�P,e��2],i�޺������Ċ���;��3O�P,e��2],i�޺������Ċ���;��3O�P,e��2],i�޺������Ċ���;��3O�P,e��2],i�޺������Ċ���;��3O�P,e��2],i�޺�����ۤ�����k�y2�y2�<f��6O��'�'̓a��h�d�y2�y2�<f��6O��'�'̓a��h�d�y2�y2�<f��6O��'�'̓a��h�d�y2�y2�<f��6O��'�'̓a��h�d�y2�y2�<f��6O��'�'̓a��h�d�y2�y2�<f��6O��'�'̓a��h�d�y2�y2�<f��6O��'�'̓a��h�d�y2�y2�<f��6O��'�'̓a��h�d�y2�y2�<f��6O��'�'̓a��h�d�y2�y2�<f��6O��'�'̓a���b5O.4O�'�̓���Q��B��yr�<9m�5O.4O�'�̓���Q��B��yr�<9m�5O.4O�'�̓���Q��B��yr�<9m�5O.4O�'�    ̓���Q��B��yr�<9m�5O.4O�'�̓���Q��B��yr�<9m�5O.4O�'�̓���Q���g�vsd�adQxZ!f��?�	Y 3fA�
dH�H-|��7�U���'4O�'�̓���Q��B��yr�<9m�5O.4O�'�̓���Q��B��yr�<9m�5O.4O�'�̓���Q��B��yr�<9m�5O.4O�'�̓���Q��B��yr�<9m�5O.4O�'��S|��j�Bh�0O�����S��)��) ��y
�<j�Bh�0O�����S��)��) ��y
�<j�Bh�0O�����S��)��) ��y
�<j�Bh�0O�����S��)��) ��y
�<j�Bh�0O�����S��)��) ��y
�<j�Bh�0O�����S��)��) ��y
�<j�Bh�0O�����S��)��) ��y
�<j�Bh�0O�����S��)��) ��y
�<j�Bh�0O�����S��)��) ��y
�<j�Bh�0O�����S��)��) ��y�/��D�S
�S�)1�yJ�<��<%`�3OI��D�S
�S�)1�yJ�<��<%`�3OI��D�S
�S�)1�yJ�<��<%`�3OI��D�S
�S�)1�yJ�<��<%`�3OI��D�S
�S�)1�yJ�<��<%`�3OI��D�S
�S�)1�yJ�<��<%`�3OI��D�S
�S�)1�yJ�<��<%`�3OI��D�S
�S�)1�yJ�<��<%`�3OI��D�S
�S�)1�yJ�<��<%`�3OI��D�S
�S�)1�yJ�<��<%`�3O�[�y*�y*�<f��6O������Sa�h�T�y*�y*�<f��6O������Sa�h�T�y*�y*�<f��6O������Sa�h�T�y*�y*�<f��6O������Sa�h�T�y*�y*�<f��6O������Sa�h�T�y*�y*�<f��6O������Sa�h�T�y*�y*�<f��6O������Sa�h�T�y*�y*�<f��6O������Sa�h�T�y*�y*�<f��6O������Sa�h�T�y*�y*�<f��6O������Sa橿�b5O-4O����S��Q��B�Ԁyj�<5m�5O-4O����S��Q��B�Ԁyj�<5m�5O-4O����S��Q��B�Ԁyj�<5m�5O-4O����S��Q��B�Ԁyj�<5m�5O-4O����S��Q��B�Ԁyj�<5m�5O-4O����S��Q��B�Ԁyj�<5m�5O-4O����S��Q��B�Ԁyj�<5m�5O-4O����S��Q��B�Ԁyj�<5m�5O-4O����S��Q��B�Ԁyj�<5m�5O-4O����S��Q��B�Ԁyj�<�\��i��i �4�y�<j�Fh�0O�����Ӡ�i��i �4�y�<j�Fh�0O�����Ӡ�i��i �4�y�<j�Fh�0O�����Ӡ�i��i �4�y�<j�Fh�0O�����Ӡ�i��i �4�y�<j�Fh�0O�����Ӡ�i��i �4�y�<j�Fh�0O�����Ӡ�i��i �4�y�<j�Fh�0O�����Ӡ�i��i �4�y�<j�Fh�0O�����Ӡ�i��i �4�y�<j�Fh�0O�����Ӡ�i��i �4�y�<j�Fh�0O������]�<��<-`�3OK��E��
���i1�yZ�<��<-`�3OK��E��
���i1�yZ�<��<-`�3OK��E��
���i1�yZ�<��<-`�3OK��E��
���i1�yZ�<��<-`�3OK��E��
���i1�yZ�<��<-`�3OK��E��
���i1�yZ�<��<-`�3OK��E��
���i1�yZ�<��<-`�3OK��E��
���i1�yZ�<��<-`�3OK��E��
���i1�yZ�<��<-`�3OK��E��
���i1�t_p��������a��h�t�y:�y:�<f��6O�������a��h�t�y:�y:�<f��6O�������a��h�t�y:�y:�<f��6O�������a��h�t�y:�y:�<f��6O�������a��h�t�y:�y:�<f��6O�������a��h�t�y:�y:�<f��6O�������a��h�t�y:�y:�<f��6O�������a��h�t�y:�y:�<f��6O�������a��h�t�y:�y:�<f��6O�������a��h�t�y:�y:�<e��%_�s ,�Y����x��&T��� �}�e�>�>^쳉��� Z��<=��b)��,�Œ��Y�y��lb����9��3O�-�X�<=�t��yzօ�~�<=�X��yz�����s(�2O�2],i��ua��7O�&V,l��h�:������ӳLK��g]X���ӳ���� Z��<=��b)��,�Œ��Y�y��lb����9��3O�-�X�<=�t��yzօ�~�<=�X��yz�����s(�2O�2],i��ua��7O�&V,l��h�:������ӳLK��g]X���ӳ���� Z��<=��b)��,�Œ��Y�y��lRž�)�b5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<m�5O&4O�'�̓���P�dB�d�y2�<�\���Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O��'�͓��Ʌ����yr�<9j�\h�0O�������<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0��y
�<��<`�3OA��@�S�S �)0�_p�������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��6O������Sb�)i�yJ�yJ�<%f��.�P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��P�TB�T�y*�<m�
5O%4O����S��6j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O��� �  ��S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙyj�<5j�Zh�0O�����S�橅��Ԙy�/��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3OC��A���� �i0�4�y�<��<`�3O���yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b�ii�yZ�yZ�<-f��6O�������b���b5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<m�5O'4O��������P�tB�t�y:�<��N��wl���E��x��(��;�v�n���r�cO��څ��{�mW��cD��z��vI��+��<�zG�va�^`��Q���.���i�]�C���v?��Q�]�D��vu(�=F�K��wo��QＲ��Өw�k�Q��]�z��R@���%��;�l��H��څ��{�mW��cD��z��vI,��+��<�zG�va0�^`�Ց���.���i�]�M���v?��Q�]�N��vux�=F�K�wo�TＲ���w�kFT��]�z��R����%)�;�l����څ9�{�mW��cD��z��vIT��+��<�zG�v�ߕ}�ƺ*S�*#\�q��pWe��2��2�U�wUƺ*S�*#\�q��pWe��2��2�U�wUƺ*S�*#\�q��pWe��2��2�U�wUƺ*S�*#\�q��pWe��2��2�U�wUƺ*S�*#\�q��pWe��2��2�U�wUƺ*S�*#\�q��pWe��2��2�U�wUƺ*S�*#\�q��pWe��2��2�U�wUƺ*S�*#\�q��pWe��2��2�U�wUƺ*S�*#\�q��pWe��2��2�U�wUƺ*S�*#\�q��pWe��2��2�U���n�YW�JW儫r�U9uU�tUN�*�\���YW�JW儫r�U9uU�tUN�*�\���YW�JW儫r�U9uU�tUN�*�\���YW�JW儫r�U9uU�tUN�*�\���YW�JW儫r�U9uU�tUN�*�\���YW�JW儫r�U9uU�tUN�*�\���YW�JW儫r�U9uU�tUN�*�\���YW�JW儫r�U9uU�tUN�*�\���YW�JW儫r�U�\տ.��|��_���>y����>��G�؟^��7�uJ����?�����h~��oa���_������@����h|+�O��{����_������?�����'����X���χ}���u�����-���oe��^�Wֳ��|-��#����o��>�^������W|��<�x�O����V�{����{�?��{���=��o�����ߙ��oc}�'�w������/�$}�D      �   �   x���A
�0����@e2�4.C��HU4�7�-�����M�V��&��_�"T�Y:I�H����h�����s�׺��,Y� �8� B!���ɧ����
���]]�۴�8r㬭
����u���H���C��+�`�V��Z�N���{��$�P�K�V��+Q_��l��c5[#      �      x�3�4�4�bN#.N#Nc�=... "[�      �   �   x����
�0�s�}�I�T��2/Sq
��:����7n2/
��O�%d`^�]��:?����.}^�$�V��L\�ʘ���`cK���&EDR@7���`�p��bE/�/��\��#�R�w����m���yu�u˧��z��,0Zc�&��7U���P"��g���h�H�P��O��L���������ozJ�;;_      �   }   x�u��� Cϸ2�z����Ð�.\d#=����*�"4��}/sw�޲0����"�[]�&����_���=�x%��1�5̳�aVH���K���X?5��An\��r��n����&";7�      �   �   x���1�0Eg��@+�%q�n]�&�2�A�B��S�@l�<Y�{_߂Fn*l*F��,�:`�Z����īw:ʐ�(A���e�u+�O���Os��8�;�������n��;�7��7}av��CM�����yr���R�6+��w�U@E��VJ� �k��      �   m   x�u�11D�ھ��x�HP�D��*K����z��Oߥ��^�3@:p�ϲ�=b�)�@�K6�,,��AR�Z�h��� \y�!�u{�����{���>��O����(      �   �   x����n�0�g�)����lI��?�(�v�,Y��[��}��q��1�\�>��ݹ<~ϧ��M�iz^.���U�@Y��8\Ҳ���y��J!��-���z"x�~������7��r,OTӦz7����woͬ,�^ k�T�ƙ�uR3N�.����1��Ǵ��^�
�e�xcE�ڷM��2il7· 	|*�5�럫}�d��H6720J�	x��{%ƾ\m9FwP|�t�~�y!�R�T��      �   w   x�5��
�@E�;_��m��Y�lm�aV�Iпw,,Ϲp�l&f0���U�y�ڢ��q�ru���GYEA)�'�裡��8#�U�RL�f���_14�W������%�/p�#J      �   �   x�=���0E�ӏ1��\6l �H���
ci�m(�	���=g�^	��3B:B�����D��Όr����Ca,ޞ���(R�LT:��R�i���_t��m�����d9'���MT����2��MVj����/$rq
o�a=�\��{j,�����͕RP�}�� �D�      �   >   x�3�H-*����2��/JO��,N,�
�ss:%�es:q�p�V$g$楧r�r��qqq ��      �     x���_k�0ş�ȃσ���M3Av�З�s�L"Il7J���sԬ�C�B��=�{�C� l:S)[j�?���j�*?�wu�:i?����K�-�:�T�Jp��-} -vr����xx���{n���Ͳ�sw?��*ΫlU��
�6\�9ʔ�Z�s��y?��Ŗ�JCk˕�?�f硒N23�fNm��Sח�)ۚTd¶&������e��a�h%0�;0V����,�{�����d��o/˹�� 3`�y�ȓ[�r[|��t�t1'      �   m   x�3�,pLN�/�+���4B�p9>�)�E@	C���(����2�,N�KI-r�t�D�p�r���%�'&�d��qb�p�q�$��Ƈp�Y\�`U��+F��� O5       �      x�3�tIM�,�2�t.JM2b���� C�u      �   �   x�]��
�0Dד�����2m(d�,t㦚k��DҨ���v#��{�F@���Z�l�'����C�u=�S�F:�ʡ��^�@���K��O�Y���7��{�RB^6�b|�n#\B'����<?��Q*�jk�<j'wol�s�&&�L��˱{���=������W�;���0b�})Dg      z      x������ � �      |   &   x�3�t�,�2�*-.�L�L�2�v
��qqq u!�      ~   J   x�3�4��t���\F���A��ř�y
A�I9��A�N�F\Ɯ&���
.�99�E@��1W� H�]      �   I   x�3�	�q�4�4���44�4�4�2�t��w
��bƜ�..�@1#� r�pF:�E�t�D��\1z\\\ ���      �   f   x�3�LLN�/�+�/�,H��t����K�,�L)M�Qp��L�+Q�M�KLO�1!���P��8s�y(8��%����j�����(kMP�:�K��1z\\\ �Qu      �   .   x�3��H,J-�t�����S��9���R���@A�+F��� i)3      x   �  x���͎�0��7Oq��4��?�Hm
��Q[�ƀI(`S������R7��~�|�i�pq�W��J���#�@�5���)�Z���im�</|^���I�i�
����@��L���>�kD#Ɩit���rƺ�RA���y-�3��,5���C�&�B'_>0����F�3+.�q�w�X��8\e���UG��5ݬ�Ö��v=;0T�Mjb�W�z�u=���X�I\���9%IEQD��A��s�+�Έ8�#TU,��Q�3Q��!��n��v��1�p���\����+������M��20�݌Ҹo�N�[���^7ES�93��^�;ܭG}��F�z�i�:1�降&�̭�2����	l<��=�/��y���
YD?��rY4��w�5��&��n�G��W�Z���7����      �   �   x�E��!C��c*�@��bb8�N�����=���!�y�3%\8S&TJ,z��Y؀���b��>{�<���8���9���u-_�٢w�]�-`�[c;��9sA�F����b�afD�ʊ�wze%8�`�Y��o���l��QA��0��3�5�      �      x������ � �      �   �   x�=P�!;���Cy�=�w�Y<���aZ�ih��B�U��8}��<�F��qM�=[�B�^k��RH(*o�ٚ.�*k�
�w�k�æ�i�V��[�#���9�� 	���H�+P3.�dK���W�WZ��@�/��j�E�z+%�=��>6�����U�?kl���l�w~_��*;3{      �   �   x�m���0Dg�+�t��V`ga��HTJSԈ�oA��1��+�B���0�.�.�?�s��
54�h�C ��j��(ɦ�V��ا3Grݼ�=��u6J:�,��[�X��Jd$��N��:�K�1u�foq^IJT�7�J�9?���j���5��'��抈MWiL      �     x���Mn�0FמS�!$Q��L�A�&h�E�l{����DK�������X�YԗҔ�䝛>~����6½w�>\o����>���_����r���)�\�Z���\+�V8�E-έ���|�b���"���r�k�o�=���M�����U�y*��o}��x���[�bn��/g-��^)ݬ�?�o��Ri�O��O�4��\��̚����/_�O�W��#�o��]nō��Ce� D�^� l��֤��X�H�����aH�E�c����p��`'�.�DNq��5(���/QZ��J���dHn�����F�a��U6H6T��VW��<xk��ln]7Ra�C�f)fl�R�������% c�9�ʭK�C��F������*�EWC��F� ��[(k�U�Uae�> �c$���表z|g����[������h$�Rk�����d������dQC�&x+x<G��Y���	��ƣ�Z+n�e�����1n�)�� n�����t9�6zV�x�R��qP����NNY�m�#F�	�vQ�oVz��Fo5�Ƭ=xXOx��U<��ib�HO{�eڍ<��5XCz�cL��>�����=�1D+y8f�uY�h�(@��A`�G4`
�w��O.��"��Y|�	Ȩ��2��x'�Q#
0�=�{2zD�AY��Y|�����8>d�h(��ցk4gKݸ�P��Wak<c�$VϜȭ��8���e�3�
��5b�Ԕ_�PZǭ��֦��n�D�5���tA��ـd���c�T���'�N�'6��      �   �   x�m��n�0�ϛ�����\�P�� �z�TY�*Ŏl���w�L��ܬ�oǻ�8��fO%����dc Ơ��ވr����@�=�d
4�I 8Ljw��������l�n�:����t}�IF$I�Y{$��=P��h�3W�Q���b�CΘ`�SL�$Fܷ�����yp.�)�ĳ�D���!67�7>`K������%B2)r9ͱ]�U���9:9�:�Ic_�)���	vή�^��F���l���%˲�`�L      �   V   x�3�t�/*�/J,IUpL.���+�����)JLIU�/Hʀ�9��3<���KK|S�J��3�tLN�/�+)�12�ҹb���� ٵ$      �   C  x�mϻr�@ �����E)�#WȤᶊ��uUx�d2&���tߜ WEq)���dp�=����eVս�����Zу�W%�UvKRSn�^q��̻�Ӝ�Ě) ����=��H��4Q,���7C�8*��F5\��mR�b�̑�.��5C,,�,�뇙=�cx
W�j_����u}+���Z��a�酩$�^�t��|̉�����$��kb�F��l��)9C�;Ꭿ�We��n��p�*��N�4��,���G�\�f��������_�;"��>ծ �'����$n���ܤkg`�⣗��r���ɱ,����Q     