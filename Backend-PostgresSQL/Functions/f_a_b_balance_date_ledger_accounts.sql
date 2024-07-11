-- DROP FUNCTION IF EXISTS public.f_a_b_balance_date_ledger_accounts( daterange, numeric[], text[]);

CREATE OR REPLACE FUNCTION public.f_a_b_balance_date_ledger_accounts(
	p_date_balance_range daterange,
	p_account_types numeric[],
	p_accounts_list text[]
)
    RETURNS TABLE(
	"ledgerNo" character varying,
    "accountTypeID" numeric  ,
    "clientID" bigint ,
    "currencyCode" numeric,
    "entityTypeCode" bigint ,
    "ledgerNoId" bigint ,
    "dateOpening" date,
    "dateAcc" date)
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
 SELECT 
    "bLedger"."ledgerNo",
	"bLedger"."accountTypeID",
    "bLedger"."clientID",
    "bLedger"."currecyCode",
    "bLedger"."entityTypeCode",
    "bLedger"."ledgerNoId",
    "bLedger"."dateOpening",
    "balanceDate"."dateAcc"
   FROM "bLedger"
     CROSS JOIN LATERAL (  
		SELECT DISTINCT "bAccountStatement"."dateAcc"
		FROM "bAccountStatement"
		  WHERE (p_date_balance_range ISNULL OR  p_date_balance_range@>"bAccountStatement"."dateAcc")
		UNION
		SELECT DISTINCT "bLedgerStatement"."dateAcc" 
		FROM "bLedgerStatement"
		WHERE (p_date_balance_range ISNULL OR  p_date_balance_range@>"bLedgerStatement"."dateAcc")
	 ) "balanceDate"
  WHERE
  "bLedger"."dateOpening" <= "balanceDate"."dateAcc" AND
  (p_accounts_list ISNULL OR "bLedger"."ledgerNo"=ANY(p_accounts_list)) AND
  (p_account_types ISNULL OR "bLedger"."accountTypeID"=ANY(p_account_types));
  
END;
$BODY$;

ALTER FUNCTION public.f_a_b_balance_date_ledger_accounts(daterange, numeric[], text[])
    OWNER TO postgres;
select * from f_a_b_balance_date_ledger_accounts(
	'[3/5/2023,3/7/2024]'::daterange,
										  array[10],null)
-- 										  array['ClearAll', '40820840PANDRW001', '40807840CLIEN3001' ]